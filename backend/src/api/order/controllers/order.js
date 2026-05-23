"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
const order_chat_js_1 = require("../../../utils/order-chat.js");
function toNum(v, fallback = NaN) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
async function resolveRequestedItems(strapi, rawList) {
    const rows = await strapi.db.query('api::catalog-product.catalog-product').findMany({
        select: ['sku', 'name'],
    });
    const bySku = new Map();
    const byName = new Map();
    for (const row of rows || []) {
        const sku = String(row.sku || '').trim().toUpperCase();
        const name = String(row.name || '').trim().toLowerCase();
        if (sku)
            bySku.set(sku, row);
        if (name)
            byName.set(name, row);
    }
    const unresolved = [];
    const bucket = new Map();
    for (const item of rawList || []) {
        const qty = Math.max(0, Number(item?.qty || 0));
        if (!qty)
            continue;
        const incomingSku = String(item?.sku || item?.code || '').trim().toUpperCase();
        const incomingName = String(item?.name || '').trim();
        const fromSku = incomingSku ? bySku.get(incomingSku) : null;
        const fromName = incomingName ? byName.get(incomingName.toLowerCase()) : null;
        const product = fromSku || fromName;
        if (!product) {
            unresolved.push(incomingName || incomingSku || 'produto');
            continue;
        }
        const sku = String(product.sku || '').trim().toUpperCase();
        if (!sku)
            continue;
        const prev = bucket.get(sku) || { sku, qty: 0, name: String(product.name || sku) };
        prev.qty += qty;
        bucket.set(sku, prev);
    }
    if (unresolved.length) {
        return { items: [], error: `Não foi possível mapear produtos para stock: ${unresolved.join(', ')}` };
    }
    return { items: Array.from(bucket.values()) };
}
async function pickNearestStoreWithStock(strapi, orderData) {
    const deliveryCoords = orderData?.items?.deliveryCoords || {};
    const destLat = toNum(deliveryCoords.destLat);
    const destLng = toNum(deliveryCoords.destLng);
    const requestedRaw = Array.isArray(orderData?.items?.list) ? orderData.items.list : [];
    const mapped = await resolveRequestedItems(strapi, requestedRaw);
    if (mapped.error)
        return { store: null, error: mapped.error };
    const requested = mapped.items;
    if (!requested.length)
        return { store: null, error: 'Pedido sem itens válidos para validação de stock.' };
    const stores = await strapi.db.query('api::continent-store.continent-store').findMany({
        where: { isActive: true },
        select: ['id', 'documentId', 'name', 'code', 'lat', 'lng', 'manualStockOverride'],
    });
    console.log(`[PickStore] Encontradas ${stores?.length || 0} lojas ativas.`);
    if (!stores?.length)
        return { store: null, error: 'Sem lojas Continente ativas.' };
    const storeIds = stores.map((s) => s.id);
    const skus = requested.map((r) => r.sku);
    const invRows = await strapi.db.query('api::store-inventory-item.store-inventory-item').findMany({
        where: {
            store: { id: { $in: storeIds } },
            sku: { $in: skus },
            isActive: true,
        },
        select: ['sku', 'stock', 'reservedStock'],
        populate: { store: true },
    });
    const invMap = new Map();
    for (const row of invRows || []) {
        const storeId = row?.store?.id;
        const sku = String(row?.sku || '').trim().toUpperCase();
        if (!storeId || !sku)
            continue;
        const available = Math.max(0, Number(row.stock || 0) - Number(row.reservedStock || 0));
        invMap.set(`${storeId}:${sku}`, available);
    }
    const eligible = stores.filter((store) => {
        console.log(`[PickStore] Verificando loja: ${store.name} (Override: ${store.manualStockOverride})`);
        // Se a loja tiver override manual, ignoramos o check de stock real
        if (store.manualStockOverride === true || store.manualStockOverride === 'true')
            return true;
        const hasStock = requested.every((req) => {
            const available = invMap.get(`${store.id}:${req.sku}`) || 0;
            return available >= req.qty;
        });
        console.log(`[PickStore] Loja ${store.name} tem stock real? ${hasStock}`);
        return hasStock;
    });
    console.log(`[PickStore] Lojas elegíveis após check: ${eligible.map(e => e.name).join(', ')}`);
    if (!eligible.length) {
        return { store: null, error: 'Sem stock suficiente em lojas próximas para os itens selecionados.' };
    }
    if (Number.isFinite(destLat) && Number.isFinite(destLng)) {
        eligible.sort((a, b) => {
            const da = haversineKm(destLat, destLng, Number(a.lat), Number(a.lng));
            const db = haversineKm(destLat, destLng, Number(b.lat), Number(b.lng));
            return da - db;
        });
    }
    return { store: eligible[0] };
}
exports.default = strapi_1.factories.createCoreController('api::order.order', ({ strapi }) => ({
    // Mantemos o find para filtrar apenas as encomendas do dono do token
    async find(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const userFilter = user.documentId ? { documentId: user.documentId } : { id: user.id };
        const entries = await strapi.documents('api::order.order').findMany({
            filters: { user: userFilter },
            populate: ['user', 'courier.docSelfie', 'delivery.courier.docSelfie', 'review'],
            sort: 'createdAt:desc'
        });
        return ctx.send({ data: entries });
    },
    // Novo Create: Injeta o utilizador e evita o erro de "Invalid Key"
    async create(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const body = ctx.request.body;
        const orderData = { ...(body.data || {}) };
        try {
            const picked = await pickNearestStoreWithStock(strapi, orderData);
            if (!picked.store) {
                return ctx.badRequest(picked.error || 'Não foi possível atribuir loja com stock.');
            }
            const store = picked.store;
            orderData.store_name = store.name || store.code || 'Continente';
            orderData.storeLatitude = toNum(store.lat, null);
            orderData.storeLongitude = toNum(store.lng, null);
            orderData.items = {
                ...(orderData.items || {}),
                boMeta: {
                    ...(orderData.items?.boMeta || {}),
                    storeId: store.documentId || store.id,
                },
            };
            // Usamos a API de Documents diretamente para evitar a validação de permissões de campo do REST
            const entry = await strapi.documents('api::order.order').create({
                data: {
                    ...orderData,
                    user: user.documentId ?? user.id, // Injeção forçada no lado do servidor
                    publishedAt: new Date(), // Garante que fica logo publicado se draftAndPublish estiver ativo
                },
            });
            return ctx.send({ data: entry });
        }
        catch (error) {
            return ctx.badRequest('Erro ao criar encomenda', { details: error.message });
        }
    },
    async appendChatMessage(ctx) {
        const user = ctx.state.user;
        if (!user)
            return ctx.unauthorized();
        const documentId = String(ctx.params.documentId || '').trim();
        const text = String(ctx.request.body?.text || ctx.request.body?.data?.text || '').trim();
        if (!text)
            return ctx.badRequest('Mensagem obrigatória.');
        const order = await (0, order_chat_js_1.findPublishedOrderByToken)(strapi, documentId);
        if (!order)
            return ctx.notFound('Pedido não encontrado.');
        const userFilter = user.documentId ? { documentId: user.documentId } : { id: user.id };
        const ownerDocId = order.user?.documentId || order.user?.id;
        const ownerOk = ownerDocId != null
            && (String(ownerDocId) === String(userFilter.documentId || userFilter.id));
        if (!ownerOk)
            return ctx.forbidden('Sem permissão para este pedido.');
        const channel = ctx.request.body?.channel || ctx.request.body?.data?.channel || null;
        const result = await (0, order_chat_js_1.appendOrderChatMessage)(strapi, order.documentId, {
            sender: 'client',
            text,
            actorName: user.username || user.email || 'Cliente',
            channel,
        });
        if (!result.ok)
            return ctx.badRequest(result.error);
        return ctx.send({
            data: {
                message: result.message,
                chatHistory: result.chatHistory,
            },
        });
    },
}));
