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
  async find(ctx) {
    const user = ctx.state.user as JwtUser | undefined;
    if (!user) {
      return ctx.unauthorized();
    }

    const userFilter =
      user.documentId != null
        ? { documentId: user.documentId }
        : { id: user.id };

    const entries = await strapi.documents('api::order.order').findMany({
      filters: { user: userFilter },
      populate: '*',
    });

    return ctx.send({ data: entries });
  },

  async create(ctx) {
    const user = ctx.state.user as JwtUser | undefined;
    if (!user) {
      return ctx.unauthorized();
    }

    const body = ctx.request.body as { data?: Record<string, unknown> };
    if (!body.data) body.data = {};

    body.data.user = user.documentId ?? user.id;

    return await super.create(ctx);
  },
}));
