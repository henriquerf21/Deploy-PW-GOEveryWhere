/**
 * courier-estafeta controller
 */

import { factories } from '@strapi/strapi';
import { verifyCourierPassword } from '../utils/password';

async function getCourierAuth(strapi: any, ctx: any) {
  const authHeader = String(ctx.request.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
    if (payload?.scope !== 'courier' || !payload?.courierDocumentId) return null;
    return { courierDocumentId: String(payload.courierDocumentId) };
  } catch {
    return null;
  }
}

async function findDeliveryTarget(strapi: any, idOrDocId: string) {
  const token = String(idOrDocId || '').trim();
  const numeric = Number(token);
  let target = await strapi.db.query('api::delivery.delivery').findOne({
    where: { documentId: token },
    populate: { courier: true, order: true },
  });
  if (!target && Number.isFinite(numeric)) {
    target = await strapi.db.query('api::delivery.delivery').findOne({
      where: { id: numeric },
      populate: { courier: true, order: true },
    });
  }
  return target;
}

export default factories.createCoreController('api::courier-estafeta.courier-estafeta', ({ strapi }) => ({
  async courierUpdateDelivery(ctx: any) {
    const auth = await getCourierAuth(strapi, ctx);
    if (!auth) return ctx.unauthorized('Token de estafeta inválido.');

    const target = await findDeliveryTarget(strapi, ctx.params.id);
    if (!target) return ctx.notFound('Entrega não encontrada.');
    if (String(target?.courier?.documentId || '') !== auth.courierDocumentId) {
      return ctx.forbidden('Entrega não pertence ao estafeta autenticado.');
    }

    const payload = (ctx.request.body || {}) as any;
    const data = payload?.data || {};
    const updated = await strapi.documents('api::delivery.delivery').update({
      documentId: target.documentId,
      data,
      status: 'published',
    });
    ctx.body = { data: updated };
  },

  async courierUpdateOrder(ctx: any) {
    const auth = await getCourierAuth(strapi, ctx);
    if (!auth) return ctx.unauthorized('Token de estafeta inválido.');

    const token = String(ctx.params.id || '').trim();
    const numeric = Number(token);
    let order = await strapi.db.query('api::order.order').findOne({
      where: { documentId: token },
      populate: { delivery: { populate: { courier: true } } },
    });
    if (!order && Number.isFinite(numeric)) {
      order = await strapi.db.query('api::order.order').findOne({
        where: { id: numeric },
        populate: { delivery: { populate: { courier: true } } },
      });
    }
    if (!order) return ctx.notFound('Pedido não encontrado.');
    if (String(order?.delivery?.courier?.documentId || '') !== auth.courierDocumentId) {
      return ctx.forbidden('Pedido não pertence ao estafeta autenticado.');
    }

    const payload = (ctx.request.body || {}) as any;
    const data = payload?.data || {};
    const updated = await strapi.documents('api::order.order').update({
      documentId: order.documentId,
      data,
      status: 'published',
    });
    ctx.body = { data: updated };
  },

  async courierUpdateSelf(ctx: any) {
    const auth = await getCourierAuth(strapi, ctx);
    if (!auth) return ctx.unauthorized('Token de estafeta inválido.');

    const courier = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
      where: { documentId: auth.courierDocumentId },
    });
    if (!courier) return ctx.notFound('Estafeta não encontrado.');

    const payload = (ctx.request.body || {}) as any;
    const data = payload?.data || {};
    const updated = await strapi.documents('api::courier-estafeta.courier-estafeta').update({
      documentId: courier.documentId,
      data,
      status: 'published',
    });
    const { password: _password, ...safeCourier } = (updated as any) || {};
    ctx.body = { data: safeCourier };
  },

  async login(ctx) {
    try {
      const body = (ctx.request.body || {}) as any;
      const countryCode = String(body.countryCode || '').trim() || '+351';
      const phone = String(body.phone || '').trim();
      const password = String(body.password || '');

      if (!phone || !password) {
        return ctx.badRequest('Telemóvel e password são obrigatórios.');
      }

      const fullPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`;
      const couriers = await strapi.documents('api::courier-estafeta.courier-estafeta').findMany({
        filters: { phone: { $eq: fullPhone } },
        fields: ['fullName', 'email', 'phone', 'password', 'courier_status', 'iban', 'zone', 'vehicleType', 'vehicleBrand', 'vehicleModel', 'vehicleColor', 'vehiclePlate', 'rating', 'totalDeliveries', 'onTimePct', 'birthDate', 'address'],
        populate: {
          docSelfie: true,
          docCc: true,
          drivingLicense: true,
          insurance: true,
        },
        status: 'published',
        pagination: { page: 1, pageSize: 1 },
      });

      const courier = couriers?.[0];
      if (!courier) return ctx.unauthorized('Estafeta não registado.');

      const passOk = verifyCourierPassword(password, String((courier as any).password || ''));
      if (!passOk) return ctx.unauthorized('Credenciais inválidas.');

      const courierStatus = String((courier as any).courier_status || '');
      if (courierStatus.startsWith('E-01')) return ctx.forbidden('A tua conta está pendente de verificação.');
      if (courierStatus.startsWith('E-03')) return ctx.forbidden('A tua conta foi rejeitada.');
      if (courierStatus.startsWith('E-04')) return ctx.forbidden('A tua conta está suspensa.');

      const token = strapi.plugin('users-permissions').service('jwt').issue({
        scope: 'courier',
        courierDocumentId: (courier as any).documentId,
      });

      const { password: _password, ...safeCourier } = courier as any;
      ctx.body = {
        success: true,
        token,
        courier: safeCourier,
      };
    } catch (err: any) {
      ctx.badRequest(err?.message || 'Falha no login do estafeta.');
    }
  },
}));
