export default {
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

    if (!result?.order_status) return;
    const status = result.order_status;
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
  },
};