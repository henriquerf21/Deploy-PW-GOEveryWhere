export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    
    if (!data.orderId) {
      const lastOrder = await strapi.db.query('api::order.order').findOne({
        orderBy: { id: 'desc' },
      });
      const nextId = (lastOrder ? lastOrder.id + 1 : 1).toString().padStart(4, '0');
      const year = new Date().getFullYear();
      data.orderId = `#GG-${year}-${nextId}`;
    }
  },

  async afterCreate(event: any) {
    const { result } = event;
    const pointsUsed = result.go_points_used || 0;

    console.log('[GoPoints] afterCreate — go_points_used:', pointsUsed);

    if (pointsUsed <= 0) return;

    const order = await strapi.documents('api::order.order').findOne({
      documentId: result.documentId,
      populate: ['user', 'user.go_point'],
    });

    if (!order?.user) {
      console.warn('[GoPoints] afterCreate — sem utilizador');
      return;
    }

    const userGoPoint = (order.user as any).go_point;
    if (!userGoPoint) {
      console.warn('[GoPoints] afterCreate — utilizador sem GoPoints');
      return;
    }

    const newTotal = Math.max(0, (userGoPoint.points || 0) - pointsUsed);
    console.log(`[GoPoints] Decrementando: ${userGoPoint.points} - ${pointsUsed} = ${newTotal}`);

    await strapi.documents('api::go-points.go-points').update({
      documentId: userGoPoint.documentId,
      data: {
        points: newTotal,
        history: [...(userGoPoint.history || []), {
          date: new Date().toISOString(),
          orderId: String(order.id),
          amount: -pointsUsed,
          type: 'debit',
        }],
      },
    });
  },

  async afterUpdate(event: any) {
    const { result } = event;
    console.log('[GoPoints] lifecycle carregado! status:', result?.order_status);

    // Notificar Back-Office via SSE
    try {
      const { emitBoChange } = require('../../../back-office/utils/bo-event-bus');
      emitBoChange({
        entity: 'order',
        id: result.documentId || result.id,
        action: 'transition',
        meta: { status: result.order_status }
      });
    } catch (e) {
      console.warn('[BO-Bus] falha ao emitir mudança no lifecycle:', e.message);
    }

    if (!result?.order_status) return;
    const status = result.order_status;

    if (status.startsWith('S-13') || status.startsWith('S-14')) {
      try {
        const orderToCancel = await strapi.documents('api::order.order').findOne({
          documentId: result.documentId,
          populate: ['delivery']
        });
        const delivery = orderToCancel?.delivery;
        if (delivery && delivery.documentId) {
          const dStatus = delivery.delivery_status || '';
          if (!dStatus.startsWith('E-13') && !dStatus.startsWith('E-14')) {
            console.log(`[Lifecycle] Encomenda cancelada. Marcando delivery ${delivery.documentId} como E-14 Entrega Impossível`);
            await strapi.documents('api::delivery.delivery').update({
              documentId: delivery.documentId,
              data: {
                delivery_status: 'E-14 Entrega Impossível',
                notes: `Cancelado devido ao estado da encomenda: ${status}`
              }
            });
          }
        }
      } catch (err) {
        console.error('[Lifecycle] Erro ao cancelar delivery associada:', err);
      }
    }

    if (status.startsWith('S-15') && result.rating) {
      try {
        const orderFull = await strapi.documents('api::order.order').findOne({
          documentId: result.documentId,
          populate: ['user', 'courier', 'review']
        });

        if (orderFull && orderFull.courier && !orderFull.review) {
          console.log(`[Lifecycle] Criando review para a encomenda ${orderFull.id} com rating ${result.rating}`);
          
          await strapi.documents('api::review.review').create({
            data: {
              rating: result.rating,
              review_createdAt: new Date().toISOString(),
              order: orderFull.documentId,
              user: (orderFull.user as any)?.documentId,
              courier: (orderFull.courier as any)?.documentId,
              publishedAt: new Date().toISOString()
            }
          });

          // Recalcular rating do estafeta
          const courierDocId = (orderFull.courier as any).documentId;
          const allCourierReviews = await strapi.documents('api::review.review').findMany({
            filters: { courier: { documentId: courierDocId } },
            populate: []
          });

          if (allCourierReviews && allCourierReviews.length > 0) {
            const sum = allCourierReviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
            const avgRating = sum / allCourierReviews.length;
            
            await strapi.documents('api::courier-estafeta.courier-estafeta').update({
              documentId: courierDocId,
              data: {
                rating: avgRating
              }
            });
            console.log(`[Lifecycle] Rating do estafeta ${courierDocId} atualizado para ${avgRating}`);
          }
        }
      } catch (err) {
        console.error('[Lifecycle] Erro ao criar review ou atualizar rating:', err);
      }
    }

    if (!status.startsWith('S-11')) return;

    const order = await strapi.documents('api::order.order').findOne({
      documentId: result.documentId,
      populate: ['user', 'user.go_point'],
    });

    if (!order?.user) {
      console.warn('[GoPoints] sem utilizador na encomenda');
      return;
    }

    const earnedPoints = Math.floor((order.total_price as number) * 10);
    const userGoPoint = (order.user as any).go_point;

    if (userGoPoint) {
      const newTotal = (userGoPoint.points || 0) + earnedPoints;
      console.log(`[GoPoints] Atualizando: ${userGoPoint.points} + ${earnedPoints} = ${newTotal}`);
      await strapi.documents('api::go-points.go-points').update({
        documentId: userGoPoint.documentId,
        data: {
          points: newTotal,
          history: [...(userGoPoint.history || []), {
            date: new Date().toISOString(),
            orderId: String(order.id),
            amount: earnedPoints,
            type: 'credit',
          }],
        },
      });
    } else {
      console.log(`[GoPoints] Criando GoPoints para user ${order.user.id} com ${earnedPoints} pts`);
      await strapi.documents('api::go-points.go-points').create({
        data: {
          points: earnedPoints,
          user: (order.user as any).documentId,
          history: [{
            date: new Date().toISOString(),
            orderId: String(order.id),
            amount: earnedPoints,
            type: 'credit',
          }],
        },
      });
    }

    // Configurar Webhook/Email para encomenda concluída
    console.log(`[Webhook] Disparando webhook/email para a encomenda ${order.orderId || order.id} (S-11 Concluída)`);
    try {
      // Simulação do envio de email: cria o registo em communications se existisse a coleção
      // Como alternativa, fazemos um mock fetch a um webhook.
      await fetch('https://webhook.site/go-everywhere-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.completed',
          orderId: order.orderId || order.id,
          customerName: (order as any).clientName || (order as any).deliveryName || 'Cliente',
          email: (order.user as any)?.email,
          total: order.total_price,
          earnedPoints: earnedPoints
        })
      }).catch(err => {
        console.log('[Webhook] Simulação falhou silenciosamente (esperado se webhook não existe)', err.message);
      });
    } catch (e) {
      console.error('[Webhook] Falha ao enviar email/webhook:', e.message);
    }
  },
};