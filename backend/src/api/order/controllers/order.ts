/**
 * order controller
 *
 * Lista encomendas só pelo utilizador JWT (sem filters[user] na query REST).
 * Evita ValidationError "Invalid key user" quando o role não tem permissão
 * de leitura na coleção User usada em filtros de relação.
 */

import { factories } from '@strapi/strapi';

type JwtUser = { id: number; documentId?: string };

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  // Mantemos o find para filtrar apenas as encomendas do dono do token
  async find(ctx) {
    const user = ctx.state.user as JwtUser | undefined;
    if (!user) return ctx.unauthorized();

    const userFilter = user.documentId ? { documentId: user.documentId } : { id: user.id };

    const entries = await strapi.documents('api::order.order').findMany({
      filters: { user: userFilter },
      populate: '*',
      sort: 'createdAt:desc'
    });

    return ctx.send({ data: entries });
  },

  // Novo Create: Injeta o utilizador e evita o erro de "Invalid Key"
  async create(ctx) {
    const user = ctx.state.user as JwtUser | undefined;
    if (!user) return ctx.unauthorized();

    const body = ctx.request.body as { data?: any };
    const orderData = body.data || {};

    try {
      // Usamos a API de Documents diretamente para evitar a validação de permissões de campo do REST
      const entry = await strapi.documents('api::order.order').create({
        data: {
          ...orderData,
          user: user.documentId ?? user.id, // Injeção forçada no lado do servidor
          publishedAt: new Date(), // Garante que fica logo publicado se draftAndPublish estiver ativo
        },
      });

      return ctx.send({ data: entry });
    } catch (error) {
      return ctx.badRequest('Erro ao criar encomenda', { details: error.message });
    }
  },
}));