'use strict';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatEuro(amount) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(toNum(amount, 0));
}

function formatDatePt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function getUserName(user) {
  if (!user) return 'Cliente';
  const fn = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fn || user.username || user.email || 'Cliente';
}

function getCourierName(courier) {
  if (!courier) return null;
  const full = `${courier.firstName || ''} ${courier.lastName || ''}`.trim();
  return full || courier.fullName || 'Estafeta';
}

function parseItemList(itemsJson) {
  if (!itemsJson) return [];
  const raw = itemsJson.list ?? itemsJson;
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => ({
    name: String(row.name || row.title || 'Artigo').trim(),
    qty: Math.max(1, toNum(row.qty ?? row.quantity, 1)),
    sku: row.sku ? String(row.sku) : '',
  }));
}

function redemptionLabel(code) {
  const map = {
    product: 'Desconto produto (Go Points)',
    delivery: 'Desconto entrega (Go Points)',
  };
  return map[code] || (code ? String(code) : '');
}

/**
 * @param {object} order — registo Strapi com populate user, courier, delivery, review
 */
function buildInvoicePayload(order) {
  const itemsJson = order.items || {};
  const deliveryCoords = itemsJson.deliveryCoords || {};
  const itemList = parseItemList(itemsJson);
  const courier = order.courier;
  const user = order.user;
  const pointsUsed = toNum(order.go_points_used, 0);
  const total = toNum(order.total_price, 0);
  const documentId = order.documentId || String(order.id);
  const publicId = order.orderId || `#${order.id}`;
  const frontOfficeUrl = (process.env.FRONT_OFFICE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const alreadyRated = order.rating != null || order.review != null;

  return {
    publicId,
    documentId,
    issuedAt: new Date().toISOString(),
    deliveredAt: order.updatedAt || order.createdAt,
    orderStatus: order.order_status || 'S-11 Entregue',
    clientName: getUserName(user),
    clientEmail: user?.email || '',
    clientPhone: user?.phone || '',
    clientNif: user?.nif || '',
    clientAddress: user?.defaultAddress || '',
    deliveryAddress: deliveryCoords.address || order.deliveryAddress || '',
    deliveryCity: deliveryCoords.city || '',
    deliveryNotes: order.notes || '',
    storeName: order.store_name || '—',
    isUrgent: !!order.is_urgent,
    priority: order.priority ?? 3,
    etaMinutes: order.estimatedTime != null ? toNum(order.estimatedTime, 0) : null,
    items: itemList,
    goPointsUsed: pointsUsed,
    goPointsRedemption: redemptionLabel(order.go_points_redemption),
    totalEuro: total,
    totalFormatted: formatEuro(total),
    courierName: getCourierName(courier),
    courierRating: courier?.rating != null ? toNum(courier.rating, 0).toFixed(1) : null,
    courierPhone: courier?.phone || '',
    courierVehicle: [courier?.vehicleType, courier?.vehicleBrand, courier?.vehicleModel]
      .filter(Boolean)
      .join(' ') || '',
    deliveryStatus: order.delivery?.delivery_status || null,
    alreadyRated,
    orderRating: order.rating ?? order.review?.rating ?? null,
    reviewUrl: `${frontOfficeUrl}/order/history`,
    trackingUrl: `${frontOfficeUrl}/order/tracking`,
    historyUrl: `${frontOfficeUrl}/order/history`,
  };
}

async function findOrderForInvoice(strapi, where) {
  const rows = await strapi.db.query('api::order.order').findMany({
    where,
    populate: { user: true, courier: true, delivery: true, review: true },
    orderBy: { updatedAt: 'desc' },
    limit: 10,
  });
  if (!rows?.length) return null;
  const delivered = rows.find((r) => r.order_status === 'S-11 Entregue' && r.publishedAt);
  if (delivered) return delivered;
  const published = rows.find((r) => r.publishedAt);
  return published || rows[0];
}

module.exports = {
  escapeHtml,
  formatEuro,
  formatDatePt,
  buildInvoicePayload,
  findOrderForInvoice,
};
