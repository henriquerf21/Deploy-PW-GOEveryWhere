"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_state_machine_js_1 = require("../../../back-office/utils/order-state-machine.js");
const gps_simulator_js_1 = require("../../../../utils/gps-simulator.js");
exports.default = {
    async afterUpdate(event) {
        const patch = event?.params?.data || {};
        const gpsOnly = ((patch.courierLatitude != null || patch.courierLongitude != null)
            && patch.delivery_status == null);
        if (gpsOnly)
            return;
        const { result } = event;
        const { delivery_status } = result;
        const delivery = await strapi.documents('api::delivery.delivery').findOne({
            documentId: result.documentId,
            populate: ['order', 'courier']
        });
        const order = delivery?.order;
        if (!order)
            return;
        if (order.order_status?.startsWith('S-13') || order.order_status?.startsWith('S-14')) {
            console.log('[Delivery Lifecycle] Encomenda cancelada. Ignorando sincronização de estado.');
            return;
        }
        const newOrderStatus = order_state_machine_js_1.DELIVERY_TO_ORDER_STATUS[delivery_status];
        if (newOrderStatus) {
            console.log(`[Delivery Lifecycle] Sincronizando Order ${order.documentId || order.id} para estado: ${newOrderStatus}`);
            try {
                const orderDocId = order.documentId || String(order.id);
                const orderPatch = { order_status: newOrderStatus };

                const rawItems = order.items && typeof order.items === 'object' && !Array.isArray(order.items)
                    ? order.items
                    : {};
                const boMeta = { ...(rawItems.boMeta || {}) };
                const events = Array.isArray(boMeta.events) ? [...boMeta.events] : [];
                
                const courierName = delivery?.courier?.fullName || delivery?.courier?.firstName || 'Estafeta';
                const courierId = delivery?.courier?.id || null;
                const notes = String(delivery?.notes || result?.notes || '').trim();
                
                events.push({
                    at: new Date().toISOString(),
                    action: delivery_status,
                    actor: { id: courierId, name: courierName, role: 'courier' },
                    meta: { 
                        source: 'pwa', 
                        message: String(delivery_status).startsWith('E-14') ? notes : '' 
                    }
                });
                
                boMeta.events = events;

                if (String(delivery_status || '').startsWith('E-14')) {
                    boMeta.impossibleReport = {
                        reason: notes,
                        at: new Date().toISOString(),
                        courierDocumentId: delivery?.courier?.documentId || null,
                    };
                    orderPatch.courier = null;
                }

                orderPatch.items = { ...rawItems, boMeta };

                await strapi.documents('api::order.order').update({
                    documentId: orderDocId,
                    data: orderPatch,
                    status: 'published',
                });

                if (String(delivery_status || '').startsWith('E-14')) {
                    strapi.io?.emit('global_order_status_update', {
                        room: orderDocId,
                        status: 'S-06',
                    });
                }
                // Simulação GPS no servidor só se GPS_SIM_SERVER=true (por defeito a PWA é a fonte)
                if (process.env.GPS_SIM_SERVER === 'true' && newOrderStatus === 'S-09 Em Trânsito') {
                    const roomId = order.documentId || String(order.id);
                    if (roomId && order.storeLatitude && order.storeLongitude && order.deliveryLatitude && order.deliveryLongitude) {
                        (0, gps_simulator_js_1.startGpsSimulator)(strapi, roomId, order.storeLatitude, order.storeLongitude, order.deliveryLatitude, order.deliveryLongitude, order.courier?.documentId);
                    }
                }
            }
            catch (err) {
                console.error('[Delivery Lifecycle] Erro ao sincronizar Order:', err);
            }
        }
    }
};
