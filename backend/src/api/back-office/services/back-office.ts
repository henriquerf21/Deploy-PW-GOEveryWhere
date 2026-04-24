import {
  validateEmail,
  validatePtIban,
  validatePtNif,
  validatePtPhone,
  validatePtPlate,
} from '../utils/back-office-validation';
import { CONTINENTE_STORES_SEED } from '../data/continent-stores-seed';

const STORE_CATALOG = CONTINENTE_STORES_SEED.slice(0, 3).map((s) => ({
  id: s.code,
  name: s.name,
  lat: s.lat,
  lng: s.lng,
  zone: s.city,
}));

const DEFAULT_CATALOG_PRODUCTS = [
  { sku: 'FRASCO-1', name: '1 Frasco', desc: '30 gomas proteicas', price: 14.99, gomas: 30, popular: false, discountLabel: '', sortOrder: 10 },
  { sku: 'PACK-2', name: 'Pack 2 Frascos', desc: 'Poupa 10% - 60 gomas', price: 26.99, gomas: 60, popular: true, discountLabel: '-10%', sortOrder: 20 },
  { sku: 'PACK-3', name: 'Pack 3 Frascos', desc: 'Poupa 15% - 90 gomas', price: 38.24, gomas: 90, popular: false, discountLabel: '-15%', sortOrder: 30 },
];

const ORDER_STATE = {
  PENDING: 'S-01 Submetido',
  INFO_REQUESTED: 'S-03 Info Adicional Solicitada',
  REJECTED: 'S-04 Rejeitado',
  APPROVED: 'S-05 Aprovado',
  ASSIGNED: 'S-07 Aceite pelo Estafeta',
  IN_TRANSIT: 'S-09 Em Trânsito',
  DELIVERED: 'S-11 Entregue',
};

const COURIER_STATE = {
  E01: 'E-01 Pendente Verificação',
  E02: 'E-02 Verificado',
  E03: 'E-03 Rejeitado',
  E04: 'E-04 Suspenso',
  E05: 'E-05 Offline',
  E06: 'E-06 Online',
};

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampPriority(v: any) {
  const n = Math.round(toNum(v, 3));
  return Math.max(1, Math.min(5, n));
}

function idToPublic(prefix: string, value: any) {
  return `${prefix}-${value}`;
}

function parsePublicToken(rawId: string, prefix: string) {
  const clean = String(rawId || '').trim();
  if (!clean) return '';
  if (clean.startsWith(`${prefix}-`)) return clean.slice(prefix.length + 1);
  return clean;
}

function getUserName(user: any) {
  if (!user) return 'Cliente';
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return full || user.username || user.email || 'Cliente';
}

function splitCourierName(fullName: string) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'Estafeta', lastName: 'Go' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function zoneFromAddress(address?: string | null) {
  if (!address) return 'Outro';
  const normalized = address.toLowerCase();
  if (normalized.includes('porto')) return 'Porto Centro';
  if (normalized.includes('matosinhos')) return 'Matosinhos';
  if (normalized.includes('gaia')) return 'Vila Nova de Gaia';
  if (normalized.includes('maia')) return 'Maia';
  return 'Outro';
}

function collectPackSales(rawOrders: any[]) {
  const buckets = new Map<string, { sku: string; name: string; units: number }>();
  const addLine = (raw: any) => {
    if (!raw || typeof raw !== 'object') return;
    const sku = String(raw.sku || raw.code || raw.id || raw.name || '').trim();
    if (!sku) return;
    const name = String(raw.name || raw.title || sku).trim();
    const qty = Number(raw.qty ?? raw.quantity ?? raw.units ?? raw.count ?? 1);
    const units = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const prev = buckets.get(sku) || { sku, name, units: 0 };
    prev.units += units;
    buckets.set(sku, prev);
  };

  for (const order of rawOrders) {
    const items = order?.items;
    if (!items) continue;
    if (Array.isArray(items)) {
      items.forEach(addLine);
      continue;
    }
    if (Array.isArray(items.lines)) {
      items.lines.forEach(addLine);
      continue;
    }
    if (Array.isArray(items.items)) {
      items.items.forEach(addLine);
      continue;
    }
    Object.values(items).forEach(addLine);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 10);
}

function dedupeByDocumentId<T extends { documentId?: string; id?: number; publishedAt?: string | null; updatedAt?: string }>(rows: T[]) {
  const byDoc = new Map<string, T>();
  for (const row of rows) {
    const key = String(row?.documentId || row?.id || '');
    if (!key) continue;
    const prev = byDoc.get(key);
    if (!prev) {
      byDoc.set(key, row);
      continue;
    }
    const prevPublished = !!prev.publishedAt;
    const nextPublished = !!row.publishedAt;
    if (!prevPublished && nextPublished) {
      byDoc.set(key, row);
      continue;
    }
    if (prevPublished === nextPublished) {
      const prevUpdated = Date.parse(prev.updatedAt || '') || 0;
      const nextUpdated = Date.parse(row.updatedAt || '') || 0;
      if (nextUpdated > prevUpdated) byDoc.set(key, row);
    }
  }
  return Array.from(byDoc.values());
}

function mapOrderStatus(strapiStatus?: string) {
  if (strapiStatus === ORDER_STATE.INFO_REQUESTED) return 'INFO_REQUESTED';
  if (strapiStatus === ORDER_STATE.REJECTED) return 'REJECTED';
  if (strapiStatus === ORDER_STATE.APPROVED) return 'APPROVED';
  if (strapiStatus === ORDER_STATE.ASSIGNED) return 'ASSIGNED';
  if (strapiStatus === ORDER_STATE.IN_TRANSIT) return 'IN_TRANSIT';
  if (strapiStatus === ORDER_STATE.DELIVERED) return 'DELIVERED';
  return 'PENDING';
}

function mapCourierStatus(strapiStatus?: string, isOnline?: boolean) {
  if (strapiStatus === COURIER_STATE.E01) return 'E-01';
  if (strapiStatus === COURIER_STATE.E02) return 'E-02';
  if (strapiStatus === COURIER_STATE.E03) return 'E-03';
  if (strapiStatus === COURIER_STATE.E04) return 'E-04';
  if (strapiStatus === COURIER_STATE.E05) return 'E-05';
  if (strapiStatus === COURIER_STATE.E06 || isOnline) return 'E-06';
  return 'E-05';
}

function isActiveOrder(status: string) {
  return ['APPROVED', 'ASSIGNED', 'IN_TRANSIT', 'INFO_REQUESTED', 'PENDING'].includes(status);
}

function buildPublicOrder(entry: any) {
  const attrs = entry ?? {};
  const items = attrs.items ?? {};
  const bo = items.boMeta ?? {};
  const user = attrs.user;
  const courier = attrs.courier;
  const status = mapOrderStatus(attrs.order_status);
  const zone = bo.zone || zoneFromAddress(attrs.deliveryAddress);
  return {
    id: idToPublic('GE', attrs.documentId || attrs.id),
    _documentId: attrs.documentId,
    clientId: user?.id ? idToPublic('CU', user.id) : 'CU-0',
    clientName: getUserName(user),
    clientEmail: user?.email ?? 'n/a',
    city: bo.city || zone,
    zone,
    type: bo.type || 'STANDARD',
    priority: clampPriority(attrs.priority ?? 3),
    status,
    createdAt: attrs.createdAt,
    pickupLat: toNum(attrs.storeLatitude, STORE_CATALOG[0].lat),
    pickupLng: toNum(attrs.storeLongitude, STORE_CATALOG[0].lng),
    destLat: toNum(attrs.deliveryLatitude, STORE_CATALOG[0].lat),
    destLng: toNum(attrs.deliveryLongitude, STORE_CATALOG[0].lng),
    storeId: bo.storeId || null,
    costEuro: attrs.total_price != null ? toNum(attrs.total_price, 0) : null,
    etaMinutes: attrs.estimatedTime != null ? toNum(attrs.estimatedTime, 0) : null,
    resources: bo.resources || null,
    courierId: courier?.documentId ? idToPublic('ST', courier.documentId) : (courier?.id ? idToPublic('ST', courier.id) : null),
    rejectionReason: attrs.rejectionReason || null,
    infoRequestMessage: bo.infoRequestMessage || null,
    clientReply: attrs.clientReply || null,
  };
}

function buildPublicCourier(entry: any, assignedCount = 0) {
  const attrs = entry ?? {};
  const state = mapCourierStatus(attrs.courier_status, attrs.isOnline);
  const firstName = attrs.firstName || '';
  const lastName = attrs.lastName || '';
  const idNum = toNum(attrs.id, 0);
  const pseudoLat = 41.14 + ((idNum % 15) * 0.003);
  const pseudoLng = -8.67 + ((idNum % 13) * 0.004);
  return {
    id: idToPublic('ST', attrs.documentId || attrs.id),
    _documentId: attrs.documentId,
    name: `${firstName} ${lastName}`.trim(),
    email: attrs.email || '',
    phone: attrs.phone || '',
    nif: attrs.nif || '',
    cc: attrs.cc || '',
    birthDate: attrs.birthDate || '',
    address: attrs.address || '',
    iban: attrs.iban || '',
    adminNotes: attrs.adminNotes || '',
    state,
    online: !!attrs.isOnline,
    maxConcurrent: Math.max(1, toNum(attrs.maxSimultaneousDeliveries, 1)),
    zones: String(attrs.zone || 'Outro')
      .split(',')
      .map((z: string) => z.trim())
      .filter(Boolean),
    vehicle: {
      type: attrs.vehicleType || '',
      brand: attrs.vehicleBrand || '',
      model: attrs.vehicleModel || '',
      color: attrs.vehicleColor || '',
      plate: attrs.vehiclePlate || '',
      licenseNumber: attrs.licenseNumber || '',
      insuranceRef: attrs.insuranceRef || '',
      inspectionValidUntil: attrs.inspectionValidUntil || '',
    },
    docs: {
      idDoc: !!attrs.cc,
      license: !!attrs.drivingLicense,
      insurance: !!attrs.insurance,
      inspection: !!attrs.inspection,
    },
    lat: toNum(attrs.lat, pseudoLat),
    lng: toNum(attrs.lng, pseudoLng),
    stats: {
      deliveries: toNum(attrs.totalDeliveries, 0),
      rating: toNum(attrs.rating, 0),
      onTimePct: toNum(attrs.onTimePct, 0),
    },
    currentOrderId: null,
    etaMinutes: null,
    activeAssignments: assignedCount,
  };
}

function parsePublicId(rawId: string, prefix: string) {
  const clean = String(rawId || '').trim();
  if (clean.startsWith(`${prefix}-`)) return Number(clean.slice(prefix.length + 1));
  return Number(clean);
}

type BoCtx = {
  state?: { user?: { id?: number; email?: string } };
  request?: { ip?: string; header?: Record<string, string | string[] | undefined> };
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function scoreCourierForOrder(order: any, courier: any) {
  let score = 0;
  const reasons: string[] = [];
  if (courier.state === 'E-06' && courier.online) {
    score += 40;
    reasons.push('online');
  }
  if (courier.zones?.includes?.(order.zone)) {
    score += 30;
    reasons.push('zona');
  } else {
    return { score: 0, reasons: ['fora_da_zona'], distanceKm: null as number | null };
  }
  const cap = Math.max(1, toNum(courier.maxConcurrent, 1));
  const load = toNum(courier.activeAssignments, 0) / cap;
  score += Math.round((1 - Math.min(1, load)) * 20);
  reasons.push(`carga_${Math.round(load * 100)}%`);
  const pickupLat = toNum(order.pickupLat, STORE_CATALOG[0].lat);
  const pickupLng = toNum(order.pickupLng, STORE_CATALOG[0].lng);
  const dist = haversineKm({ lat: courier.lat, lng: courier.lng }, { lat: pickupLat, lng: pickupLng });
  const distScore = Math.max(0, 10 - Math.min(10, dist));
  score += distScore;
  reasons.push(`dist_${dist.toFixed(1)}km`);
  return { score: Math.round(score), reasons, distanceKm: Math.round(dist * 10) / 10 };
}

function computeSlaMetrics(rawOrders: any[]) {
  const rows = dedupeByDocumentId(rawOrders);
  const pendingMs: number[] = [];
  const approvedMs: number[] = [];
  const assignedMs: number[] = [];
  const assignLagMs: number[] = [];
  const backlogByZone: Record<string, number> = {};
  const STUCK_MIN = 45;
  const now = Date.now();

  for (const row of rows) {
    const st = mapOrderStatus(row.order_status);
    const created = Date.parse(row.createdAt || '') || 0;
    const updated = Date.parse(row.updatedAt || row.createdAt || '') || 0;
    const dwell = Math.max(0, updated - created);
    const ageSinceCreate = created ? Math.max(0, now - created) : 0;
    if (st === 'PENDING') pendingMs.push(ageSinceCreate);
    if (st === 'APPROVED') approvedMs.push(ageSinceCreate);
    if (st === 'ASSIGNED' || st === 'IN_TRANSIT' || st === 'DELIVERED') assignedMs.push(ageSinceCreate);
    if (['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].includes(st) && created) {
      assignLagMs.push(Math.max(0, updated - created));
    }
    if (st === 'PENDING' && ageSinceCreate > STUCK_MIN * 60 * 1000) {
      const items = row.items ?? {};
      const bo = items.boMeta ?? {};
      const zone = bo.zone || zoneFromAddress(row.deliveryAddress);
      backlogByZone[zone] = (backlogByZone[zone] || 0) + 1;
    }
  }

  const avgMin = (arr: number[]) => {
    if (!arr.length) return null;
    const s = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.round(s / 60000);
  };

  return {
    avgMinutesInPending: avgMin(pendingMs),
    avgMinutesInApproved: avgMin(approvedMs),
    avgMinutesInAssigned: avgMin(assignedMs),
    avgMinutesUntilAssigned: assignLagMs.length ? Math.round(assignLagMs.reduce((a, b) => a + b, 0) / assignLagMs.length / 60000) : null,
    backlogStuckByZone: Object.entries(backlogByZone)
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count),
    stuckPendingThresholdMinutes: STUCK_MIN,
  };
}

function auditSnapshotOrder(o: any) {
  if (!o) return null;
  const { suggestedCouriers, ...rest } = o;
  void suggestedCouriers;
  return rest;
}

function auditSnapshotCourier(c: any) {
  if (!c) return null;
  return c;
}

function mapContinentStore(entry: any) {
  if (!entry) return null;
  return {
    id: idToPublic('CT', entry.documentId || entry.id),
    _documentId: entry.documentId,
    code: entry.code,
    name: entry.name,
    city: entry.city,
    district: entry.district,
    address: entry.address,
    postalCode: entry.postalCode,
    lat: toNum(entry.lat, 0),
    lng: toNum(entry.lng, 0),
    openingHours: entry.openingHours || '',
    phone: entry.phone || '',
    format: entry.format || 'Hiper',
    isActive: entry.isActive !== false,
  };
}

function mapInventoryItem(entry: any) {
  if (!entry) return null;
  return {
    id: idToPublic('SI', entry.documentId || entry.id),
    _documentId: entry.documentId,
    storeId: entry.store?.documentId ? idToPublic('CT', entry.store.documentId) : null,
    sku: entry.sku,
    name: entry.name,
    brand: entry.brand || '',
    category: entry.category || '',
    unit: entry.unit || 'un',
    stock: toNum(entry.stock, 0),
    reservedStock: toNum(entry.reservedStock, 0),
    availableStock: Math.max(0, toNum(entry.stock, 0) - toNum(entry.reservedStock, 0)),
    reorderLevel: toNum(entry.reorderLevel, 0),
    price: toNum(entry.price, 0),
    isActive: entry.isActive !== false,
    lastCountedAt: entry.lastCountedAt || null,
  };
}

function mapCatalogProduct(entry: any) {
  if (!entry) return null;
  return {
    id: idToPublic('PR', entry.documentId || entry.id),
    _documentId: entry.documentId,
    sku: String(entry.sku || '').trim().toUpperCase(),
    name: entry.name || '',
    desc: entry.desc || '',
    price: toNum(entry.price, 0),
    gomas: Math.max(0, toNum(entry.gomas, 0)),
    popular: !!entry.popular,
    discount: entry.discountLabel || '',
    discountLabel: entry.discountLabel || '',
    imageUrl: entry.imageUrl || '',
    active: entry.active !== false,
    sortOrder: toNum(entry.sortOrder, 0),
    brand: entry.brand || 'GoGummies',
    category: entry.category || 'Geral',
    lowStockThreshold: Math.max(0, toNum(entry.lowStockThreshold, 0)),
    stock: Math.max(0, toNum(entry.stock, 0)),
  };
}

function buildOperationalAdminAlerts(
  orders: any[],
  couriers: any[],
  opts: { stuckPendingMinutes: number }
) {
  const now = Date.now();
  const stuckMs = opts.stuckPendingMinutes * 60 * 1000;
  const alerts: Array<{ id: string; at: string; level: string; message: string }> = [];

  for (const o of orders) {
    if (o.priority === 5 && ['PENDING', 'INFO_REQUESTED', 'APPROVED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status)) {
      alerts.push({
        id: `bo-prio5-${o.id}`,
        at: new Date().toISOString(),
        level: 'urgent',
        message: `Pedido ${o.id} com prioridade 5 — ação imediata.`,
      });
    }
    if (o.status === 'PENDING' && o.createdAt) {
      const age = now - Date.parse(o.createdAt);
      if (Number.isFinite(age) && age > stuckMs) {
        alerts.push({
          id: `bo-stuck-pending-${o.id}`,
          at: new Date().toISOString(),
          level: 'warn',
          message: `Pedido ${o.id} parado em pendente há >${opts.stuckPendingMinutes} min (${o.zone}).`,
        });
      }
    }
  }

  for (const c of couriers) {
    const cap = Math.max(1, toNum(c.maxConcurrent, 1));
    const load = toNum(c.activeAssignments, 0);
    if (c.online && c.state === 'E-06' && load >= cap) {
      alerts.push({
        id: `bo-overload-${c.id}`,
        at: new Date().toISOString(),
        level: 'warn',
        message: `Estafeta ${c.name} na capacidade máxima (${load}/${cap}).`,
      });
    }
  }

  const byId = new Map<string, (typeof alerts)[number]>();
  for (const a of alerts) {
    if (!byId.has(a.id)) byId.set(a.id, a);
  }
  return Array.from(byId.values());
}

export default ({ strapi }: any) => ({
  async issueAdminJwt(user: any) {
    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });
    return jwt;
  },

  async loginWithEmail(payload: any) {
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    if (!email || !password) return { ok: false, error: 'Email e password são obrigatórios.' };

    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: { email },
      select: ['id', 'email', 'username', 'firstName', 'lastName'],
    });
    const user = users[0];
    if (!user) return { ok: false, error: 'Credenciais inválidas.' };

    const valid = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(password, (await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: user.id } }))?.password);
    if (!valid) return { ok: false, error: 'Credenciais inválidas.' };

    const jwt = await this.issueAdminJwt(user);
    return {
      ok: true,
      data: {
        jwt,
        user: {
          id: user.id,
          email: user.email,
          name: getUserName(user),
          method: 'email',
        },
      },
    };
  },

  async loginWithGoogle(payload: any) {
    const email = String(payload.email || '').trim().toLowerCase();
    if (!email) return { ok: false, error: 'Payload Google inválido (email em falta).' };

    let user = (
      await strapi.db.query('plugin::users-permissions.user').findMany({
        where: { email },
        select: ['id', 'email', 'username', 'firstName', 'lastName', 'picture'],
      })
    )[0];

    if (!user) {
      const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
        select: ['id'],
      });
      const created = await strapi.plugin('users-permissions').service('user').add({
        username: email,
        email,
        provider: 'google',
        confirmed: true,
        blocked: false,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture || '',
        password: `Auto.${Math.random().toString(36).slice(2)}Aa1!`,
        role: defaultRole?.id,
      });
      user = created;
    }

    const jwt = await this.issueAdminJwt(user);
    return {
      ok: true,
      data: {
        jwt,
        user: {
          id: user.id,
          email: user.email,
          name: payload.name || getUserName(user),
          picture: payload.picture || user.picture || '',
          method: 'google',
        },
      },
    };
  },

  async getOrdersRaw() {
    const rows = await strapi.db.query('api::order.order').findMany({
      populate: { user: true, courier: true, review: true },
      orderBy: { createdAt: 'desc' },
    });
    return dedupeByDocumentId(rows);
  },

  async getCouriersRaw() {
    const rows = await strapi.db.query('api::courier-estafeta.courier-estafeta').findMany({
      populate: ['orders'],
      orderBy: { createdAt: 'desc' },
    });
    return dedupeByDocumentId(rows);
  },

  async getOrdersMapped() {
    const entries = await this.getOrdersRaw();
    return entries.map((e: any) => buildPublicOrder(e));
  },

  async getCouriersMapped() {
    const orders = await this.getOrdersMapped();
    const activeByCourier: Record<string, number> = {};
    for (const o of orders) {
      if (!o.courierId) continue;
      if (!['ASSIGNED', 'IN_TRANSIT'].includes(o.status)) continue;
      activeByCourier[o.courierId] = (activeByCourier[o.courierId] || 0) + 1;
    }
    const entries = await this.getCouriersRaw();
    return entries.map((e: any) => buildPublicCourier(e, activeByCourier[idToPublic('ST', e.documentId || e.id)] || 0));
  },

  async ensureCatalogProductsSeeded() {
    const existing = await strapi.db.query('api::catalog-product.catalog-product').count();
    if (existing > 0) return;
    for (const row of DEFAULT_CATALOG_PRODUCTS) {
      await strapi.documents('api::catalog-product.catalog-product').create({
        data: {
          sku: row.sku,
          name: row.name,
          desc: row.desc,
          price: row.price,
          gomas: row.gomas,
          popular: row.popular,
          discountLabel: row.discountLabel,
          active: true,
          sortOrder: row.sortOrder,
          brand: 'GoGummies',
          category: 'Geral',
          lowStockThreshold: 0,
          stock: 0,
        },
        status: 'published',
      });
    }
  },

  async getCatalogProducts() {
    await this.ensureCatalogProductsSeeded();
    const rows = await strapi.db.query('api::catalog-product.catalog-product').findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r: any) => mapCatalogProduct(r)).filter((r: any) => !!r);
  },

  async upsertCatalogProduct(payload: any) {
    const sku = String(payload.sku || '').trim().toUpperCase();
    const name = String(payload.name || '').trim();
    if (!sku || !name) return { ok: false, error: 'SKU e nome são obrigatórios.' };

    const existing = await strapi.db.query('api::catalog-product.catalog-product').findOne({ where: { sku } });
    const data = {
      sku,
      name,
      desc: String(payload.desc || '').trim(),
      price: Math.max(0, toNum(payload.price, 0)),
      gomas: Math.max(0, toNum(payload.gomas, 0)),
      popular: !!payload.popular,
      discountLabel: String(payload.discountLabel ?? payload.discount ?? '').trim(),
      imageUrl: String(payload.imageUrl || '').trim(),
      active: payload.active !== false,
      sortOrder: Math.max(0, toNum(payload.sortOrder, 0)),
      brand: String(payload.brand || 'GoGummies').trim(),
      category: String(payload.category || 'Geral').trim(),
      lowStockThreshold: Math.max(0, toNum(payload.lowStockThreshold, 0)),
      stock: Math.max(0, toNum(payload.stock, 0)),
    };

    const saved = existing
      ? await strapi.documents('api::catalog-product.catalog-product').update({
          documentId: existing.documentId,
          data,
          status: 'published',
        })
      : await strapi.documents('api::catalog-product.catalog-product').create({
          data,
          status: 'published',
        });

    return { ok: true, data: mapCatalogProduct(saved) };
  },

  async deleteCatalogProduct(publicIdOrSku: string) {
    const token = parsePublicToken(publicIdOrSku, 'PR');
    const numeric = Number(token);
    let target = await strapi.db.query('api::catalog-product.catalog-product').findOne({ where: { documentId: token } });
    if (!target && Number.isFinite(numeric)) target = await strapi.db.query('api::catalog-product.catalog-product').findOne({ where: { id: numeric } });
    if (!target) {
      target = await strapi.db.query('api::catalog-product.catalog-product').findOne({ where: { sku: String(publicIdOrSku || '').trim().toUpperCase() } });
    }
    if (!target) return { ok: false, error: 'Produto não encontrado.' };
    await strapi.db.query('api::catalog-product.catalog-product').delete({ where: { id: target.id } });
    return { ok: true, data: { id: publicIdOrSku } };
  },

  async ensureContinentStoresSeeded() {
    const existing = await strapi.db.query('api::continent-store.continent-store').count();
    if (existing > 0) return;
    for (const row of CONTINENTE_STORES_SEED) {
      await strapi.documents('api::continent-store.continent-store').create({
        data: {
          code: row.code,
          name: row.name,
          city: row.city,
          district: row.district,
          address: row.address,
          postalCode: row.postalCode,
          lat: row.lat,
          lng: row.lng,
          openingHours: row.openingHours,
          phone: row.phone || '',
          format: row.format,
          isActive: true,
        },
        status: 'published',
      });
    }
  },

  async getContinentStores() {
    await this.ensureContinentStoresSeeded();
    const rows = await strapi.db.query('api::continent-store.continent-store').findMany({
      orderBy: [{ district: 'asc' }, { city: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r: any) => mapContinentStore(r)).filter(Boolean);
  },

  async createContinentStore(ctx: BoCtx | undefined, payload: any) {
    const code = String(payload.code || '').trim().toUpperCase();
    const name = String(payload.name || '').trim();
    if (!code || !name) return { ok: false, error: 'Código e nome da loja são obrigatórios.' };
    const existing = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { code } });
    if (existing) return { ok: false, error: 'Já existe uma loja com esse código.' };
    const created = await strapi.documents('api::continent-store.continent-store').create({
      data: {
        code,
        name,
        city: String(payload.city || '').trim(),
        district: String(payload.district || '').trim(),
        address: String(payload.address || '').trim(),
        postalCode: String(payload.postalCode || '').trim(),
        lat: toNum(payload.lat, 0),
        lng: toNum(payload.lng, 0),
        openingHours: String(payload.openingHours || '').trim(),
        phone: String(payload.phone || '').trim(),
        format: payload.format || 'Hiper',
        isActive: payload.isActive !== false,
      },
      status: 'published',
    });
    const mapped = mapContinentStore(created);

    return { ok: true, data: mapped };
  },

  async updateContinentStore(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const token = parsePublicToken(publicId, 'CT');
    const numeric = Number(token);
    let target = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { documentId: token } });
    if (!target && Number.isFinite(numeric)) target = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { id: numeric } });
    if (!target) return { ok: false, error: 'Loja não encontrada.' };

    const before = mapContinentStore(target);
    const nextCode = payload.code != null ? String(payload.code).trim().toUpperCase() : target.code;
    if (!nextCode) return { ok: false, error: 'Código da loja obrigatório.' };
    if (nextCode !== target.code) {
      const codeTaken = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { code: nextCode } });
      if (codeTaken && codeTaken.id !== target.id) return { ok: false, error: 'Código já em uso por outra loja.' };
    }

    const updated = await strapi.documents('api::continent-store.continent-store').update({
      documentId: target.documentId,
      data: {
        code: nextCode,
        name: payload.name ?? target.name,
        city: payload.city ?? target.city,
        district: payload.district ?? target.district,
        address: payload.address ?? target.address,
        postalCode: payload.postalCode ?? target.postalCode,
        lat: payload.lat != null ? toNum(payload.lat, 0) : target.lat,
        lng: payload.lng != null ? toNum(payload.lng, 0) : target.lng,
        openingHours: payload.openingHours ?? target.openingHours,
        phone: payload.phone ?? target.phone,
        format: payload.format ?? target.format,
        isActive: payload.isActive != null ? !!payload.isActive : target.isActive,
      },
      status: 'published',
    });

    const after = mapContinentStore(updated);

    return { ok: true, data: after };
  },

  async deleteContinentStore(ctx: BoCtx | undefined, publicId: string) {
    const token = parsePublicToken(publicId, 'CT');
    const numeric = Number(token);
    let target = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { documentId: token } });
    if (!target && Number.isFinite(numeric)) target = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { id: numeric } });
    if (!target) return { ok: false, error: 'Loja não encontrada.' };

    const linkedInventory = await strapi.db.query('api::store-inventory-item.store-inventory-item').findOne({
      where: { store: { id: target.id } },
      select: ['id'],
    });
    if (linkedInventory) return { ok: false, error: 'Loja com stock associado. Remove os itens antes de eliminar.' };

    const before = mapContinentStore(target);
    await strapi.db.query('api::continent-store.continent-store').delete({ where: { id: target.id } });

    return { ok: true, data: { id: publicId } };
  },

  async getStoreInventory(publicStoreId: string, filters: any) {
    const token = parsePublicToken(publicStoreId, 'CT');
    const numeric = Number(token);
    let store = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { documentId: token } });
    if (!store && Number.isFinite(numeric)) store = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { id: numeric } });
    if (!store) return { ok: false, error: 'Loja não encontrada.' };

    const rows = await strapi.db.query('api::store-inventory-item.store-inventory-item').findMany({
      where: { store: { id: store.id } },
      populate: { store: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    let mapped = rows.map((r: any) => mapInventoryItem(r));
    const q = String(filters?.q || '').trim().toLowerCase();
    if (q) {
      mapped = mapped.filter((r: any) => `${r.sku} ${r.name} ${r.brand} ${r.category}`.toLowerCase().includes(q));
    }
    return { ok: true, data: mapped };
  },

  async upsertInventoryItem(ctx: BoCtx | undefined, publicStoreId: string, payload: any) {
    const token = parsePublicToken(publicStoreId, 'CT');
    const numeric = Number(token);
    let store = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { documentId: token } });
    if (!store && Number.isFinite(numeric)) store = await strapi.db.query('api::continent-store.continent-store').findOne({ where: { id: numeric } });
    if (!store) return { ok: false, error: 'Loja não encontrada.' };

    const sku = String(payload.sku || '').trim().toUpperCase();
    const name = String(payload.name || '').trim();
    if (!sku || !name) return { ok: false, error: 'SKU e nome do item são obrigatórios.' };

    const existing = await strapi.db.query('api::store-inventory-item.store-inventory-item').findOne({
      where: { store: { id: store.id }, sku },
      populate: { store: true },
    });

    const data = {
      sku,
      name,
      brand: String(payload.brand || '').trim(),
      category: String(payload.category || '').trim(),
      unit: payload.unit || 'un',
      stock: Math.max(0, toNum(payload.stock, 0)),
      reservedStock: Math.max(0, toNum(payload.reservedStock, 0)),
      reorderLevel: Math.max(0, toNum(payload.reorderLevel, 0)),
      price: Math.max(0, toNum(payload.price, 0)),
      isActive: payload.isActive !== false,
      lastCountedAt: payload.lastCountedAt || null,
      store: store.id,
    };

    const before = existing ? mapInventoryItem(existing) : null;
    const saved = existing
      ? await strapi.documents('api::store-inventory-item.store-inventory-item').update({
          documentId: existing.documentId,
          data,
          status: 'published',
          populate: { store: true },
        })
      : await strapi.documents('api::store-inventory-item.store-inventory-item').create({
          data,
          status: 'published',
          populate: { store: true },
        });

    const after = mapInventoryItem(saved);

    return { ok: true, data: after };
  },

  async deleteInventoryItem(ctx: BoCtx | undefined, publicStoreId: string, publicItemId: string) {
    const itemToken = parsePublicToken(publicItemId, 'SI');
    const itemNumeric = Number(itemToken);
    let target = await strapi.db.query('api::store-inventory-item.store-inventory-item').findOne({
      where: { documentId: itemToken },
      populate: { store: true },
    });
    if (!target && Number.isFinite(itemNumeric)) {
      target = await strapi.db.query('api::store-inventory-item.store-inventory-item').findOne({
        where: { id: itemNumeric },
        populate: { store: true },
      });
    }
    if (!target) return { ok: false, error: 'Item de stock não encontrado.' };

    const storeToken = parsePublicToken(publicStoreId, 'CT');
    if (String(target.store?.documentId) !== storeToken && String(target.store?.id) !== storeToken) {
      return { ok: false, error: 'Item não pertence à loja indicada.' };
    }

    const before = mapInventoryItem(target);
    await strapi.db.query('api::store-inventory-item.store-inventory-item').delete({ where: { id: target.id } });

    return { ok: true, data: { id: publicItemId } };
  },

  async listOrders(filters: any) {
    const rows = await this.getOrdersMapped();
    const allowedBoStatuses = new Set(['PENDING', 'INFO_REQUESTED', 'REJECTED', 'APPROVED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED']);
    const requestedStatus = String(filters.status || '').trim();
    const byStatus = allowedBoStatuses.has(requestedStatus) ? requestedStatus : '';
    return rows.filter((o: any) => {
      if (byStatus && o.status !== byStatus) return false;
      if (filters.priority && String(o.priority) !== String(filters.priority)) return false;
      if (filters.type && o.type !== filters.type) return false;
      if (filters.zone && o.zone !== filters.zone) return false;
      if (filters.q) {
        const q = String(filters.q).toLowerCase();
        if (!o.id.toLowerCase().includes(q) && !o.clientName.toLowerCase().includes(q) && !o.clientEmail.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  },

  async getOrder(ctx: BoCtx | undefined, publicId: string) {
    const rows = await this.getOrdersMapped();
    const order = rows.find((o: any) => o.id === publicId || String(o._documentId) === publicId) ?? null;
    if (!order) return null;
    const couriers = await this.getCouriersMapped();
    const suggestedCouriers = couriers
      .map((c: any) => {
        const scored = scoreCourierForOrder(order, c);
        return { courier: c, ...scored };
      })
      .filter((x: any) => x.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((x: any) => ({
        id: x.courier.id,
        name: x.courier.name,
        score: x.score,
        reasons: x.reasons,
        distanceKm: x.distanceKm,
      }));
    return { ...order, suggestedCouriers };
  },

  async patchOrder(publicId: string, patch: any) {
    const token = parsePublicToken(publicId, 'GE');
    const numericId = Number(token);
    let target = await strapi.db.query('api::order.order').findOne({
      where: { documentId: token },
    });
    if (!target && Number.isFinite(numericId)) {
      target = await strapi.db.query('api::order.order').findOne({
        where: { id: numericId },
      });
    }
    if (!target) return null;
    const updated = await strapi.documents('api::order.order').update({
      documentId: target.documentId,
      data: patch.data,
      status: 'published',
      populate: { user: true, courier: true, review: true },
    });
    return updated;
  },

  async notify(type: string, message: string, userId?: number) {
    try {
      await strapi.documents('api::notification.notification').create({
        data: {
          type,
          message,
          sentAt: new Date().toISOString(),
          isRead: false,
          ...(userId ? { user: userId } : {}),
        },
        status: 'published',
      });
    } catch {
    }
  },

  async trySendEmail(to: string, subject: string, text: string) {
    try {
      const emailService = strapi.plugin('email')?.service('email');
      if (!emailService) return;
      await emailService.send({ to, subject, text });
    } catch {
      // email provider is optional in dev
    }
  },

  async approveOrder(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    if (!['PENDING', 'INFO_REQUESTED'].includes(order.status)) {
      return { ok: false, error: 'Estado não permite aprovação.' };
    }

    const stores = await this.getContinentStores();
    const store = stores.find((s: any) => s.id === payload.storeId || s.code === payload.storeId);
    const updated = await this.patchOrder(publicId, {
      data: {
        order_status: ORDER_STATE.APPROVED,
        total_price: toNum(payload.costEuro, 0),
        estimatedTime: Math.max(1, toNum(payload.etaMinutes, 10)),
        store_name: store?.name || payload.storeId || 'Continente',
        storeLatitude: store?.lat,
        storeLongitude: store?.lng,
        priority: clampPriority(payload.priority ?? order.priority),
        items: {
          boMeta: {
            storeId: (store?.id || payload.storeId || null),
            resources: payload.resources || '',
            type: order.type,
            zone: order.zone,
            city: order.city,
          },
        },
      },
    });
    if (!updated) return { ok: false, error: 'Falha ao atualizar pedido.' };
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async rejectOrder(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const reason = String(payload.justification || payload.reason || '').trim();
    if (!reason) return { ok: false, error: 'Justificação obrigatória.' };
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    const updated = await this.patchOrder(publicId, {
      data: {
        order_status: ORDER_STATE.REJECTED,
        rejectionReason: reason,
        courier: null,
        items: {
          boMeta: {
            ...((order as any).items?.boMeta || {}),
            infoRequestMessage: null,
            type: order.type,
            zone: order.zone,
            city: order.city,
          },
        },
      },
    });
    if (!updated) return { ok: false, error: 'Falha ao rejeitar pedido.' };
    await this.notify('order_rejected', `Pedido ${order.id} rejeitado: ${reason}`, parsePublicId(order.clientId, 'CU'));
    await this.trySendEmail(order.clientEmail, `Pedido ${order.id} rejeitado`, `Motivo: ${reason}`);
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async requestOrderInfo(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const message = String(payload.message || '').trim();
    if (!message) return { ok: false, error: 'Mensagem obrigatória.' };
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    const updated = await this.patchOrder(publicId, {
      data: {
        order_status: ORDER_STATE.INFO_REQUESTED,
        items: {
          boMeta: {
            ...((order as any).items?.boMeta || {}),
            infoRequestMessage: message,
            type: order.type,
            zone: order.zone,
            city: order.city,
          },
        },
      },
    });
    if (!updated) return { ok: false, error: 'Falha ao atualizar pedido.' };
    await this.notify('order_info_requested', `Pedido ${order.id}: informação adicional solicitada.`, parsePublicId(order.clientId, 'CU'));
    await this.trySendEmail(order.clientEmail, `Pedido ${order.id} - informação adicional`, message);
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async assignCourier(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const courierToken = parsePublicToken(payload.courierId, 'ST');
    const courierIdNumeric = Number(courierToken);
    if (!courierToken) return { ok: false, error: 'Estafeta inválido.' };
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    if (!['APPROVED', 'ASSIGNED'].includes(order.status)) {
      return { ok: false, error: 'Aprova o pedido antes de atribuir estafeta.' };
    }
    let courierEntity = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
      where: { documentId: courierToken },
    });
    if (!courierEntity && Number.isFinite(courierIdNumeric)) {
      courierEntity = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
        where: { id: courierIdNumeric },
      });
    }
    if (!courierEntity) return { ok: false, error: 'Estafeta não encontrado.' };
    const courier = buildPublicCourier(courierEntity);
    if (courier.state !== 'E-06' || !courier.online) return { ok: false, error: 'Estafeta indisponível.' };
    if (!courier.zones.includes(order.zone)) return { ok: false, error: 'Estafeta não cobre a zona.' };
    if (courier.activeAssignments >= courier.maxConcurrent) {
      return { ok: false, error: 'Limite de entregas simultâneas atingido.' };
    }

    const updated = await this.patchOrder(publicId, {
      data: {
        order_status: ORDER_STATE.ASSIGNED,
        courier: courierEntity.id,
      },
    });
    if (!updated) return { ok: false, error: 'Falha ao atribuir estafeta.' };
    await this.notify('order_assigned', `Pedido ${order.id} atribuído ao estafeta ${courier.name}.`);
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async setPriority(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const priority = clampPriority(payload.priority);
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    const updated = await this.patchOrder(publicId, {
      data: { priority, is_urgent: priority === 5 },
    });
    if (!updated) return { ok: false, error: 'Falha ao atualizar prioridade.' };
    if (priority === 5) {
      await this.notify('priority_urgent', `ALERTA IMEDIATO: ${order.id} definido com prioridade 5.`);
    }
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async startTransit(ctx: BoCtx | undefined, publicId: string) {
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    if (order.status !== 'ASSIGNED') return { ok: false, error: 'Apenas pedidos atribuídos podem iniciar trânsito.' };
    const updated = await this.patchOrder(publicId, { data: { order_status: ORDER_STATE.IN_TRANSIT } });
    if (!updated) return { ok: false, error: 'Falha ao iniciar trânsito.' };
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async completeOrder(ctx: BoCtx | undefined, publicId: string) {
    const before = auditSnapshotOrder(await this.getOrder(ctx, publicId));
    const order = before;
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };
    if (order.status !== 'IN_TRANSIT') return { ok: false, error: 'Apenas pedidos em trânsito podem ser concluídos.' };
    const updated = await this.patchOrder(publicId, { data: { order_status: ORDER_STATE.DELIVERED } });
    if (!updated) return { ok: false, error: 'Falha ao concluir pedido.' };
    const after = buildPublicOrder(updated);

    return { ok: true, data: after };
  },

  async listCouriers() {
    return this.getCouriersMapped();
  },

  async getCourier(publicId: string) {
    const rows = await this.getCouriersMapped();
    return rows.find((c: any) => c.id === publicId || String(c._documentId) === publicId) ?? null;
  },

  async createCourier(ctx: BoCtx | undefined, payload: any) {
    const name = String(payload.name || '').trim();
    if (!name) return { ok: false, error: 'Nome obrigatório.' };
    const emailRes = validateEmail(payload.email);
    if (!emailRes.ok) return { ok: false, error: (emailRes as any).error as string };
    const nifRes = validatePtNif(payload.nif);
    if (!nifRes.ok) return { ok: false, error: (nifRes as any).error as string };
    const ibanRes = validatePtIban(payload.iban);
    if (!ibanRes.ok) return { ok: false, error: (ibanRes as any).error as string };
    const phoneRes = validatePtPhone(payload.phone);
    if (!phoneRes.ok) return { ok: false, error: (phoneRes as any).error as string };
    const plateRaw = payload.plate ?? payload.vehicle?.plate;
    const plateRes = validatePtPlate(plateRaw);
    if (!plateRes.ok) return { ok: false, error: (plateRes as any).error as string };

    const split = splitCourierName(name);
    const created = await strapi.documents('api::courier-estafeta.courier-estafeta').create({
      data: {
        firstName: split.firstName,
        lastName: split.lastName,
        email: emailRes.value,
        phone: phoneRes.value,
        nif: nifRes.value,
        cc: payload.cc || '',
        birthDate: payload.birthDate || null,
        address: payload.address || '',
        iban: ibanRes.value,
        courier_status: COURIER_STATE.E01,
        isOnline: false,
        maxSimultaneousDeliveries: Math.max(1, toNum(payload.maxConcurrent, 2)),
        zone: Array.isArray(payload.zones) ? payload.zones.join(', ') : (payload.zone || 'Outro'),
        vehicleType: payload.vehicleType || '',
        vehicleBrand: payload.brand || '',
        vehicleModel: payload.model || '',
        vehiclePlate: plateRes.value,
        rating: 0,
        totalDeliveries: 0,
      },
      status: 'published',
    });
    strapi.log.info(`[BO] createCourier ST-${created.id}`);
    const pub = buildPublicCourier(created);

    return { ok: true, data: pub };
  },

  async updateCourier(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const token = parsePublicToken(publicId, 'ST');
    const courierId = Number(token);
    let target = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
      where: { documentId: token },
    });
    if (!target && Number.isFinite(courierId)) {
      target = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({ where: { id: courierId } });
    }
    if (!target) return { ok: false, error: 'Estafeta não encontrado.' };
    const before = auditSnapshotCourier(buildPublicCourier(target));

    const nextEmail = payload.email != null ? String(payload.email).trim() : target.email;
    const emailRes = validateEmail(nextEmail);
    if (!emailRes.ok) return { ok: false, error: (emailRes as any).error as string };

    const nextNif = payload.nif != null ? String(payload.nif).trim() : target.nif;
    const nifRes = validatePtNif(nextNif);
    if (!nifRes.ok) return { ok: false, error: (nifRes as any).error as string };

    const nextIban = payload.iban != null ? String(payload.iban).trim() : target.iban;
    const ibanRes = validatePtIban(nextIban);
    if (!ibanRes.ok) return { ok: false, error: (ibanRes as any).error as string };

    const nextPhone = payload.phone != null ? String(payload.phone).trim() : target.phone;
    const phoneRes = validatePtPhone(nextPhone);
    if (!phoneRes.ok) return { ok: false, error: (phoneRes as any).error as string };

    const plateRaw = payload.vehicle?.plate ?? payload.plate ?? target.vehiclePlate;
    const plateRes = validatePtPlate(plateRaw);
    if (!plateRes.ok) return { ok: false, error: (plateRes as any).error as string };

    const split = splitCourierName(payload.name || `${target.firstName || ''} ${target.lastName || ''}`);
    const updated = await strapi.documents('api::courier-estafeta.courier-estafeta').update({
      documentId: target.documentId,
      data: {
        firstName: split.firstName,
        lastName: split.lastName,
        email: emailRes.value,
        phone: phoneRes.value,
        nif: nifRes.value,
        cc: payload.cc ?? target.cc,
        birthDate: payload.birthDate ?? target.birthDate,
        address: payload.address ?? target.address,
        iban: ibanRes.value,
        maxSimultaneousDeliveries:
          payload.maxConcurrent != null ? Math.max(1, toNum(payload.maxConcurrent, 1)) : target.maxSimultaneousDeliveries,
        zone: Array.isArray(payload.zones) ? payload.zones.join(', ') : (payload.zone ?? target.zone),
        vehicleType: payload.vehicle?.type ?? payload.vehicleType ?? target.vehicleType,
        vehicleBrand: payload.vehicle?.brand ?? payload.brand ?? target.vehicleBrand,
        vehicleModel: payload.vehicle?.model ?? payload.model ?? target.vehicleModel,
        vehiclePlate: plateRes.value,
      },
      status: 'published',
    });
    strapi.log.info(`[BO] updateCourier ${publicId}`);
    const after = buildPublicCourier(updated);

    return { ok: true, data: after };
  },

  async courierAction(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const action = String(payload.action || '').trim();
    const token = parsePublicToken(publicId, 'ST');
    const courierId = Number(token);
    let target = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({
      where: { documentId: token },
    });
    if (!target && Number.isFinite(courierId)) {
      target = await strapi.db.query('api::courier-estafeta.courier-estafeta').findOne({ where: { id: courierId } });
    }
    if (!target) return { ok: false, error: 'Estafeta não encontrado.' };
    const before = auditSnapshotCourier(buildPublicCourier(target));

    const patch: Record<string, any> = {};
    if (action === 'verify') {
      patch.courier_status = COURIER_STATE.E02;
      patch.isOnline = false;
    } else if (action === 'reject') {
      patch.courier_status = COURIER_STATE.E03;
      patch.isOnline = false;
    } else if (action === 'request_info') {
      await this.trySendEmail(target.email, 'Informação adicional necessária', String(payload.message || 'Completa a documentação.'));
    } else if (action === 'suspend') {
      patch.courier_status = COURIER_STATE.E04;
      patch.isOnline = false;
    } else if (action === 'reactivate') {
      patch.courier_status = COURIER_STATE.E05;
      patch.isOnline = false;
    } else if (action === 'toggle_online') {
      const shouldOnline = !!payload.online;
      patch.isOnline = shouldOnline;
      patch.courier_status = shouldOnline ? COURIER_STATE.E06 : COURIER_STATE.E05;
    } else if (action === 'set_max') {
      patch.maxSimultaneousDeliveries = Math.max(1, Math.min(10, toNum(payload.maxConcurrent, target.maxSimultaneousDeliveries || 1)));
    } else {
      return { ok: false, error: 'Ação inválida.' };
    }

    const updated = Object.keys(patch).length
      ? await strapi.documents('api::courier-estafeta.courier-estafeta').update({
          documentId: target.documentId,
          data: patch,
          status: 'published',
        })
      : target;
    strapi.log.info(`[BO] courierAction ${publicId} => ${action}`);
    const after = buildPublicCourier(updated);

    return { ok: true, data: after };
  },

  async getOperationsMap() {
    const orders = await this.getOrdersMapped();
    const couriers = await this.getCouriersMapped();
    const activeOrders = orders.filter((o: any) => ['APPROVED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status));
    const stores = await this.getContinentStores();
    return {
      stores: stores.filter((s: any) => s.isActive),
      couriers: couriers.filter((c: any) => c.online || c.state === 'E-06'),
      activeOrders,
    };
  },

  async getCustomers() {
    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'username', 'city', 'zone', 'nif', 'notes', 'marketingOptIn'],
      populate: {
        orders: {
          select: ['id', 'createdAt', 'total_price', 'order_status'],
        },
        reviews: {
          select: ['rating'],
        },
      },
    });
    return users.map((u: any) => {
      const orders = u.orders || [];
      const delivered = orders.filter((o: any) => mapOrderStatus(o.order_status) === 'DELIVERED');
      const totalSpent = delivered.reduce((acc: number, o: any) => acc + toNum(o.total_price, 0), 0);
      const lastOrderAt = orders.length ? orders.map((o: any) => o.createdAt).sort().slice(-1)[0] : null;
      const ratings = (u.reviews || []).map((r: any) => toNum(r.rating, 0)).filter((n: number) => n > 0);
      const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      return {
        id: idToPublic('CU', u.id),
        name: getUserName(u),
        email: u.email,
        phone: u.phone || '',
        city: u.city || '—',
        zone: u.zone || 'Outro',
        ordersCount: orders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderAt,
        avgRating: Math.round(avgRating * 10) / 10,
        nif: u.nif || '',
        notes: u.notes || '',
        marketingOptIn: !!u.marketingOptIn,
      };
    });
  },

  async createCustomer(ctx: BoCtx | undefined, payload: any) {
    const name = String(payload.name || '').trim();
    if (!name) return { ok: false, error: 'Nome obrigatório.' };
    const emailRes = validateEmail(payload.email);
    if (!emailRes.ok) return { ok: false, error: (emailRes as any).error as string };
    const email = emailRes.value;
    const phoneRes = validatePtPhone(payload.phone);
    if (!phoneRes.ok) return { ok: false, error: (phoneRes as any).error as string };
    const nifRaw = String(payload.nif || '').trim();
    let nifVal = '';
    if (nifRaw) {
      const nifRes = validatePtNif(nifRaw);
      if (!nifRes.ok) return { ok: false, error: (nifRes as any).error as string };
      nifVal = nifRes.value;
    }
    const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email },
      select: ['id'],
    });
    if (existing) return { ok: false, error: 'Email já registado.' };
    const parts = splitCourierName(name);
    const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
      select: ['id'],
    });
    const created = await strapi.plugin('users-permissions').service('user').add({
      username: email,
      email,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: defaultRole?.id,
      firstName: parts.firstName,
      lastName: parts.lastName,
      phone: phoneRes.value,
      city: payload.city || '',
      zone: payload.zone || 'Outro',
      nif: nifVal,
      notes: payload.notes || '',
      marketingOptIn: !!payload.marketingOptIn,
      password: `Auto.${Math.random().toString(36).slice(2)}Aa1!`,
    });
    const rows = await this.getCustomers();
    const mapped = rows.find((r: any) => r.id === idToPublic('CU', created.id));

    return { ok: true, data: mapped || null };
  },

  async updateCustomer(ctx: BoCtx | undefined, publicId: string, payload: any) {
    const token = parsePublicToken(publicId, 'CU');
    const userId = Number(token);
    if (!Number.isFinite(userId)) return { ok: false, error: 'Cliente inválido.' };
    const target = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'city', 'zone', 'nif', 'notes', 'marketingOptIn'],
    });
    if (!target) return { ok: false, error: 'Cliente não encontrado.' };
    const before = {
      id: idToPublic('CU', target.id),
      name: getUserName(target),
      email: target.email,
      phone: target.phone || '',
      city: target.city || '',
      zone: target.zone || 'Outro',
      nif: target.nif || '',
      notes: target.notes || '',
      marketingOptIn: !!target.marketingOptIn,
    };

    const nextEmail = payload.email != null ? String(payload.email).trim() : target.email;
    const emailRes = validateEmail(nextEmail);
    if (!emailRes.ok) return { ok: false, error: (emailRes as any).error as string };
    if (emailRes.value !== target.email) {
      const taken = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: emailRes.value },
        select: ['id'],
      });
      if (taken && taken.id !== target.id) return { ok: false, error: 'Email já registado.' };
    }

    const fullName = payload.name != null ? String(payload.name).trim() : `${target.firstName || ''} ${target.lastName || ''}`.trim();
    const parts = splitCourierName(fullName);

    const nextPhone = payload.phone != null ? String(payload.phone).trim() : target.phone || '';
    const phoneRes = validatePtPhone(nextPhone);
    if (!phoneRes.ok) return { ok: false, error: (phoneRes as any).error as string };

    const nextNif = payload.nif != null ? String(payload.nif).trim() : target.nif || '';
    let nifForDb: string | undefined;
    if (nextNif) {
      const nifRes = validatePtNif(nextNif);
      if (!nifRes.ok) return { ok: false, error: (nifRes as any).error as string };
      nifForDb = nifRes.value;
    } else if (payload.nif != null) {
      nifForDb = '';
    }

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: {
        email: emailRes.value,
        username: emailRes.value,
        firstName: parts.firstName,
        lastName: parts.lastName,
        phone: phoneRes.value,
        city: payload.city ?? undefined,
        zone: payload.zone ?? undefined,
        nif: nifForDb,
        notes: payload.notes ?? undefined,
        marketingOptIn: payload.marketingOptIn != null ? !!payload.marketingOptIn : undefined,
      },
    });

    const rows = await this.getCustomers();
    const mapped = rows.find((r: any) => r.id === idToPublic('CU', userId));

    return { ok: true, data: mapped || null };
  },

  async deleteCustomer(ctx: BoCtx | undefined, publicId: string) {
    const token = parsePublicToken(publicId, 'CU');
    const userId = Number(token);
    if (!Number.isFinite(userId)) return { ok: false, error: 'Cliente inválido.' };
    const target = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName'],
    });
    const hasOrders = await strapi.db.query('api::order.order').findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });
    if (hasOrders) return { ok: false, error: 'Existem pedidos associados — não é possível eliminar.' };
    await strapi.db.query('plugin::users-permissions.user').delete({
      where: { id: userId },
    });

    return { ok: true, data: { id: idToPublic('CU', userId) } };
  },

  async getPublicMetrics() {
    const [orders, rawOrders, couriers] = await Promise.all([
      this.getOrdersMapped(),
      this.getOrdersRaw(),
      this.getCouriersMapped()
    ]);
    const delivered = orders.filter((o: any) => o.status === 'DELIVERED').length;
    
    const slaMetrics = computeSlaMetrics(rawOrders);
    const etaTotal = (slaMetrics?.avgMinutesInPending || 0) + 
                     (slaMetrics?.avgMinutesInApproved || 0) + 
                     (slaMetrics?.avgMinutesInAssigned || 0);
    const avgEta = etaTotal > 0 ? Math.round(etaTotal) : 30;
    
    const ratedOrders = rawOrders.filter((r: any) => r.rating && r.rating > 0);
    const avgRating = ratedOrders.length > 0 
      ? (ratedOrders.reduce((acc: number, r: any) => acc + r.rating, 0) / ratedOrders.length).toFixed(1)
      : '4.9';
      
    const activeCouriers = couriers.length;

    return {
      deliveries: delivered > 1000 ? `${(delivered / 1000).toFixed(1)}k+` : `${delivered}`,
      eta: avgEta,
      rating: `${avgRating}/5`,
      couriers: `${activeCouriers}+`
    };
  },

  async chatWithBot(body: any) {
    const userMessage = body?.message || '';
    const history = body?.history || [];
    if (!userMessage) return { error: 'A mensagem está vazia.' };
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: 'O assistente encontra-se temporariamente indisponível.' };

    let conversation = history.map((m: any) => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.text}`).join('\n');
    if (!conversation) conversation = `Cliente: ${userMessage}`;

    const prompt = `
És o Gummy Bot, o assistente virtual da plataforma GoEverywhere (startup portuguesa de logística).
Tens de ser prestativo, profissional mas amigável (trata o cliente por "tu", português de Portugal).

A tua função é guiar os clientes a utilizarem a nossa App. Aqui estão as informações e respostas úteis que deves dar:
1. SALDO DE PONTOS: Se perguntarem pelos seus pontos, responde: "Para veres o teu saldo de GoPoints, basta clicares no botão com as iniciais do teu nome no canto superior direito do ecrã!"
2. GANHAR PONTOS: "Sempre que fazes uma encomenda connosco ganhas pontos! Por cada 1€ que gastas recebes 10 GoPoints."
3. OFERTAS DOS GOPOINTS: "Podes trocar os teus pontos na hora do checkout: 500 GoPoints dão-te Entrega Grátis, e 1000 GoPoints dão-te um Desconto de 10€ na encomenda."
4. MODO URGENTE: "A entrega urgente custa apenas +1.50€. A tua encomenda entra com prioridade máxima na atribuição ao estafeta (tempo indicativo ~15 min, conforme zona e tráfego)."
5. ENTREGAS: "As recolhas são feitas de forma totalmente automatizada numa loja Continente perto de ti e entregues no teu destino."
6. PROBLEMAS NA ENCOMENDA: "Se tiveres algum problema com a encomenda, vai ao separador 'Histórico' no menu superior, seleciona a encomenda e envia uma mensagem na caixa de 'Contacto' (que será lida pelos nossos administradores)."
7. ASSISTENTE HUMANO: "Neste momento a nossa linha principal de apoio aos clientes faz-se diretamente pela área de Histórico, onde podes enviar mensagens ao administrador sobre qualquer encomenda!"

Sê conciso (máx. 2 a 3 frases por resposta), prático e ajuda ativamente o utilizador a navegar no site. Nunca digas "não tenho acesso a isso", diz antes "Para veres isso, vai ao menu X".

Histórico da conversa:
${conversation}

Responde apenas com a tua próxima fala.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await res.json() as any;
      let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Ocorreu um erro a processar o seu pedido.';
      reply = reply.replace(/^Assistente:\s*/i, '').trim();
      return { reply };
    } catch (err) {
      console.error('Gemini API Error:', err);
      return { error: 'Erro de comunicação com a IA.' };
    }
  },

  async getDashboard() {
    const [orders, rawOrders, couriers, customers] = await Promise.all([
      this.getOrdersMapped(),
      this.getOrdersRaw(),
      this.getCouriersMapped(),
      this.getCustomers(),
    ]);
    const slaMetrics = computeSlaMetrics(rawOrders);
    const today = new Date().toISOString().slice(0, 10);
    const hourlyVolume = Array(24).fill(0);
    const deliveriesByZone: Record<string, number> = {};
    for (const o of orders) {
      const hour = new Date(o.createdAt).getHours();
      hourlyVolume[hour] += 1;
      if (o.status !== 'REJECTED') {
        deliveriesByZone[o.zone] = (deliveriesByZone[o.zone] || 0) + 1;
      }
    }
    const active = orders.filter((o: any) => isActiveOrder(o.status)).length;
    return {
      kpiSummary: {
        ordersToday: orders.filter((o: any) => String(o.createdAt || '').startsWith(today)).length,
        active,
        online: couriers.filter((c: any) => c.online).length,
        revenuePipeline: orders
          .filter((o: any) => ['APPROVED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status))
          .reduce((a: number, o: any) => a + toNum(o.costEuro, 0), 0),
        revenueDelivered: orders
          .filter((o: any) => o.status === 'DELIVERED')
          .reduce((a: number, o: any) => a + toNum(o.costEuro, 0), 0),
        totalCustomers: customers.length,
        rejectedCount: orders.filter((o: any) => o.status === 'REJECTED').length,
      },
      hourlyVolume,
      deliveriesByZone: Object.entries(deliveriesByZone)
        .map(([zone, count]) => ({ zone, count }))
        .sort((a, b) => b.count - a.count),
      recentActivity: orders.slice(0, 10).map((o: any) => ({
        id: `act-${o.id}`,
        at: o.createdAt,
        text: `Pedido ${o.id} em estado ${o.status}`,
      })),
      recentReviews: [],
      slaMetrics,
    };
  },

  async getReports() {
    const [orders, rawOrders] = await Promise.all([this.getOrdersMapped(), this.getOrdersRaw()]);
    const now = new Date();
    const months: Array<{ key: string; month: string; k: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
        k: 0,
      });
    }
    const map = new Map(months.map((m, idx) => [m.key, idx]));
    for (const o of orders) {
      if (o.status !== 'DELIVERED') continue;
      const key = String(o.createdAt || '').slice(0, 7);
      const idx = map.get(key);
      if (idx == null) continue;
      months[idx].k += toNum(o.costEuro, 0) / 1000;
    }

    const zoneMap: Record<string, number> = {};
    for (const o of orders) {
      if (o.status === 'REJECTED') continue;
      zoneMap[o.zone] = (zoneMap[o.zone] || 0) + 1;
    }

    const totalOrders = orders.length || 1;
    const cancelled = orders.filter((o: any) => o.status === 'REJECTED').length;
    const packSales = collectPackSales(rawOrders);

    return {
      monthlyRevenueFromOrders: months.map((m) => ({ month: m.month, k: Math.round(m.k * 10) / 10 })),
      packSales,
      deliveriesByZone: Object.entries(zoneMap)
        .map(([zone, count]) => ({ zone, count }))
        .sort((a, b) => b.count - a.count),
      cancellationRatePct: Math.round((cancelled / totalOrders) * 1000) / 10,
    };
  },

  async getBootstrapData() {
    const [stores, products, orders, couriers, customers, rawOrders, reports, map] = await Promise.all([
      this.getContinentStores(),
      this.getCatalogProducts(),
      this.getOrdersMapped(),
      this.getCouriersMapped(),
      this.getCustomers(),
      this.getOrdersRaw(),
      this.getReports(),
      this.getOperationsMap(),
    ]);
    const slaMetrics = computeSlaMetrics(rawOrders);
    const stuckMins = slaMetrics.stuckPendingThresholdMinutes ?? 45;
    const adminAlerts = buildOperationalAdminAlerts(orders, couriers, { stuckPendingMinutes: stuckMins });

    const dashboard = {
      hourlyVolume: Array(24).fill(0),
      recentActivity: orders.slice(0, 10).map((o: any) => ({
        id: `act-${o.id}`,
        at: o.createdAt,
        text: `Pedido ${o.id} em estado ${o.status}`,
      })),
      recentReviews: [],
      kpiSummary: {
        ordersToday: orders.filter((o: any) => String(o.createdAt || '').startsWith(new Date().toISOString().slice(0, 10))).length,
        active: orders.filter((o: any) => isActiveOrder(o.status)).length,
        online: couriers.filter((c: any) => c.online).length,
        revenuePipeline: orders
          .filter((o: any) => ['APPROVED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status))
          .reduce((a: number, o: any) => a + toNum(o.costEuro, 0), 0),
        revenueDelivered: orders
          .filter((o: any) => o.status === 'DELIVERED')
          .reduce((a: number, o: any) => a + toNum(o.costEuro, 0), 0),
        totalCustomers: customers.length,
        rejectedCount: orders.filter((o: any) => o.status === 'REJECTED').length,
      },
    };
    for (const o of orders) {
      const hour = new Date(o.createdAt).getHours();
      dashboard.hourlyVolume[hour] += 1;
    }

    return {
      continentStores: stores,
      orders,
      couriers,
      customers,
      adminAlerts,
      slaMetrics,
      activityLog: dashboard.recentActivity,
      emailLog: [],
      packSales: reports.packSales,
      deliveriesByZone: reports.deliveriesByZone,
      hourlyVolume: dashboard.hourlyVolume,
      recentReviews: dashboard.recentReviews,
      products,
      stores,
      analytics: {
        kpiSummary: dashboard.kpiSummary,
        monthlyRevenueFromOrders: reports.monthlyRevenueFromOrders,
        cancellationRatePct: reports.cancellationRatePct,
      },
      map,
    };
  },
});
