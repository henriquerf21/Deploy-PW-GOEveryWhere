import { reactive, computed } from 'vue';
import {
  ORDER_STATUS,
  COURIER_STATE,
  orderStatusLabels,
} from '../constants/logistics.js';
import {
  boBootstrap,
  boGetOrder,
  boOrderAction,
  boCreateCourier,
  boUpdateCourier,
  boCourierAction,
  boCreateCustomer,
  boUpdateCustomer,
  boDeleteCustomer,
  boStores,
  boCreateStore,
  boUpdateStore,
  boDeleteStore,
  boStoreInventory,
  boUpsertStoreInventory,
  boDeleteStoreInventory,
  boProducts,
  boUpsertProduct,
  boDeleteProduct,
} from '../api/backofficeApi.js';

let _seq = 24090;

function uid(p) {
  return `${p}-${++_seq}`;
}

function ts(iso) {
  return new Date(iso).getTime();
}

export const logistics = reactive({
  initialized: false,
  loading: false,
  busyCount: 0,
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
  slaMetrics: null,
  stores: [],
  selectedStoreId: '',
  storeInventory: [],
});

function adjustBusy(delta) {
  logistics.busyCount = Math.max(0, (logistics.busyCount || 0) + delta);
}

async function withBusy(fn) {
  adjustBusy(1);
  try {
    return await fn();
  } finally {
    adjustBusy(-1);
  }
}

function applyBootstrap(data) {
  const storesFromApi = data.stores || data.continentStores || [];
  logistics.continentStores = storesFromApi.length ? storesFromApi : logistics.continentStores;
  logistics.orders = data.orders || [];
  logistics.couriers = data.couriers || [];
  logistics.customers = data.customers || [];
  logistics.emailLog = data.emailLog || [];
  logistics.activityLog = data.activityLog || [];
  logistics.adminAlerts = data.adminAlerts || [];
  logistics.packSales = data.packSales || [];
  logistics.deliveriesByZone = data.deliveriesByZone || [];
  logistics.hourlyVolume = data.hourlyVolume || [];
  logistics.recentReviews = data.recentReviews || [];
  logistics.products = data.products || logistics.products;
  logistics.slaMetrics = data.slaMetrics ?? logistics.slaMetrics;
  logistics.stores = storesFromApi;
  logistics.selectedStoreId = logistics.selectedStoreId || logistics.stores[0]?.id || '';
  logistics.storeInventory = Array.isArray(data.storeInventory) ? data.storeInventory : logistics.storeInventory;
  logistics.initialized = true;
}

export async function initLogistics({ force = false } = {}) {
  if (logistics.loading) return { ok: true };
  if (logistics.initialized && !force) return { ok: true };
  logistics.loading = true;
  adjustBusy(1);
  try {
    const data = await boBootstrap();
    applyBootstrap(data);
    return { ok: true };
  } catch (err) {
    logistics.continentStores = [];
    logistics.orders = [];
    logistics.couriers = [];
    logistics.customers = [];
    logistics.emailLog = [];
    logistics.activityLog = [];
    logistics.adminAlerts = [];
    logistics.packSales = [];
    logistics.deliveriesByZone = [];
    logistics.hourlyVolume = [];
    logistics.recentReviews = [];
    logistics.products = [];
    logistics.slaMetrics = null;
    logistics.stores = [];
    logistics.selectedStoreId = '';
    logistics.storeInventory = [];
    return { ok: false, error: err?.message || 'Falha ao carregar dados do Strapi.' };
  } finally {
    logistics.loading = false;
    adjustBusy(-1);
  }
}

export async function refreshOrderFromServer(orderId) {
  return withBusy(async () => {
    const order = await boGetOrder(orderId);
    upsertOrder(order);
    return order;
  });
}


export function setSelectedStore(storeId) {
  logistics.selectedStoreId = storeId || '';
}

export async function refreshStores() {
  return withBusy(async () => {
    const rows = await boStores();
    logistics.stores = Array.isArray(rows) ? rows : [];
    logistics.continentStores = logistics.stores;
    if (!logistics.selectedStoreId || !logistics.stores.some((s) => s.id === logistics.selectedStoreId)) {
      logistics.selectedStoreId = logistics.stores[0]?.id || '';
    }
    return logistics.stores;
  });
}

export async function createStore(payload) {
  return withBusy(async () => {
    const created = await boCreateStore(payload);
    const idx = logistics.stores.findIndex((s) => s.id === created.id);
    if (idx >= 0) logistics.stores[idx] = created;
    else logistics.stores.push(created);
    logistics.stores.sort((a, b) => `${a.district} ${a.city} ${a.name}`.localeCompare(`${b.district} ${b.city} ${b.name}`));
    logistics.continentStores = logistics.stores;
    logistics.selectedStoreId = created.id;
    logAct(`Loja ${created.name} criada.`);
    return created;
  });
}

export async function updateStore(storeId, payload) {
  return withBusy(async () => {
    const updated = await boUpdateStore(storeId, payload);
    const idx = logistics.stores.findIndex((s) => s.id === storeId || s.id === updated.id);
    if (idx >= 0) logistics.stores[idx] = updated;
    else logistics.stores.push(updated);
    logistics.continentStores = logistics.stores;
    logAct(`Loja ${updated.name} atualizada.`);
    return updated;
  });
}

export async function deleteStore(storeId) {
  return withBusy(async () => {
    await boDeleteStore(storeId);
    const idx = logistics.stores.findIndex((s) => s.id === storeId);
    if (idx >= 0) logistics.stores.splice(idx, 1);
    logistics.continentStores = logistics.stores;
    if (logistics.selectedStoreId === storeId) {
      logistics.selectedStoreId = logistics.stores[0]?.id || '';
      logistics.storeInventory = [];
    }
    logAct(`Loja ${storeId} removida.`);
    return true;
  });
}

export async function refreshStoreInventory(storeId, filters = {}) {
  if (!storeId) {
    logistics.storeInventory = [];
    return [];
  }
  return withBusy(async () => {
    const rows = await boStoreInventory(storeId, filters);
    logistics.storeInventory = Array.isArray(rows) ? rows : [];
    return logistics.storeInventory;
  });
}

export async function upsertStoreInventoryItem(storeId, payload) {
  return withBusy(async () => {
    const saved = await boUpsertStoreInventory(storeId, payload);
    const idx = logistics.storeInventory.findIndex((i) => i.id === saved.id || i.sku === saved.sku);
    if (idx >= 0) logistics.storeInventory[idx] = saved;
    else logistics.storeInventory.push(saved);
    logistics.storeInventory.sort((a, b) => `${a.category} ${a.name}`.localeCompare(`${b.category} ${b.name}`));
    logAct(`Stock ${saved.sku} atualizado em ${storeId}.`);
    return saved;
  });
}

export async function deleteStoreInventoryItem(storeId, itemId) {
  return withBusy(async () => {
    await boDeleteStoreInventory(storeId, itemId);
    const idx = logistics.storeInventory.findIndex((i) => i.id === itemId);
    if (idx >= 0) logistics.storeInventory.splice(idx, 1);
    logAct(`Item ${itemId} removido do stock da loja ${storeId}.`);
    return true;
  });
}

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

function upsertOrder(order) {
  const idx = logistics.orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) logistics.orders[idx] = { ...logistics.orders[idx], ...order };
  else logistics.orders.unshift(order);
}

function upsertCourier(courier) {
  const idx = logistics.couriers.findIndex((c) => c.id === courier.id);
  if (idx >= 0) logistics.couriers[idx] = { ...logistics.couriers[idx], ...courier };
  else logistics.couriers.unshift(courier);
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

export async function addCustomer(payload) {
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  if (!name || !email) return { ok: false, error: 'Nome e email obrigatórios.' };
  try {
    const created = await withBusy(() => boCreateCustomer(payload));
    if (!created) return { ok: false, error: 'Falha ao criar cliente.' };
    logistics.customers.unshift(created);
    logAct(`Cliente ${created.name || name} criado no painel.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao criar cliente.' };
  }
}

export async function updateCustomer(id, patch) {
  const c = getCustomerById(id);
  if (!c) return { ok: false, error: 'Cliente não encontrado.' };
  try {
    const updated = await withBusy(() => boUpdateCustomer(id, patch));
    if (!updated) return { ok: false, error: 'Falha ao atualizar cliente.' };
    Object.assign(c, updated);
    logAct(`Cliente ${c.name} atualizado.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao atualizar cliente.' };
  }
}

export async function deleteCustomer(id) {
  const i = logistics.customers.findIndex((c) => c.id === id);
  if (i < 0) return { ok: false, error: 'Cliente não encontrado.' };
  try {
    await withBusy(() => boDeleteCustomer(id));
    const name = logistics.customers[i].name;
    logistics.customers.splice(i, 1);
    logAct(`Cliente ${name} eliminado.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao eliminar cliente.' };
  }
}

/** RF16 */
export async function approveOrder(orderId, { storeId, costEuro, etaMinutes, resources }) {
  try {
    const order = await withBusy(() =>
      boOrderAction(orderId, 'approve', { storeId, costEuro, etaMinutes, resources })
    );
    upsertOrder(order);
    logAct(`Pedido ${orderId} aprovado (loja ${storeId}).`);
    syncOperationalAggregatesFromOrders();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao aprovar pedido.' };
  }
}

/** RF17 */
export async function rejectOrder(orderId, justification) {
  const j = (justification || '').trim();
  if (!j) return { ok: false, error: 'Justificação obrigatória.' };
  try {
    const order = await withBusy(() => boOrderAction(orderId, 'reject', { justification: j }));
    upsertOrder(order);
    sendClientEmail({
      to: order.clientEmail,
      subject: `Pedido ${order.id} — atualização`,
      body: `O teu pedido foi rejeitado.\n\nMotivo: ${j}\n\nEquipa GoEverywhere`,
      orderId,
      kind: 'rejeição',
    });
    logAct(`Pedido ${orderId} rejeitado.`);
    syncOperationalAggregatesFromOrders();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao rejeitar pedido.' };
  }
}

/** RF18 */
export async function requestOrderInfo(orderId, message) {
  const m = (message || '').trim();
  if (!m) return { ok: false, error: 'Mensagem obrigatória.' };
  try {
    const order = await withBusy(() => boOrderAction(orderId, 'request-info', { message: m }));
    upsertOrder(order);
    sendClientEmail({
      to: order.clientEmail,
      subject: `Pedido ${order.id} — precisamos de mais informações`,
      body: `${m}\n\nResponde via app ou email.\nGoEverywhere`,
      orderId,
      kind: 'info_adicional',
    });
    logAct(`Pedido ${orderId}: pedido de informação ao cliente.`);
    syncOperationalAggregatesFromOrders();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao pedir informação.' };
  }
}

/** RF19 */
export async function assignCourierToOrder(orderId, courierId) {
  try {
    const order = await withBusy(() => boOrderAction(orderId, 'assign-courier', { courierId }));
    upsertOrder(order);
    logAct(`Pedido ${orderId} atribuído a ${courierId}.`);
    syncOperationalAggregatesFromOrders();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao atribuir estafeta.' };
  }
}

/** RF20 */
export async function setOrderPriority(orderId, priority) {
  const p = Number(priority);
  if (p < 1 || p > 5) return { ok: false, error: 'Prioridade 1–5.' };
  try {
    const order = await withBusy(() => boOrderAction(orderId, 'priority', { priority: p }));
    upsertOrder(order);
    if (p === 5) pushUrgentAlert(`ALERTA: Pedido ${orderId} definido como prioridade 5 (Urgente).`);
    logAct(`Pedido ${orderId}: prioridade ${p}.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao alterar prioridade.' };
  }
}

export async function startTransit(orderId) {
  try {
    const order = await withBusy(() => boOrderAction(orderId, 'start-transit'));
    upsertOrder(order);
    logAct(`Pedido ${orderId} em trânsito.`);
    syncOperationalAggregatesFromOrders();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao iniciar trânsito.' };
  }
}

export async function completeDelivery(orderId) {
  try {
    const order = await withBusy(() => boOrderAction(orderId, 'complete'));
    upsertOrder(order);
    logAct(`Pedido ${orderId} entregue.`);
    refreshAggregatesForCustomerId(order.clientId);
    syncOperationalAggregatesFromOrders();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao concluir entrega.' };
  }
}

export async function refreshProducts() {
  return withBusy(async () => {
    const rows = await boProducts();
    logistics.products = Array.isArray(rows) ? rows : [];
    return logistics.products;
  });
}

export async function addProduct(payload) {
  return withBusy(async () => {
    const saved = await boUpsertProduct(payload);
    const idx = logistics.products.findIndex((p) => p.id === saved.id || p.sku === saved.sku);
    if (idx >= 0) logistics.products[idx] = saved;
    else logistics.products.push(saved);
    logistics.products.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    logAct(`Produto ${saved.sku} guardado no Strapi.`);
    return { ok: true, data: saved };
  });
}

export async function updateProduct(sku, patch) {
  return addProduct({ ...patch, sku });
}

export async function deleteProduct(idOrSku) {
  return withBusy(async () => {
    await boDeleteProduct(idOrSku);
    const key = String(idOrSku || '').trim();
    const idx = logistics.products.findIndex((p) => p.id === key || p.sku === key);
    if (idx >= 0) logistics.products.splice(idx, 1);
    logAct(`Produto ${key} removido do Strapi.`);
    return { ok: true };
  });
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
export async function registerCourier(payload) {
  const c = await withBusy(() => boCreateCourier(payload));
  upsertCourier(c);
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
const COURIER_DOC_KEYS = [
  'docLicenseUrl',
  'docInsuranceUrl',
  'docInspectionUrl',
  'docCcUrl',
  'docSelfieUrl',
  'docIbanUrl',
];

function isDocOnlyPatch(patch) {
  const keys = Object.keys(patch || {});
  if (!keys.length) return false;
  return keys.every((k) => COURIER_DOC_KEYS.includes(k));
}

export async function updateCourierVerified(courierId, patch) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false, error: 'Não encontrado.' };
  // Permite uploads/atualizações de documentos em qualquer estado (incluindo E-01) para
  // que o admin possa anexar ou substituir documentação antes de verificar o estafeta.
  if (!isDocOnlyPatch(patch) && !canEditCourier(c)) {
    return { ok: false, error: 'Edição apenas após verificação (E-02+) ou estados operacionais.' };
  }
  try {
    const updated = await withBusy(() => boUpdateCourier(courierId, patch));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao atualizar estafeta.' };
  }
  logAct(`Estafeta ${c.name} atualizado.`);
  return { ok: true };
}

/** RF23 */
export async function verifyCourier(courierId) {
  const c = getCourierById(courierId);
  if (!c || c.state !== COURIER_STATE.E01) return { ok: false };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'verify' }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao verificar estafeta.' };
  }
  logAct(`Estafeta ${c.name} verificado (E-02). Pode ficar online para receber pedidos.`);
  return { ok: true };
}

export async function rejectCourier(courierId, reason) {
  const r = (reason || '').trim();
  if (!r) return { ok: false, error: 'Motivo obrigatório.' };
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'reject', reason: r }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao rejeitar estafeta.' };
  }
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

export async function requestCourierInfo(courierId, message) {
  const m = (message || '').trim();
  if (!m) return { ok: false, error: 'Mensagem obrigatória.' };
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  try {
    await withBusy(() => boCourierAction(courierId, { action: 'request_info', message: m }));
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao pedir informação.' };
  }
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

export async function suspendCourier(courierId) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'suspend' }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao suspender estafeta.' };
  }
  logAct(`Estafeta ${c.name} suspenso.`);
  return { ok: true };
}

export async function reactivateCourier(courierId) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'reactivate' }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao reativar estafeta.' };
  }
  logAct(`Estafeta ${c.name} reativado.`);
  return { ok: true };
}

/** RF24 — E-02/E-05 offline, E-06 online disponível */
export async function setCourierOnline(courierId, online) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false, error: 'Não encontrado.' };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'toggle_online', online: !!online }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao alterar estado online.' };
  }
  logAct(`Estafeta ${c.name}: ${online ? 'Online (E-06)' : 'Offline (E-05)'}.`);
  return { ok: true };
}

export async function setCourierMaxConcurrent(courierId, n) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'set_max', maxConcurrent: n }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao atualizar limite simultâneo.' };
  }
  return { ok: true };
}

export async function setCourierAdminNotes(courierId, notes) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false, error: 'Não encontrado' };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'save_notes', notes: String(notes || '').trim() }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao guardar notas.' };
  }
  logAct(`Notas internas atualizadas — ${c.name}.`);
  return { ok: true };
}

export async function clearCourierDataRequest(courierId) {
  const c = getCourierById(courierId);
  if (!c) return { ok: false };
  try {
    const updated = await withBusy(() => boCourierAction(courierId, { action: 'clear_data_request' }));
    upsertCourier(updated);
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao marcar pedido de alteração como tratado.' };
  }
  logAct(`Pedido de alteração de dados de ${c.name} marcado como tratado.`);
  return { ok: true };
}

/** Filtros RF15 — inclui filtro por urgência */
export function filterOrders({ status, priority, dateFrom, dateTo, type, zone, q, urgent }) {
  return logistics.orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (priority && String(o.priority) !== String(priority)) return false;
    if (type && o.type !== type) return false;
    if (zone && o.zone !== zone) return false;
    if (urgent === 'urgent' && !o.is_urgent) return false;
    if (urgent === 'normal' && o.is_urgent) return false;
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

void initLogistics();
