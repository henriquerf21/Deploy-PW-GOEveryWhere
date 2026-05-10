
import { DELIVERY_TO_ORDER_STATUS } from '../../../back-office/utils/order-state-machine';

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

    const newOrderStatus = DELIVERY_TO_ORDER_STATUS[delivery_status];

    if (newOrderStatus) {
      console.log(`[Delivery Lifecycle] Sincronizando Order ${order.documentId || order.id} para estado: ${newOrderStatus}`);
      try {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId || String(order.id),
          data: { order_status: newOrderStatus as any },
          status: 'published'
        });
      } catch (err) {
        console.error('[Delivery Lifecycle] Erro ao sincronizar Order:', err);
      }
    }
  }
};
