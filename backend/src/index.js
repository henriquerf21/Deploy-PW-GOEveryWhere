"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
exports.default = {
    register({ strapi }) {
        const authController = strapi.plugin('users-permissions').controller('auth');
        const originalCallback = authController.callback;
        authController.callback = async (ctx) => {
            const provider = ctx.params.provider;
            await originalCallback(ctx);
            if (provider === 'google' && ctx.response.status === 200 && ctx.response.body.user) {
                const userId = ctx.response.body.user.id;
                const accessToken = ctx.query.access_token;
                if (accessToken) {
                    try {
                        const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
                        const googleData = await googleResponse.json();
                        const photoUrl = googleData.picture;
                        if (photoUrl) {
                            await strapi.entityService.update('plugin::users-permissions.user', userId, {
                                data: { picture: photoUrl },
                            });
                            ctx.response.body.user.picture = photoUrl;
                        }
                    }
                    catch (error) {
                        strapi.log.error('Failed to fetch Google profile picture', error);
                    }
                }
            }
        };
    },
    async bootstrap({ strapi }) {
        const io = new socket_io_1.Server(strapi.server.httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
        });
        io.on('connection', (socket) => {
            strapi.log.info(`[Socket.io] User connected: ${socket.id}`);
            socket.on('join_room', (room) => {
                socket.join(room);
                strapi.log.info(`[Socket.io] Socket ${socket.id} joined room ${room}`);
            });
            socket.on('chat_message', (data) => {
                io.to(data.room).emit('chat_message', data);
            });
            socket.on('gps_update', (data) => {
                io.to(data.room).emit('gps_update', data);
            });
            socket.on('courier_gps_update', (data) => {
                io.emit('courier_gps_update', data);
            });
            socket.on('order_status_update', (data) => {
                io.to(data.room).emit('order_status_update', data);
                io.emit('global_order_status_update', data); // broadcast to BO
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
                strapi.io?.emit('global_order_status_update', {
                    action: 'create',
                    model: event.model.singularName,
                    room: roomId
                });
                const { emitBoChange } = require('./api/back-office/utils/bo-event-bus.js');
                emitBoChange({ entity: event.model.singularName === 'order' ? 'order' : 'courier', id: roomId, action: 'create' });
            },
            afterUpdate(event) {
                const roomId = event.result.documentId || String(event.result.id);
                strapi.io?.emit('global_order_status_update', {
                    action: 'update',
                    model: event.model.singularName,
                    room: roomId
                });
                const { emitBoChange } = require('./api/back-office/utils/bo-event-bus.js');
                emitBoChange({ entity: event.model.singularName === 'order' ? 'order' : 'courier', id: roomId, action: 'update' });
            },
        });
        try {
            await ensureUploadPermissions(strapi);
        }
        catch (err) {
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
        }
        catch (e) {
            strapi.log.error('Bootstrap error (PWA permissions):', e);
        }
    },
};
async function ensureUploadPermissions(strapi) {
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany();
    for (const role of roles) {
        if (!['authenticated', 'public'].includes(role.type))
            continue;
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
