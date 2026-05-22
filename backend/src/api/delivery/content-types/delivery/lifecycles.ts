import { DELIVERY_TO_ORDER_STATUS } from '../../../back-office/utils/order-state-machine';
import { startGpsSimulator } from '../../../../utils/gps-simulator';

export default {
  async afterUpdate(event) {
    const { result } = event;
    const { delivery_status } = result;

    const delivery = await strapi.documents('api::delivery.delivery').findOne({
      documentId: result.documentId,
      populate: ['order']
    });

    const order = delivery?.order;
    if (!order) return;

    if (order.order_status?.startsWith('S-13') || order.order_status?.startsWith('S-14')) {
      console.log('[Delivery Lifecycle] Encomenda cancelada. Ignorando sincronização de estado.');
      return;
    }

    const newOrderStatus = DELIVERY_TO_ORDER_STATUS[delivery_status];

    if (newOrderStatus) {
      console.log(`[Delivery Lifecycle] Sincronizando Order ${order.documentId || order.id} para estado: ${newOrderStatus}`);
      try {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId || String(order.id),
          data: { order_status: newOrderStatus as any },
        });
        
        // Disparar o simulador GPS se o estado for S-09 Em Trânsito
        if (newOrderStatus === 'S-09 Em Trânsito') {
          if (order.storeLatitude && order.storeLongitude && order.deliveryLatitude && order.deliveryLongitude) {
            startGpsSimulator(
              strapi, 
              order.id, 
              order.storeLatitude, 
              order.storeLongitude, 
              order.deliveryLatitude, 
              order.deliveryLongitude
            );
          }
        }
      } catch (err) {
        console.error('[Delivery Lifecycle] Erro ao sincronizar Order:', err);
      }
    }
  }
};
