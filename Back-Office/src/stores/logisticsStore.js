import { reactive, computed } from 'vue';
import {
  ORDER_STATUS,
  COURIER_STATE,
  orderStatusLabels,
} from '../constants/logistics.js';

let _seq = 24090;

function uid(p) {
  return `${p}-${++_seq}`;
}

function ts(iso) {
  return new Date(iso).getTime();
}

export const logistics = reactive({
  continentStores: [
    { id: 'CT-GAIA', name: 'Continente Gaia', lat: 41.1235, lng: -8.612 },
    { id: 'CT-MAT', name: 'Continente Matosinhos', lat: 41.185, lng: -8.69 },
    { id: 'CT-POR', name: 'Continente Boavista', lat: 41.162, lng: -8.645 },
  ],
  orders: [],
  couriers: [],
  customers: [],
  emailLog: [],
  activityLog: [],
  adminAlerts: [],
  /** RF30 — packs mais vendidos (agregado demo) */
  packSales: [],
  /** RF30 / RF29 — volumes por zona */
  deliveriesByZone: [],
  hourlyVolume: [],
  recentReviews: [],
  /** Catálogo back-office (demo) */
  products: [],
});

function logAct(text) {
  logistics.activityLog.unshift({ id: uid('act'), at: new Date().toISOString(), text });
  if (logistics.activityLog.length > 100) logistics.activityLog.length = 100;
}

function sendClientEmail({ to, subject, body, orderId, kind }) {
  logistics.emailLog.unshift({
    id: uid('em'),
    at: new Date().toISOString(),
    to,
    subject,
    body,
    orderId,
    kind,
  });
  logAct(`Email (${kind}) → ${to}: ${subject}`);
}

export function dismissAdminAlert(id) {
  const i = logistics.adminAlerts.findIndex((a) => a.id === id);
  if (i >= 0) logistics.adminAlerts.splice(i, 1);
}

function pushUrgentAlert(msg) {
  logistics.adminAlerts.unshift({
    id: uid('al'),
    at: new Date().toISOString(),
    level: 'urgent',
    message: msg,
  });
}

function seed() {
  logistics.customers = [
    {
      id: 'CU-1',
      name: 'Maria Silva',
      email: 'maria.s@mail.pt',
      phone: '+351 912 000 001',
      nif: '245789123',
      city: 'Porto',
      zone: 'Porto Centro',
      ordersCount: 12,
      totalSpent: 428.5,
      lastOrderAt: '2026-03-30T12:00:00Z',
      avgRating: 4.8,
      marketingOptIn: true,
      notes: 'Prefere entregas antes das 18h.',
    },
    {
      id: 'CU-2',
      name: 'João Costa',
      email: 'jcosta@mail.pt',
      phone: '+351 934 000 002',
      nif: '201998877',
      city: 'Matosinhos',
      zone: 'Matosinhos',
      ordersCount: 4,
      totalSpent: 119.2,
      lastOrderAt: '2026-03-28T09:00:00Z',
      avgRating: 4.2,
      marketingOptIn: false,
      notes: '',
    },
    {
      id: 'CU-3',
      name: 'Ana Ribeiro',
      email: 'ana.r@mail.pt',
      phone: '+351 965 000 003',
      nif: '288112233',
      city: 'Gaia',
      zone: 'Vila Nova de Gaia',
      ordersCount: 21,
      totalSpent: 902.0,
      lastOrderAt: '2026-03-29T16:00:00Z',
      avgRating: 4.9,
      marketingOptIn: true,
      notes: 'Cliente B2B ocasional — contactar para volumes.',
    },
  ];

  logistics.couriers = [
    {
      id: 'ST-1',
      name: 'Miguel Santos',
      email: 'm.santos@mail.pt',
      phone: '+351 910 100 201',
      nif: '298765432',
      cc: '14895632 4 ZY',
      birthDate: '1992-05-14',
      address: 'Rua da Alegria 12, Porto',
      iban: 'PT50 0002 0123 12345678901 45',
      adminNotes: 'Experiente; apto para pedidos urgentes.',
      state: COURIER_STATE.E06,
      online: true,
      maxConcurrent: 3,
      zones: ['Porto Centro', 'Vila Nova de Gaia'],
      vehicle: {
        type: 'Mota',
        brand: 'Honda',
        model: 'PCX 125',
        color: 'Cinzento',
        plate: 'AB-12-CD',
        licenseNumber: 'T-998877',
        insuranceRef: 'SEG-2026-8844',
        inspectionValidUntil: '2027-01-15',
      },
      docs: { idDoc: true, license: true, insurance: true, inspection: true },
      lat: 41.149,
      lng: -8.615,
      stats: { deliveries: 420, rating: 4.7, onTimePct: 94 },
      currentOrderId: 'GE-24100',
      etaMinutes: 12,
    },
    {
      id: 'ST-2',
      name: 'Sofia Ferreira',
      email: 'sofi.f@mail.pt',
      phone: '+351 922 200 302',
      nif: '201112233',
      cc: '12004455 6 ZZ',
      birthDate: '1995-11-02',
      address: 'Av. Brasil 44, Matosinhos',
      iban: 'PT50 0033 0444 55667788990 12',
      adminNotes: '',
      state: COURIER_STATE.E06,
      online: true,
      maxConcurrent: 2,
      zones: ['Matosinhos'],
      vehicle: {
        type: 'Carro',
        brand: 'Renault',
        model: 'Clio',
        color: 'Branco',
        plate: 'EF-34-GH',
        licenseNumber: 'T-112233',
        insuranceRef: 'SEG-2026-2211',
        inspectionValidUntil: '2026-09-01',
      },
      docs: { idDoc: true, license: true, insurance: true, inspection: true },
      lat: 41.178,
      lng: -8.682,
      stats: { deliveries: 198, rating: 4.9, onTimePct: 97 },
      currentOrderId: null,
      etaMinutes: null,
    },
    {
      id: 'ST-3',
      name: 'Ricardo Pinto',
      email: 'rpinto@mail.pt',
      phone: '+351 933 300 403',
      nif: '276543210',
      cc: '13998877 1 XX',
      birthDate: '1988-03-20',
      address: 'Rua Heroísmo 90, Gaia',
      iban: 'PT50 0011 0222 33445566778 90',
      adminNotes: 'Aguardar documentação de seguro e carta.',
      state: COURIER_STATE.E01,
      online: false,
      maxConcurrent: 2,
      zones: ['Vila Nova de Gaia'],
      vehicle: {
        type: 'Mota',
        brand: 'Yamaha',
        model: 'NMAX',
        color: 'Azul',
        plate: 'IJ-56-KL',
        licenseNumber: '',
        insuranceRef: '',
        inspectionValidUntil: '',
      },
      docs: { idDoc: true, license: false, insurance: false, inspection: false },
      lat: 41.13,
      lng: -8.62,
      stats: { deliveries: 0, rating: 0, onTimePct: 0 },
      currentOrderId: null,
      etaMinutes: null,
    },
  ];

  logistics.orders = [
    {
      id: 'GE-24098',
      clientId: 'CU-1',
      clientName: 'Maria Silva',
      clientEmail: 'maria.s@mail.pt',
      city: 'Porto',
      zone: 'Porto Centro',
      type: 'STANDARD',
      priority: 2,
      status: ORDER_STATUS.PENDING,
      createdAt: '2026-03-30T08:30:00Z',
      pickupLat: 41.1235,
      pickupLng: -8.612,
      destLat: 41.155,
      destLng: -8.62,
      storeId: null,
      costEuro: null,
      etaMinutes: null,
      resources: null,
      courierId: null,
      rejectionReason: null,
      infoRequestMessage: null,
    },
    {
      id: 'GE-24099',
      clientId: 'CU-2',
      clientName: 'João Costa',
      clientEmail: 'jcosta@mail.pt',
      city: 'Matosinhos',
      zone: 'Matosinhos',
      type: 'EXPRESS',
      priority: 5,
      status: ORDER_STATUS.PENDING,
      createdAt: '2026-03-30T09:15:00Z',
      pickupLat: 41.185,
      pickupLng: -8.69,
      destLat: 41.19,
      destLng: -8.705,
      storeId: null,
      costEuro: null,
      etaMinutes: null,
      resources: null,
      courierId: null,
      rejectionReason: null,
      infoRequestMessage: null,
    },
    {
      id: 'GE-24100',
      clientId: 'CU-3',
      clientName: 'Ana Ribeiro',
      clientEmail: 'ana.r@mail.pt',
      city: 'Gaia',
      zone: 'Vila Nova de Gaia',
      type: 'STANDARD',
      priority: 3,
      status: ORDER_STATUS.IN_TRANSIT,
      createdAt: '2026-03-30T07:00:00Z',
      pickupLat: 41.1235,
      pickupLng: -8.612,
      destLat: 41.128,
      destLng: -8.605,
      storeId: 'CT-GAIA',
      costEuro: 6.5,
      etaMinutes: 35,
      resources: 'Mota térmica, caixa isotérmica S',
      courierId: 'ST-1',
      rejectionReason: null,
      infoRequestMessage: null,
    },
    {
      id: 'GE-24097',
      clientId: 'CU-1',
      clientName: 'Maria Silva',
      clientEmail: 'maria.s@mail.pt',
      city: 'Porto',
      zone: 'Porto Centro',
      type: 'SCHEDULED',
      priority: 1,
      status: ORDER_STATUS.INFO_REQUESTED,
      createdAt: '2026-03-29T18:00:00Z',
      pickupLat: 41.162,
      pickupLng: -8.645,
      destLat: 41.15,
      destLng: -8.63,
      storeId: null,
      costEuro: null,
      etaMinutes: null,
      resources: null,
      courierId: null,
      rejectionReason: null,
      infoRequestMessage: 'Indique janela horária exata para entrega.',
    },
    {
      id: 'GE-24096',
      clientId: 'CU-2',
      clientName: 'João Costa',
      clientEmail: 'jcosta@mail.pt',
      city: 'Maia',
      zone: 'Maia',
      type: 'B2B',
      priority: 4,
      status: ORDER_STATUS.REJECTED,
      createdAt: '2026-03-28T10:00:00Z',
      pickupLat: 41.162,
      pickupLng: -8.645,
      destLat: 41.25,
      destLng: -8.62,
      storeId: null,
      costEuro: null,
      etaMinutes: null,
      resources: null,
      courierId: null,
      rejectionReason: 'Zona fora da cobertura atual.',
      infoRequestMessage: null,
    },
    {
      id: 'GE-24101',
      clientId: 'CU-3',
      clientName: 'Ana Ribeiro',
      clientEmail: 'ana.r@mail.pt',
      city: 'Gaia',
      zone: 'Vila Nova de Gaia',
      type: 'STANDARD',
      priority: 3,
      status: ORDER_STATUS.ASSIGNED,
      createdAt: '2026-03-30T11:00:00Z',
      pickupLat: 41.1235,
      pickupLng: -8.612,
      destLat: 41.135,
      destLng: -8.608,
      storeId: 'CT-GAIA',
      costEuro: 5.9,
      etaMinutes: 40,
      resources: 'Mota',
      courierId: 'ST-2',
      rejectionReason: null,
      infoRequestMessage: null,
    },
  ];

  logistics.orders.forEach((o) => {
    if (o.priority === 5 && o.status === ORDER_STATUS.PENDING) {
      pushUrgentAlert(`Pedido ${o.id} com prioridade 5 (Urgente) — requer ação imediata.`);
    }
  });

  logistics.packSales = [
    { name: 'GoGummies Original 30u', sku: 'GG-ORG-30', units: 842 },
    { name: 'GoGummies Boost 30u', sku: 'GG-BST-30', units: 510 },
    { name: 'GoGummies Night 30u', sku: 'GG-NGT-30', units: 388 },
  ];

  logistics.deliveriesByZone = [];
  logistics.hourlyVolume = Array(24).fill(0);
  syncOperationalAggregatesFromOrders();

  logistics.recentReviews = [
    { client: 'Maria Silva', rating: 5, text: 'Entrega rápida e embalagem impecável.', at: '2026-03-30T10:00:00Z' },
    { client: 'João Costa', rating: 4, text: 'Bom serviço; estafeta educado.', at: '2026-03-29T18:20:00Z' },
    { client: 'Ana Ribeiro', rating: 5, text: 'GoGummies chegou fresquinho.', at: '2026-03-29T14:00:00Z' },
  ];

  logistics.products = [
    {
      name: 'GoGummies Original',
      sku: 'GG-ORG-30',
      brand: 'GoGummies',
      description: '30 gomas proteicas sabor frutos vermelhos; fórmula diária equilibrada.',
      ean: '5601234567891',
      stock: 1240,
      lowStockThreshold: 150,
      price: 14.99,
      active: true,
      category: 'Gomas',
      imageUrl: 'media/gogummies/product-detail.png',
    },
    {
      name: 'GoGummies Boost',
      sku: 'GG-BST-30',
      brand: 'GoGummies',
      description: 'Energia e foco — cafeína natural e vitaminas B.',
      ean: '5601234567892',
      stock: 560,
      lowStockThreshold: 120,
      price: 16.99,
      active: true,
      category: 'Gomas',
      imageUrl: 'media/gogummies/hero-gym.png',
    },
    {
      name: 'GoGummies Night',
      sku: 'GG-NGT-30',
      brand: 'GoGummies',
      description: 'Melatonina + magnésio para rotina de descanso.',
      ean: '5601234567893',
      stock: 0,
      lowStockThreshold: 80,
      price: 15.49,
      active: false,
      category: 'Gomas',
      imageUrl: 'media/gogummies/hero-jar.png',
    },
  ];

  logAct('Dados de demonstração carregados.');
}

/** Atualiza agregados demo (zonas, histograma horário) a partir dos pedidos — alinha dashboard/relatórios com a lista real. */
export function syncOperationalAggregatesFromOrders() {
  const zoneMap = {};
  for (const o of logistics.orders) {
    if (o.status === ORDER_STATUS.REJECTED) continue;
    zoneMap[o.zone] = (zoneMap[o.zone] || 0) + 1;
  }
  logistics.deliveriesByZone = Object.entries(zoneMap)
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count);
  const hours = Array(24).fill(0);
  for (const o of logistics.orders) {
    hours[new Date(o.createdAt).getHours()]++;
  }
  logistics.hourlyVolume = hours;
  return { ok: true };
}

export function getOrderById(id) {
  return logistics.orders.find((o) => o.id === id) || null;
}

export function getCourierById(id) {
  return logistics.couriers.find((c) => c.id === id) || null;
}

export function getStoreById(id) {
  return logistics.continentStores.find((s) => s.id === id) || null;
}

export function getCustomerById(id) {
  return logistics.customers.find((c) => c.id === id) || null;
}

function refreshAggregatesForCustomerId(clientId) {
  const c = logistics.customers.find((x) => x.id === clientId);
  if (!c) return;
  const list = logistics.orders.filter((o) => o.clientId === clientId);
  c.ordersCount = list.length;
  c.totalSpent = list
    .filter((o) => o.status === ORDER_STATUS.DELIVERED)
    .reduce((acc, o) => acc + (Number(o.costEuro) || 0), 0);
  if (list.length) {
    c.lastOrderAt = list.reduce(
      (best, o) => (ts(o.createdAt) > ts(best) ? o.createdAt : best),
      list[0].createdAt
    );
  }
}

/** RF31 — recalcula nº encomendas, gasto (só entregues) e última data a partir de `orders` */
export function refreshCustomerAggregatesFromOrders(options = {}) {
  const silent = !!options.silent;
  for (const c of logistics.customers) {
    refreshAggregatesForCustomerId(c.id);
  }
  if (!silent) logAct('Indicadores de clientes sincronizados com os pedidos.');
  return { ok: true };
}

export function addCustomer(payload) {
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  if (!name || !email) return { ok: false, error: 'Nome e email obrigatórios' };
  if (logistics.customers.some((c) => c.email.toLowerCase() === email)) {
    return { ok: false, error: 'Email já registado' };
  }
  const id = uid('CU');
  logistics.customers.push({
    id,
    name,
    email,
    phone: (payload.phone || '').trim(),
    nif: (payload.nif || '').trim(),
    city: (payload.city || '').trim() || '—',
    zone: (payload.zone || '').trim() || 'Outro',
    ordersCount: 0,
    totalSpent: 0,
    lastOrderAt: new Date().toISOString(),
    avgRating: Math.min(5, Math.max(0, Number(payload.avgRating) || 0)),
    marketingOptIn: !!payload.marketingOptIn,
    notes: (payload.notes || '').trim(),
  });
  logAct(`Cliente ${name} criado no painel.`);
  return { ok: true };
}

export function updateCustomer(id, patch) {
  const c = getCustomerById(id);
  if (!c) return { ok: false, error: 'Cliente não encontrado' };
  if (patch.email != null) {
    const newEmail = String(patch.email).trim().toLowerCase();
    if (logistics.customers.some((x) => x.id !== id && x.email.toLowerCase() === newEmail)) {
      return { ok: false, error: 'Email já usado por outro cliente' };
    }
    c.email = newEmail;
  }
  if (patch.name != null) c.name = String(patch.name).trim() || c.name;
  if (patch.phone != null) c.phone = String(patch.phone).trim();
  if (patch.city != null) c.city = String(patch.city).trim() || c.city;
  if (patch.zone != null) c.zone = String(patch.zone).trim() || c.zone;
  if (patch.avgRating != null) c.avgRating = Math.min(5, Math.max(0, Number(patch.avgRating) || 0));
  if (patch.nif != null) c.nif = String(patch.nif).trim();
  if (patch.marketingOptIn != null) c.marketingOptIn = !!patch.marketingOptIn;
  if (patch.notes != null) c.notes = String(patch.notes).trim();
  logAct(`Cliente ${c.name} atualizado.`);
  return { ok: true };
}

export function deleteCustomer(id) {
  if (logistics.orders.some((o) => o.clientId === id)) {
    return { ok: false, error: 'Existem pedidos associados — não é possível eliminar.' };
  }
  const i = logistics.customers.findIndex((c) => c.id === id);
  if (i < 0) return { ok: false, error: 'Cliente não encontrado' };
  const name = logistics.customers[i].name;
  logistics.customers.splice(i, 1);
  logAct(`Cliente ${name} eliminado.`);
  return { ok: true };
}

/** RF16 */
export function approveOrder(orderId, { storeId, costEuro, etaMinutes, resources }) {
  const o = getOrderById(orderId);
  if (!o) return { ok: false, error: 'Pedido não encontrado' };
  if (o.status !== ORDER_STATUS.PENDING && o.status !== ORDER_STATUS.INFO_REQUESTED) {
    return { ok: false, error: 'Estado não permite aprovação' };
  }
  o.storeId = storeId;
  const st = getStoreById(storeId);
  if (st) {
    o.pickupLat = st.lat;
    o.pickupLng = st.lng;
  }
  o.costEuro = Number(costEuro);
  o.etaMinutes = Number(etaMinutes);
  o.resources = resources;
  o.status = ORDER_STATUS.APPROVED;
  logAct(`Pedido ${orderId} aprovado (loja ${storeId}).`);
  syncOperationalAggregatesFromOrders();
  return { ok: true };
}

/** RF17 */
export function rejectOrder(orderId, justification) {
  const j = (justification || '').trim();
  if (!j) return { ok: false, error: 'Justificação obrigatória' };
  const o = getOrderById(orderId);
  if (!o) return { ok: false, error: 'Pedido não encontrado' };
  o.status = ORDER_STATUS.REJECTED;
  o.rejectionReason = j;
  o.courierId = null;
  sendClientEmail({
    to: o.clientEmail,
    subject: `Pedido ${o.id} — atualização`,
    body: `O teu pedido foi rejeitado.\n\nMotivo: ${j}\n\nEquipa GoEverywhere`,
    orderId,
    kind: 'rejeição',
  });
  logAct(`Pedido ${orderId} rejeitado.`);
  syncOperationalAggregatesFromOrders();
  return { ok: true };
}

/** RF18 */
export function requestOrderInfo(orderId, message) {
  const m = (message || '').trim();
  if (!m) return { ok: false, error: 'Mensagem obrigatória' };
  const o = getOrderById(orderId);
  if (!o) return { ok: false, error: 'Pedido não encontrado' };
  o.status = ORDER_STATUS.INFO_REQUESTED;
  o.infoRequestMessage = m;
  sendClientEmail({
    to: o.clientEmail,
    subject: `Pedido ${o.id} — precisamos de mais informações`,
    body: `${m}\n\nResponde via app ou email.\nGoEverywhere`,
    orderId,
    kind: 'info_adicional',
  });
  logAct(`Pedido ${orderId}: pedido de informação ao cliente.`);
  syncOperationalAggregatesFromOrders();
  return { ok: true };
}

/** RF19 */
export function assignCourierToOrder(orderId, courierId) {
  const o = getOrderById(orderId);
  const c = getCourierById(courierId);
  if (!o || !c) return { ok: false, error: 'Dados inválidos' };
  if (o.status !== ORDER_STATUS.APPROVED && o.status !== ORDER_STATUS.ASSIGNED) {
    return { ok: false, error: 'Aprove o pedido antes de atribuir estafeta' };
  }
  if (c.state !== COURIER_STATE.E06 || !c.online) {
    return { ok: false, error: 'Estafeta tem de estar Online (E-06) e disponível' };
  }
  if (!c.zones.includes(o.zone)) {
    return { ok: false, error: 'Estafeta não cobre a zona do pedido' };
  }
  const active = logistics.orders.filter(
    (x) => x.courierId === courierId && [ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT].includes(x.status)
  ).length;
  if (active >= c.maxConcurrent) {
    return { ok: false, error: 'Limite de entregas simultâneas atingido' };
  }
  if (o.courierId && o.courierId !== courierId) {
    const prev = getCourierById(o.courierId);
    if (prev && prev.currentOrderId === orderId) {
      prev.currentOrderId = null;
      prev.etaMinutes = null;
    }
  }
  o.courierId = courierId;
  o.status = ORDER_STATUS.ASSIGNED;
  c.currentOrderId = orderId;
  c.etaMinutes = o.etaMinutes;
  logAct(`Pedido ${orderId} atribuído a ${c.name}.`);
  syncOperationalAggregatesFromOrders();
  return { ok: true };
}

/** RF20 */
export function setOrderPriority(orderId, priority) {
  const p = Number(priority);
  if (p < 1 || p > 5) return { ok: false, error: 'Prioridade 1–5' };
  const o = getOrderById(orderId);
  if (!o) return { ok: false, error: 'Pedido não encontrado' };
  o.priority = p;
  if (p === 5) {
    pushUrgentAlert(`ALERTA: Pedido ${orderId} definido como prioridade 5 (Urgente).`);
  }
  logAct(`Pedido ${orderId}: prioridade ${p}.`);
  return { ok: true };
}

export function startTransit(orderId) {
  const o = getOrderById(orderId);
  if (!o || o.status !== ORDER_STATUS.ASSIGNED) return { ok: false };
  o.status = ORDER_STATUS.IN_TRANSIT;
  logAct(`Pedido ${orderId} em trânsito.`);
  syncOperationalAggregatesFromOrders();
  return { ok: true };
}

export function completeDelivery(orderId) {
  const o = getOrderById(orderId);
  if (!o || o.status !== ORDER_STATUS.IN_TRANSIT) {
    return { ok: false, error: 'Apenas pedidos em trânsito podem ser marcados como entregues.' };
  }
  o.status = ORDER_STATUS.DELIVERED;
  const c = o.courierId ? getCourierById(o.courierId) : null;
  if (c && c.currentOrderId === orderId) {
    c.currentOrderId = null;
    c.etaMinutes = null;
  }
  if (c && o.destLat != null && o.destLng != null) {
    c.lat = o.destLat;
    c.lng = o.destLng;
  }
  logAct(`Pedido ${orderId} entregue.`);
  refreshAggregatesForCustomerId(o.clientId);
  syncOperationalAggregatesFromOrders();
  return { ok: true };
}

export function addProduct({ name, sku, stock, price, category, imageUrl, brand, description, ean, lowStockThreshold }) {
  const s = (sku || '').trim();
  if (!s) return { ok: false, error: 'SKU obrigatório' };
  if (logistics.products.some((p) => p.sku === s)) return { ok: false, error: 'SKU já existe' };
  const st = Number(stock);
  const pr = Number(price);
  const img = imageUrl != null ? String(imageUrl).trim() : '';
  const lst = Number(lowStockThreshold);
  logistics.products.push({
    name: (name || '').trim() || 'Sem nome',
    sku: s,
    stock: Number.isFinite(st) ? Math.max(0, st) : 0,
    price: Number.isFinite(pr) ? Math.max(0, pr) : 0,
    active: true,
    category: (category || '').trim() || 'Geral',
    brand: (brand || '').trim() || 'GoGummies',
    description: (description || '').trim(),
    ean: (ean || '').trim(),
    lowStockThreshold: Number.isFinite(lst) && lst >= 0 ? lst : 0,
    ...(img ? { imageUrl: img } : {}),
  });
  logAct(`Produto ${s} adicionado.`);
  return { ok: true };
}

export function updateProduct(sku, patch) {
  const p = logistics.products.find((x) => x.sku === sku);
  if (!p) return { ok: false, error: 'Produto não encontrado' };
  if (patch.name != null) p.name = String(patch.name).trim() || p.name;
  if (patch.stock != null) {
    const n = Number(patch.stock);
    if (Number.isFinite(n)) p.stock = Math.max(0, n);
  }
  if (patch.price != null) {
    const n = Number(patch.price);
    if (Number.isFinite(n)) p.price = Math.max(0, n);
  }
  if (patch.active != null) p.active = !!patch.active;
  if (patch.category != null) p.category = String(patch.category).trim() || p.category;
  if (patch.imageUrl !== undefined) {
    const img = String(patch.imageUrl || '').trim();
    if (img) p.imageUrl = img;
    else delete p.imageUrl;
  }
  if (patch.brand != null) p.brand = String(patch.brand).trim() || p.brand;
  if (patch.description != null) p.description = String(patch.description).trim();
  if (patch.ean != null) p.ean = String(patch.ean).trim();
  if (patch.lowStockThreshold != null) {
    const lst = Number(patch.lowStockThreshold);
    if (Number.isFinite(lst) && lst >= 0) p.lowStockThreshold = lst;
  }
  logAct(`Produto ${sku} atualizado.`);
  return { ok: true };
}

export function deleteProduct(sku) {
  const s = (sku || '').trim();
  const i = logistics.products.findIndex((p) => p.sku === s);
  if (i < 0) return { ok: false, error: 'Produto não encontrado' };
  logistics.products.splice(i, 1);
  logAct(`Produto ${s} eliminado.`);
  return { ok: true };
}

export function availableCouriersForOrder(orderId) {
  const o = getOrderById(orderId);
  if (!o) return [];
  return logistics.couriers.filter((c) => {
    if (c.state !== COURIER_STATE.E06 || !c.online) return false;
    if (!c.zones.includes(o.zone)) return false;
    const active = logistics.orders.filter(
      (x) => x.courierId === c.id && [ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT].includes(x.status)
    ).length;
    return active < c.maxConcurrent;
  });
}

/** RF21 */
export function registerCourier(payload) {
  const c = {
    id: uid('ST'),
    name: payload.name,
    email: payload.email,
    phone: (payload.phone || '').trim(),
    nif: payload.nif || '',
    cc: payload.cc || '',
    birthDate: payload.birthDate || '',
    address: payload.address || '',
    iban: payload.iban || '',
    adminNotes: '',
    state: COURIER_STATE.E01,
    online: false,
    maxConcurrent: Math.max(1, Number(payload.maxConcurrent) || 2),
    zones: payload.zones || [],
    vehicle: {
      type: payload.vehicleType || '',
      brand: payload.brand || '',
      model: payload.model || '',
      color: (payload.vehicleColor || '').trim(),
      plate: payload.plate || '',
      licenseNumber: payload.licenseNumber || '',
      insuranceRef: payload.insuranceRef || '',
      inspectionValidUntil: payload.inspectionValidUntil || '',
    },
    docs: {
      idDoc: !!payload.docId,
      license: !!payload.docLicense,
      insurance: !!payload.docInsurance,
      inspection: !!payload.docInspection,
    },
    lat: 41.15 + (Math.random() - 0.5) * 0.04,
    lng: -8.63 + (Math.random() - 0.5) * 0.06,
    stats: { deliveries: 0, rating: 0, onTimePct: 0 },
    currentOrderId: null,
    etaMinutes: null,
  };
  logistics.couriers.push(c);
  logAct(`Novo estafeta ${c.name} — Pendente Verificação.`);
  return c;
}

function canEditCourier(c) {
  return [COURIER_STATE.E02, COURIER_STATE.E04, COURIER_STATE.E05, COURIER_STATE.E06].includes(c.state);
}

export function canEditCourierData(c) {
  return canEditCourier(c);
}

/** RF22 */
export function updateCourierVerified(courierId, patch) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false, error: 'Não encontrado' };
  if (!canEditCourier(c)) return { ok: false, error: 'Edição apenas após verificação (E-02+) ou estados operacionais' };
  Object.assign(c, {
    name: patch.name ?? c.name,
    email: patch.email ?? c.email,
    phone: patch.phone !== undefined ? String(patch.phone).trim() : c.phone,
    nif: patch.nif ?? c.nif,
    cc: patch.cc ?? c.cc,
    birthDate: patch.birthDate ?? c.birthDate,
    address: patch.address ?? c.address,
    iban: patch.iban ?? c.iban,
    adminNotes: patch.adminNotes !== undefined ? String(patch.adminNotes).trim() : c.adminNotes,
    maxConcurrent: patch.maxConcurrent != null ? Math.max(1, Number(patch.maxConcurrent)) : c.maxConcurrent,
    zones: patch.zones ?? c.zones,
  });
  if (patch.vehicle) Object.assign(c.vehicle, patch.vehicle);
  if (patch.docs) Object.assign(c.docs, patch.docs);
  logAct(`Estafeta ${c.name} atualizado.`);
  return { ok: true };
}

/** RF23 */
export function verifyCourier(courierId) {
  const c = getCourierById(courierId);
  if (!c || c.state !== COURIER_STATE.E01) return { ok: false };
  c.state = COURIER_STATE.E02;
  c.online = false;
  logAct(`Estafeta ${c.name} verificado (E-02). Pode ficar online para receber pedidos.`);
  return { ok: true };
}

export function rejectCourier(courierId, reason) {
  const r = (reason || '').trim();
  if (!r) return { ok: false, error: 'Motivo obrigatório' };
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  c.state = COURIER_STATE.E03;
  sendClientEmail({
    to: c.email,
    subject: 'Registo estafeta — documentos',
    body: `O teu registo foi rejeitado: ${r}`,
    orderId: null,
    kind: 'estafeta_rejeição',
  });
  logAct(`Estafeta ${c.name} rejeitado.`);
  return { ok: true };
}

export function requestCourierInfo(courierId, message) {
  const m = (message || '').trim();
  if (!m) return { ok: false, error: 'Mensagem obrigatória' };
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  sendClientEmail({
    to: c.email,
    subject: 'Informação em falta — registo estafeta',
    body: m,
    orderId: null,
    kind: 'estafeta_info',
  });
  logAct(`Pedido de info a ${c.name}.`);
  return { ok: true };
}

export function suspendCourier(courierId) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  c.state = COURIER_STATE.E04;
  c.online = false;
  logAct(`Estafeta ${c.name} suspenso.`);
  return { ok: true };
}

export function reactivateCourier(courierId) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  if (c.state === COURIER_STATE.E03) c.state = COURIER_STATE.E01;
  else if (c.state === COURIER_STATE.E04) {
    c.state = COURIER_STATE.E05;
    c.online = false;
  }
  logAct(`Estafeta ${c.name} reativado.`);
  return { ok: true };
}

/** RF24 — E-02/E-05 offline, E-06 online disponível */
export function setCourierOnline(courierId, online) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false, error: 'Não encontrado' };
  if (online) {
    if ([COURIER_STATE.E01, COURIER_STATE.E03, COURIER_STATE.E04].includes(c.state)) {
      return { ok: false, error: 'Estado não permite ficar online' };
    }
    if (![COURIER_STATE.E02, COURIER_STATE.E05, COURIER_STATE.E06].includes(c.state)) {
      return { ok: false, error: 'Estado inválido' };
    }
    c.online = true;
    c.state = COURIER_STATE.E06;
  } else {
    c.online = false;
    if (c.state === COURIER_STATE.E06) c.state = COURIER_STATE.E05;
  }
  logAct(`Estafeta ${c.name}: ${online ? 'Online (E-06)' : 'Offline (E-05)'}.`);
  return { ok: true };
}

export function setCourierMaxConcurrent(courierId, n) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  c.maxConcurrent = Math.max(1, Math.min(10, Number(n) || 1));
  return { ok: true };
}

export function setCourierAdminNotes(courierId, notes) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false, error: 'Não encontrado' };
  c.adminNotes = String(notes || '').trim();
  logAct(`Notas internas atualizadas — ${c.name}.`);
  return { ok: true };
}

/** Filtros RF15 */
export function filterOrders({ status, priority, dateFrom, dateTo, type, zone, q }) {
  return logistics.orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (priority && String(o.priority) !== String(priority)) return false;
    if (type && o.type !== type) return false;
    if (zone && o.zone !== zone) return false;
    if (dateFrom && ts(o.createdAt) < ts(`${dateFrom}T00:00:00.000Z`)) return false;
    if (dateTo) {
      const end = ts(`${dateTo}T23:59:59.999Z`);
      if (ts(o.createdAt) > end) return false;
    }
    if (q) {
      const s = q.toLowerCase();
      if (
        !o.id.toLowerCase().includes(s) &&
        !o.clientName.toLowerCase().includes(s) &&
        !o.clientEmail.toLowerCase().includes(s)
      ) {
        return false;
      }
    }
    return true;
  });
}

export const activeOrdersForMap = computed(() =>
  logistics.orders.filter((o) => [ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.APPROVED].includes(o.status))
);

export const kpiSummary = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = logistics.orders.filter((o) => o.createdAt.startsWith(today)).length;
  const active = logistics.orders.filter((o) =>
    [ORDER_STATUS.PENDING, ORDER_STATUS.APPROVED, ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.INFO_REQUESTED].includes(
      o.status
    )
  ).length;
  const online = logistics.couriers.filter((c) => c.state === COURIER_STATE.E06 && c.online).length;
  const pipelineStatuses = [ORDER_STATUS.APPROVED, ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT];
  const revenuePipeline = logistics.orders
    .filter((o) => pipelineStatuses.includes(o.status))
    .reduce((a, o) => a + (Number(o.costEuro) || 0), 0);
  const revenueDelivered = logistics.orders
    .filter((o) => o.status === ORDER_STATUS.DELIVERED)
    .reduce((a, o) => a + (Number(o.costEuro) || 0), 0);
  const productsActive = logistics.products.filter((p) => p.active).length;
  const lowStockCount = logistics.products.filter((p) => {
    if (!p.active) return false;
    const th = Number(p.lowStockThreshold);
    if (!Number.isFinite(th) || th <= 0) return false;
    return Number(p.stock) <= th;
  }).length;
  const totalOrders = logistics.orders.length;
  const rejectedCount = logistics.orders.filter((o) => o.status === ORDER_STATUS.REJECTED).length;
  const rejectionRatePct = totalOrders > 0 ? Math.round((rejectedCount / totalOrders) * 1000) / 10 : 0;
  return {
    ordersToday,
    active,
    online,
    revenuePipeline,
    revenueDelivered,
    productsActive,
    totalProducts: logistics.products.length,
    lowStockCount,
    totalCustomers: logistics.customers.length,
    rejectedCount,
    rejectionRatePct,
  };
});

const PT_MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Últimos 6 meses: soma de custos (€) de pedidos entregues, por mês de criação do pedido → valores em k€. */
export function getMonthlyDeliveredKiloEuroSeries() {
  const now = new Date();
  const rows = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const key = `${y}-${String(mo).padStart(2, '0')}`;
    rows.push({
      key,
      month: `${PT_MONTHS_SHORT[mo - 1]} ’${String(y).slice(2)}`,
      euroSum: 0,
    });
  }
  const keyToIdx = new Map(rows.map((r, idx) => [r.key, idx]));
  for (const o of logistics.orders) {
    if (o.status !== ORDER_STATUS.DELIVERED) continue;
    const key = o.createdAt.slice(0, 7);
    const idx = keyToIdx.get(key);
    if (idx === undefined) continue;
    rows[idx].euroSum += Number(o.costEuro) || 0;
  }
  return rows.map(({ month, euroSum }) => ({
    month,
    k: Math.round((euroSum / 1000) * 10) / 10,
  }));
}

export const monthlyRevenueFromOrders = computed(() => getMonthlyDeliveredKiloEuroSeries());

/** Pedidos não rejeitados com loja atribuída, por ponto de recolha. */
export const pickupsByStore = computed(() => {
  const map = {};
  for (const o of logistics.orders) {
    if (o.status === ORDER_STATUS.REJECTED || !o.storeId) continue;
    map[o.storeId] = (map[o.storeId] || 0) + 1;
  }
  return Object.entries(map)
    .map(([storeId, count]) => ({
      storeId,
      name: getStoreById(storeId)?.name || storeId,
      count,
    }))
    .sort((a, b) => b.count - a.count);
});

export function cancellationRatePct() {
  const t = logistics.orders.length;
  if (!t) return 0;
  const c = logistics.orders.filter((o) => o.status === ORDER_STATUS.REJECTED).length;
  return Math.round((c / t) * 1000) / 10;
}

export function exportOrdersCsv() {
  const headers = ['id', 'status', 'cliente', 'email', 'zona', 'prioridade', 'tipo', 'custoEUR', 'criadoEm'];
  const lines = [headers.join(';')];
  for (const o of logistics.orders) {
    lines.push(
      [
        o.id,
        orderStatusLabels[o.status] || o.status,
        o.clientName,
        o.clientEmail,
        o.zone,
        o.priority,
        o.type,
        o.costEuro ?? '',
        o.createdAt,
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(';')
    );
  }
  return lines.join('\n');
}

export function exportFullReportCsv() {
  const pack = ['tipo', 'packs_mais_vendidos', ...logistics.packSales.map((p) => `${p.name}|${p.units}`)].join(';');
  const zones = ['tipo', 'top_zonas', ...logistics.deliveriesByZone.map((z) => `${z.zone}|${z.count}`)].join(';');
  const rev = ['tipo', 'custo_entregues_kEUR_6m', ...getMonthlyDeliveredKiloEuroSeries().map((m) => `${m.month}|${m.k}`)].join(';');
  return [exportOrdersCsv(), '', pack, zones, rev, '', `taxa_cancelamento_pct;${cancellationRatePct()}`].join('\n');
}

export { ORDER_STATUS, orderStatusLabels, ts };

seed();
refreshCustomerAggregatesFromOrders({ silent: true });
