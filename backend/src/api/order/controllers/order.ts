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
    const payload = body.data ?? {};

    const created = await strapi.documents('api::order.order').create({
      data: {
        ...payload,
        user: user.id,
      },
      status: 'published',
      populate: '*',
    });

    return ctx.send({ data: created });
  },
}));
