export default {
  async afterUpdate(event) {
    const { result } = event;

    // Verifica se a encomenda mudou para o estado terminal "S-11 Entregue" 
    if (result.order_status === 'S-11 Entregue') {
      
      // Procura a encomenda e popula a relação com o utilizador e os seus pontos 
      const order = await strapi.documents('api::order.order').findOne({
        documentId: result.documentId,
        populate: ['user.go_point'],
      });

      if (order.user) {
        // Cálculo: 10 pontos por cada euro (1€ = 10 pts) 
        const earnedPoints = Math.floor(parseFloat(order.total_price) * 10);
        const userGoPoint = order.user.go_point;

        if (userGoPoint) {
          // Atualiza o saldo existente e o histórico 
          const newTotal = (userGoPoint.points || 0) + earnedPoints;
          
          await strapi.documents('api::go-points.go-points').update({
            documentId: userGoPoint.documentId,
            data: { 
              points: newTotal,
              // Mantém um histórico para o cliente consultar [cite: 20]
              history: [...(userGoPoint.history || []), {
                date: new Date(),
                orderId: order.id,
                amount: earnedPoints,
                type: 'credit'
              }]
            },
          });
        } else {
          // Cria a entrada de pontos para o novo utilizador se ainda não existir
          await strapi.documents('api::go-points.go-points').create({
            data: {
              points: earnedPoints,
              user: order.user.id,
              history: [{ date: new Date(), orderId: order.id, amount: earnedPoints, type: 'credit' }]
            }
          });
        }
      }
    }
  },
};