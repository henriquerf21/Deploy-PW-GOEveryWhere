"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * courier-estafeta controller
 */
const strapi_1 = require("@strapi/strapi");
const password_js_1 = require("../utils/password.js");
const order_state_machine_js_1 = require("../../back-office/utils/order-state-machine.js");
const order_chat_js_1 = require("../../../utils/order-chat.js");
async function getCourierAuth(strapi, ctx) {
    const authHeader = String(ctx.request.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token)
        return null;
    try {
        const payload = await strapi.plugin('users-permissions').service('jwt').verify(token);
        if (payload?.scope !== 'courier' || !payload?.courierDocumentId)
            return null;
        return { courierDocumentId: String(payload.courierDocumentId) };
    }
    catch {
        return null;
    }
}
async function findPublishedCourier(strapi, documentId) {
    return strapi.documents('api::courier-estafeta.courier-estafeta').findOne({
        documentId,
        status: 'published',
    });
}
async function findPublishedDelivery(strapi, idOrDocId) {
    const token = String(idOrDocId || '').trim();
    if (!token)
        return null;
    let target = await strapi.documents('api::delivery.delivery').findOne({
        documentId: token,
        status: 'published',
        populate: { courier: true, order: true },
    });
    const numeric = Number(token);
    if (!target && Number.isFinite(numeric)) {
        const rows = await strapi.documents('api::delivery.delivery').findMany({
            filters: { id: { $eq: numeric } },
            status: 'published',
            populate: { courier: true, order: true },
            pagination: { page: 1, pageSize: 1 },
        });
        target = rows?.[0] || null;
    }
    return target;
}
async function findPublishedOrder(strapi, idOrDocId) {
    const token = String(idOrDocId || '').trim();
    if (!token)
        return null;
    let order = await strapi.documents('api::order.order').findOne({
        documentId: token,
        status: 'published',
        populate: { delivery: { populate: { courier: true } }, courier: true },
    });
    const numeric = Number(token);
    if (!order && Number.isFinite(numeric)) {
        const rows = await strapi.documents('api::order.order').findMany({
            filters: { id: { $eq: numeric } },
            status: 'published',
            populate: { delivery: { populate: { courier: true } }, courier: true },
            pagination: { page: 1, pageSize: 1 },
        });
        order = rows?.[0] || null;
    }
    return order;
}
function handleCourierError(ctx, strapi, err, action) {
    strapi.log.error(`[courier-estafeta] ${action} failed:`, err);
    return ctx.internalServerError(err?.message || `Falha em ${action}.`);
}
function roundCoord(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : null;
}
function pickCourierSelfData(raw) {
    const data = {};
    if (raw.courier_status != null)
        data.courier_status = String(raw.courier_status);
    if (raw.isOnline != null)
        data.isOnline = Boolean(raw.isOnline);
    const lat = roundCoord(raw.lat);
    const lng = roundCoord(raw.lng);
    if (lat != null)
        data.lat = lat;
    if (lng != null)
        data.lng = lng;
    return data;
}
function pickDeliveryCourierData(raw) {
    const data = {};
    const lat = roundCoord(raw.courierLatitude);
    const lng = roundCoord(raw.courierLongitude);
    if (lat != null)
        data.courierLatitude = lat;
    if (lng != null)
        data.courierLongitude = lng;
    if (raw.delivery_status != null)
        data.delivery_status = String(raw.delivery_status);
    if (raw.timestamps != null)
        data.timestamps = raw.timestamps;
    if (raw.notes != null)
        data.notes = String(raw.notes);
    if (raw.startTime != null)
        data.startTime = raw.startTime;
    if (raw.endTime != null)
        data.endTime = raw.endTime;
    return data;
}
function isGpsOnlyCourierPatch(data) {
    return (data.lat != null || data.lng != null)
        && data.courier_status == null
        && data.isOnline == null;
}
function isPresenceOnlyCourierPatch(data) {
    return (data.courier_status != null || data.isOnline != null)
        && data.lat == null
        && data.lng == null;
}
async function patchPublishedCourierPresence(strapi, documentId, patch) {
    const row = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
        where: { documentId, publishedAt: { $notNull: true } },
    });
    if (!row)
        return null;
    return strapi.db.query('api::courier-estafeta.courier-estafeta').update({
        where: { id: row.id },
        data: patch,
    });
}
function isGpsOnlyDeliveryPatch(data) {
    return (data.courierLatitude != null || data.courierLongitude != null)
        && data.delivery_status == null
        && data.timestamps == null
        && data.notes == null
        && data.startTime == null
        && data.endTime == null;
}
/** Atualização leve de GPS na linha publicada — evita corrida do Document API */
async function patchPublishedCourierGps(strapi, documentId, lat, lng) {
    const row = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
        where: { documentId, publishedAt: { $notNull: true } },
    });
    if (!row)
        return null;
    return strapi.db.query('api::courier-estafeta.courier-estafeta').update({
        where: { id: row.id },
        data: { lat, lng },
    });
}
async function patchPublishedDeliveryGps(strapi, documentId, courierLatitude, courierLongitude) {
    const row = await strapi.db.query('api::delivery.delivery').findOne({
        where: { documentId, publishedAt: { $notNull: true } },
    });
    if (!row)
        return null;
    return strapi.db.query('api::delivery.delivery').update({
        where: { id: row.id },
        data: { courierLatitude, courierLongitude },
    });
}
async function withDbRetry(fn, retries = 4) {
    let lastErr;
    for (let attempt = 0; attempt < retries; attempt += 1) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            const msg = String(err?.message || err || '');
            const retryable = msg.includes('deadlock')
                || msg.includes('transaction is aborted')
                || msg.includes('could not serialize');
            if (!retryable || attempt >= retries - 1)
                throw err;
            await new Promise((r) => setTimeout(r, 60 * (attempt + 1)));
        }
    }
    throw lastErr;
}
exports.default = strapi_1.factories.createCoreController('api::courier-estafeta.courier-estafeta', ({ strapi }) => ({
    async courierUpdateDelivery(ctx) {
        try {
            const auth = await getCourierAuth(strapi, ctx);
            if (!auth)
                return ctx.unauthorized('Token de estafeta inválido.');
            const target = await findPublishedDelivery(strapi, ctx.params.id);
            if (!target)
                return ctx.notFound('Entrega não encontrada.');
            if (String(target?.courier?.documentId || '') !== auth.courierDocumentId) {
                return ctx.forbidden('Entrega não pertence ao estafeta autenticado.');
            }
            const parentOrder = target?.order;
            const orderStatus = String(parentOrder?.order_status || '');
            const TERMINAL_ORDER_STATUSES = [
                'S-04 Rejeitado',
                'S-11 Entregue',
                'S-13 Cancelado pelo Cliente',
                'S-14 Cancelado pelo Admin',
            ];
            if (TERMINAL_ORDER_STATUSES.some(s => orderStatus === s)) {
                return ctx.badRequest(`Pedido já está em estado terminal (${orderStatus.split(' ').slice(0, 2).join(' ')}). Não é possível atualizar a entrega.`);
            }
            const payload = (ctx.request.body || {});
            const data = pickDeliveryCourierData(payload?.data || {});
            if (Object.keys(data).length === 0) {
                return ctx.badRequest('Nenhum campo válido para atualizar.');
            }
            if (data.delivery_status) {
                const current = String(target.delivery_status || '');
                const next = String(data.delivery_status);
                if (!(0, order_state_machine_js_1.canTransitionDelivery)(current, next)) {
                    return ctx.badRequest(`Transição de estado não permitida (${current} → ${next}).`);
                }
                const curCode = (0, order_state_machine_js_1.deliveryCode)(current);
                if (next.startsWith('E-14') && !['E-08', 'E-09'].includes(curCode)) {
                    return ctx.badRequest('Só é possível marcar impossível antes da recolha na loja.');
                }
            }
            if (isGpsOnlyDeliveryPatch(data)) {
                const lat = data.courierLatitude;
                const lng = data.courierLongitude;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                    return ctx.badRequest('courierLatitude e courierLongitude são obrigatórios.');
                }
                await withDbRetry(() => patchPublishedDeliveryGps(strapi, target.documentId, lat, lng));
                const fresh = await findPublishedDelivery(strapi, target.documentId);
                ctx.body = { data: fresh };
                return;
            }
            const updated = await strapi.documents('api::delivery.delivery').update({
                documentId: target.documentId,
                data,
                status: 'published',
            });
            ctx.body = { data: updated };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'courierUpdateDelivery');
        }
    },
    async courierUpdateOrder(ctx) {
        try {
            const auth = await getCourierAuth(strapi, ctx);
            if (!auth)
                return ctx.unauthorized('Token de estafeta inválido.');
            const order = await findPublishedOrder(strapi, ctx.params.id);
            if (!order)
                return ctx.notFound('Pedido não encontrado.');
            const orderCourierDocId = order?.courier?.documentId || order?.delivery?.courier?.documentId;
            if (String(orderCourierDocId || '') !== auth.courierDocumentId) {
                return ctx.forbidden('Pedido não pertence ao estafeta autenticado.');
            }
            const payload = (ctx.request.body || {});
            const data = { ...(payload?.data || {}) };
            if (data.chatHistory !== undefined) {
                delete data.chatHistory;
            }
            const updated = await strapi.documents('api::order.order').update({
                documentId: order.documentId,
                data,
                status: 'published',
            });
            ctx.body = { data: updated };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'courierUpdateOrder');
        }
    },
    async appendOrderChatMessage(ctx) {
        try {
            const auth = await getCourierAuth(strapi, ctx);
            if (!auth)
                return ctx.unauthorized('Token de estafeta inválido.');
            const order = await findPublishedOrder(strapi, ctx.params.id);
            if (!order)
                return ctx.notFound('Pedido não encontrado.');
            const orderCourierDocId = order?.courier?.documentId || order?.delivery?.courier?.documentId;
            if (String(orderCourierDocId || '') !== auth.courierDocumentId) {
                return ctx.forbidden('Pedido não pertence ao estafeta autenticado.');
            }
            const text = String(ctx.request.body?.text || ctx.request.body?.data?.text || '').trim();
            if (!text)
                return ctx.badRequest('Mensagem obrigatória.');
            const courier = await findPublishedCourier(strapi, auth.courierDocumentId);
            const result = await (0, order_chat_js_1.appendOrderChatMessage)(strapi, order.documentId, {
                sender: 'courier',
                text,
                actorName: courier?.fullName || 'Estafeta',
            });
            if (!result.ok)
                return ctx.badRequest(result.error);
            ctx.body = {
                data: {
                    message: result.message,
                    chatHistory: result.chatHistory,
                },
            };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'appendOrderChatMessage');
        }
    },
    async courierUpdateSelf(ctx) {
        try {
            const auth = await getCourierAuth(strapi, ctx);
            if (!auth)
                return ctx.unauthorized('Token de estafeta inválido.');
            const courier = await findPublishedCourier(strapi, auth.courierDocumentId);
            if (!courier)
                return ctx.notFound('Estafeta não encontrado.');
            const courierStatus = String(courier.courier_status || '');
            if (courierStatus.startsWith('E-03'))
                return ctx.forbidden('Conta rejeitada.');
            if (courierStatus.startsWith('E-04'))
                return ctx.forbidden('Conta suspensa.');
            const payload = (ctx.request.body || {});
            const data = pickCourierSelfData(payload?.data || {});
            if (Object.keys(data).length === 0) {
                return ctx.badRequest('Nenhum campo válido para atualizar.');
            }
            if (isGpsOnlyCourierPatch(data)) {
                const lat = data.lat;
                const lng = data.lng;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                    return ctx.badRequest('lat e lng são obrigatórios.');
                }
                await withDbRetry(() => patchPublishedCourierGps(strapi, courier.documentId, lat, lng));
                const fresh = await findPublishedCourier(strapi, auth.courierDocumentId);
                const { password: _pw, ...safeCourier } = fresh || {};
                ctx.body = { data: safeCourier };
                return;
            }
            if (isPresenceOnlyCourierPatch(data)) {
                const presencePatch = {};
                if (data.courier_status != null)
                    presencePatch.courier_status = String(data.courier_status);
                if (data.isOnline != null)
                    presencePatch.isOnline = Boolean(data.isOnline);
                await withDbRetry(() => patchPublishedCourierPresence(strapi, courier.documentId, presencePatch));
                const fresh = await findPublishedCourier(strapi, auth.courierDocumentId);
                const { password: _pw, ...safeCourier } = fresh || {};
                ctx.body = { data: safeCourier };
                return;
            }
            const updated = await strapi.documents('api::courier-estafeta.courier-estafeta').update({
                documentId: courier.documentId,
                data,
                status: 'published',
            });
            const { password: _password, ...safeCourier } = updated || {};
            ctx.body = { data: safeCourier };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'courierUpdateSelf');
        }
    },
    async myDeliveries(ctx) {
        try {
            const auth = await getCourierAuth(strapi, ctx);
            if (!auth)
                return ctx.unauthorized('Token de estafeta inválido.');
            const courier = await findPublishedCourier(strapi, auth.courierDocumentId);
            if (!courier)
                return ctx.notFound('Estafeta não encontrado.');
            const courierStatus = String(courier.courier_status || '');
            if (courierStatus.startsWith('E-01'))
                return ctx.forbidden('Conta pendente de verificação.');
            if (courierStatus.startsWith('E-03'))
                return ctx.forbidden('Conta rejeitada.');
            if (courierStatus.startsWith('E-04'))
                return ctx.forbidden('Conta suspensa.');
            const deliveries = await strapi.documents('api::delivery.delivery').findMany({
                status: 'published',
                filters: {
                    courier: { documentId: auth.courierDocumentId },
                    delivery_status: {
                        $notIn: ['E-13 Entrega Confirmada', 'E-14 Entrega Impossível'],
                    },
                },
                populate: {
                    order: {
                        populate: { user: true },
                    },
                    courier: true,
                },
                sort: { createdAt: 'desc' },
            });
            ctx.body = {
                data: deliveries,
                meta: {
                    courier_status: courierStatus,
                    isOnline: !!courier.isOnline,
                },
            };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'myDeliveries');
        }
    },
    async myCompletedDeliveries(ctx) {
        try {
            const auth = await getCourierAuth(strapi, ctx);
            if (!auth)
                return ctx.unauthorized('Token de estafeta inválido.');
            const courier = await findPublishedCourier(strapi, auth.courierDocumentId);
            if (!courier)
                return ctx.notFound('Estafeta não encontrado.');
            const deliveries = await strapi.documents('api::delivery.delivery').findMany({
                status: 'published',
                filters: {
                    courier: { documentId: auth.courierDocumentId },
                    delivery_status: {
                        $in: ['E-13 Entrega Confirmada', 'E-14 Entrega Impossível'],
                    },
                },
                populate: {
                    order: {
                        populate: { user: true, review: true },
                    },
                    courier: true,
                },
                sort: { endTime: 'desc' },
            });
            ctx.body = { data: deliveries };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'myCompletedDeliveries');
        }
    },
    async login(ctx) {
        try {
            const body = (ctx.request.body || {});
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
            if (!courier)
                return ctx.unauthorized('Estafeta não registado.');
            const passOk = (0, password_js_1.verifyCourierPassword)(password, String(courier.password || ''));
            if (!passOk)
                return ctx.unauthorized('Credenciais inválidas.');
            const courierStatus = String(courier.courier_status || '');
            if (courierStatus.startsWith('E-01'))
                return ctx.forbidden('A tua conta está pendente de verificação.');
            if (courierStatus.startsWith('E-03'))
                return ctx.forbidden('A tua conta foi rejeitada.');
            if (courierStatus.startsWith('E-04'))
                return ctx.forbidden('A tua conta está suspensa.');
            const token = strapi.plugin('users-permissions').service('jwt').issue({
                scope: 'courier',
                courierDocumentId: courier.documentId,
            });
            const { password: _password, ...safeCourier } = courier;
            ctx.body = {
                success: true,
                token,
                courier: safeCourier,
            };
        }
        catch (err) {
            return handleCourierError(ctx, strapi, err, 'login');
        }
    },
}));
