import { Server } from 'socket.io';

export default {
  register({ strapi }: { strapi: any }) {
    const authController = strapi.plugin('users-permissions').controller('auth');
    const originalCallback = authController.callback;

    authController.callback = async (ctx: any) => {
      const provider = ctx.params.provider;

      await originalCallback(ctx);

      if (provider === 'google' && ctx.response.status === 200 && ctx.response.body.user) {
        const userId = ctx.response.body.user.id;
        const accessToken = ctx.query.access_token;

        if (accessToken) {
          try {
            const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            const googleData: any = await googleResponse.json();

            const photoUrl = googleData.picture;

            if (photoUrl) {
              await strapi.entityService.update('plugin::users-permissions.user', userId, {
                data: { picture: photoUrl },
              });

              ctx.response.body.user.picture = photoUrl;
            }
          } catch (error) {
            strapi.log.error('Failed to fetch Google profile picture', error);
          }
        }
      }
    };
  },

  async bootstrap({ strapi }: { strapi: any }) {
    const io = new Server(strapi.server.httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
    });

    io.on('connection', (socket) => {
      strapi.log.info(`[Socket.io] User connected: ${socket.id}`);

      socket.on('join_room', (room) => {
        socket.join(room);
        strapi.log.info(`[Socket.io] Socket ${socket.id} joined room ${room}`);
      });

      // Back-Office joins a dedicated admin room for targeted updates
      socket.on('join_admin', () => {
        socket.join('admin_room');
        strapi.log.info(`[Socket.io] Socket ${socket.id} joined admin_room`);
      });

      socket.on('chat_message', (data) => {
        io.to(data.room).emit('chat_message', data);
      });

      socket.on('gps_update', (data) => {
        io.to(data.room).emit('gps_update', data);
      });

      socket.on('order_status_update', (data) => {
        io.to(data.room).emit('order_status_update', data);
        // Notify only admin_room instead of broadcasting to ALL clients
        io.to('admin_room').emit('data_changed', { action: 'update', model: 'order', room: data.room });
      });

      socket.on('disconnect', () => {
        strapi.log.info(`[Socket.io] User disconnected: ${socket.id}`);
      });
    });

    strapi.io = io;

    // Sincronização Global via Lifecycles (RF16-RF20)
    strapi.db.lifecycles.subscribe({
      models: ['api::order.order', 'api::courier-estafeta.courier-estafeta'],
      afterCreate(event) {
        const roomId = event.result.documentId || String(event.result.id);
        // Notify only admin_room instead of broadcasting globally
        strapi.io?.to('admin_room').emit('data_changed', { 
          action: 'create', 
          model: event.model.singularName,
          room: roomId
        });
        const { emitBoChange } = require('./api/back-office/utils/bo-event-bus');
        emitBoChange({ entity: event.model.singularName === 'order' ? 'order' : 'courier', id: roomId, action: 'create' });
      },
      afterUpdate(event) {
        const roomId = event.result.documentId || String(event.result.id);
        // Notify only admin_room instead of broadcasting globally
        strapi.io?.to('admin_room').emit('data_changed', { 
          action: 'update', 
          model: event.model.singularName,
          room: roomId
        });
        const { emitBoChange } = require('./api/back-office/utils/bo-event-bus');
        emitBoChange({ entity: event.model.singularName === 'order' ? 'order' : 'courier', id: roomId, action: 'update' });

        // NE Extra: Send delivery confirmation email when order is delivered
        if (event.model.singularName === 'order') {
          const newStatus = event.result?.order_status;
          if (newStatus === 'S-11 Entregue') {
            // Run async without blocking the lifecycle
            (async () => {
              try {
                const order = await strapi.db.query('api::order.order').findOne({
                  where: { id: event.result.id },
                  populate: { user: true },
                });
                const userEmail = order?.user?.email;
                const publicId = order?.orderId || order?.publicId || `#${event.result.id}`;
                if (userEmail && process.env.RESEND_API_KEY) {
                  const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: 'GoEverywhere <no-reply@goeverywhere.pt>',
                      to: [userEmail],
                      subject: `GoEverywhere — Encomenda ${publicId} entregue! (Fatura)`,
                      html: `
                        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
                          <h2 style="color:#22c55e;">✅ Encomenda entregue!</h2>
                          <p>Olá,</p>
                          <p>A tua encomenda <strong>${publicId}</strong> foi entregue com sucesso.</p>
                          <p>A fatura detalhada encontra-se disponível na tua área de cliente.</p>
                          <p>Obrigado por escolheres a <strong>GoEverywhere</strong>!</p>
                          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                          <p style="color:#6b7280;font-size:12px;">GoEverywhere, Lda. — Entregas rápidas e de confiança.</p>
                        </div>
                      `
                    })
                  });
                  
                  if (!res.ok) {
                    const errRes = await res.text();
                    throw new Error(`Resend Error: ${errRes}`);
                  }
                  strapi.log.info(`[BO] Fatura / Email de entrega enviado via Resend para ${userEmail} (pedido ${publicId})`);
                } else if (userEmail) {
                  strapi.log.warn('[BO] RESEND_API_KEY não configurada. Fatura/Email não enviado.');
                }
              } catch (emailErr) {
                strapi.log.warn('[BO] Falha ao enviar email de entrega:', emailErr?.message || emailErr);
              }
            })();
          }
        }
      },
    });

    try {
      await ensureUploadPermissions(strapi);
    } catch (err) {
      strapi.log.warn('[BO] não foi possível garantir permissões de upload automaticamente', err);
    }

    try {
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
      if (publicRole) {
        const permissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
          where: { role: publicRole.id, action: 'api::courier-estafeta.courier-estafeta.find' },
        });
        if (permissions.length === 0) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: 'api::courier-estafeta.courier-estafeta.find', role: publicRole.id },
          });
        }
      }

      if (publicRole) {
        const p2 = await strapi.db.query('plugin::users-permissions.permission').findMany({
          where: { role: publicRole.id, action: 'api::delivery.delivery.find' },
        });
        if (p2.length === 0) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: 'api::delivery.delivery.find', role: publicRole.id },
          });
        }
      }

    } catch (e) {
      strapi.log.error('Bootstrap error (PWA permissions):', e);
    }
  },
};

async function ensureUploadPermissions(strapi: any) {
  const roles = await strapi.db.query('plugin::users-permissions.role').findMany();
  for (const role of roles) {
    if (!['authenticated', 'public'].includes(role.type)) continue;
    const actionsToGrant = [
      'plugin::upload.content-api.upload',
      'plugin::upload.content-api.find',
      'plugin::upload.content-api.findOne',
    ];
    for (const action of actionsToGrant) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action, role: role.id },
      });
      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: role.id },
        });
        strapi.log.info(`[BO] permissão ${action} criada para o role ${role.type}`);
      }
    }
  }
}
