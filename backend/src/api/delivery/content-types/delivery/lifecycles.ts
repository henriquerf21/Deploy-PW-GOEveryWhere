
export default {
  async afterUpdate(event) {
    const { result, params } = event;
    const { delivery_status, order } = result;

    if (!order) return;

    // Mapeamento de estados da Delivery para a Order
    const stateMap = {
      'E-08 Pedido Recebido': 'S-06 Aguardando Aceitação',
      'E-09 A Caminho da Loja': 'S-07 A Caminho da Loja',
      'E-10 Na Loja / Em Recolha': 'S-08 Em Recolha na Loja',
      'E-11 Em Trânsito para Cliente': 'S-09 Em Entrega / Trânsito',
      'E-12 No Destino': 'S-10 No Destino / À Espera',
      'E-13 Entrega Confirmada': 'S-11 Entregue',
      'E-14 Entrega Impossível': 'S-14 Cancelada'
    };

    const newOrderStatus = stateMap[delivery_status];

    if (newOrderStatus) {
      console.log(`[Delivery Lifecycle] Sincronizando Order ${order.documentId || order.id} para estado: ${newOrderStatus}`);
      try {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId || order.id,
          data: { order_status: newOrderStatus },
          status: 'published'
        });
      } catch (err) {
        console.error('[Delivery Lifecycle] Erro ao sincronizar Order:', err);
      }
    }
  }
};
