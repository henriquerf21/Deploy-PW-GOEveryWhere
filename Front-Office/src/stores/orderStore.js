import { reactive, computed } from 'vue';
import authState, { fetchMe } from './authStore';
import { io } from 'socket.io-client';
import { API_URL, BACKEND_URL } from '../config/env.js';
import { mergeChatHistory, sortChatHistory } from '../utils/chatHistory.js';
import { readApiJson } from '../utils/apiResponse.js';

// Initialize socket connection
export const socket = io(BACKEND_URL, {
  autoConnect: true // Maintain global connection for real-time history & points
});

// ── DATA TABLES ──────────────────────────────────────────────────
export const CONTINENTE_STORES = [];

export const ORDER_STATES = {
  'S-01': { label: 'Submetido',                  color: '#6b7280', icon: '📩' },
  'S-02': { label: 'Em Análise',                 color: '#f59e0b', icon: '🔍' },
  'S-03': { label: 'Info Adicional Solicitada',  color: '#f97316', icon: '❓' },
  'S-04': { label: 'Rejeitado',                  color: '#ef4444', icon: '❌', terminal: true },
  'S-05': { label: 'Aprovado',                   color: '#3b82f6', icon: '✔️' },
  'S-06': { label: 'Aguarda nova atribuição',    color: '#3b82f6', icon: '🔄' },
  'S-07': { label: 'Estafeta Atribuído',         color: '#06b6d4', icon: '🧑‍🦺' },
  'S-08': { label: 'Em Recolha',                 color: '#0ea5e9', icon: '🏪' },
  'S-09': { label: 'Em Trânsito',                color: '#00c853', icon: '🚀' },
  'S-10': { label: 'No Destino',                 color: '#10b981', icon: '📍' },
  'S-11': { label: 'Entregue',                   color: '#059669', icon: '✅', terminal: true },
  'S-12': { label: 'Não Foi Possível Entregar',  color: '#dc2626', icon: '⚠️', terminal: true },
  'S-13': { label: 'Cancelado pelo Cliente',     color: '#ef4444', icon: '🚫', terminal: true },
  'S-14': { label: 'Cancelado pelo Admin',       color: '#ef4444', icon: '🚫', terminal: true },
  'S-15': { label: 'Concluído e Avaliado',       color: '#059669', icon: '⭐', terminal: true },
  'S-16': { label: 'Concluído Sem Avaliação',    color: '#6b7280', icon: '📋', terminal: true },
};

export const DELIVERY_ACCEPTED_STATUSES = ['E-09', 'E-10', 'E-11', 'E-12', 'E-13'];
/** E-08 = atribuído pelo BO; E-09+ = aceite na PWA */
export const DELIVERY_COURIER_VISIBLE_STATUSES = ['E-08', ...DELIVERY_ACCEPTED_STATUSES];

export function getCourierDisplayName(raw) {
  if (!raw) return '';
  const full = String(raw.fullName || '').trim();
  if (full) return full;
  const fn = String(raw.firstName || '').trim();
  const ln = String(raw.lastName || '').trim();
  return [fn, ln].filter(Boolean).join(' ');
}

/** Estafeta na encomenda ou na entrega (BO pode ligar só na delivery). */
export function resolveCourierFromOrder(orderLike) {
  if (!orderLike) return null;
  const fromOrder = normalizeStrapiEntity(orderLike.courier);
  if (fromOrder && (getCourierDisplayName(fromOrder) || fromOrder.phone || fromOrder.documentId || fromOrder.id)) {
    return fromOrder;
  }
  const delivery = normalizeStrapiEntity(orderLike.delivery);
  const fromDelivery = normalizeStrapiEntity(delivery?.courier);
  return fromDelivery || fromOrder || null;
}

export const PRODUCTS = reactive([
  { id: 'frasco-1', name: '1 Frasco', desc: '30 gomas proteicas', price: 14.99, gomas: 30 },
  { id: 'pack-2', name: 'Pack 2 Frascos', desc: 'Poupa 10% — 60 gomas', price: 26.99, gomas: 60, popular: true, discount: '-10%' },
  { id: 'pack-3', name: 'Pack 3 Frascos', desc: 'Poupa 15% — 90 gomas', price: 38.24, gomas: 90, discount: '-15%' },
]);

// ── STATE ────────────────────────────────────────────────────────
const store = reactive({
  cart: { items: { 'frasco-1': 0, 'pack-2': 0, 'pack-3': 0 }, urgentDelivery: false },
  delivery: {
    name: '', phone: '', nif: '', address: '', postalCode: '', city: '', floor: '',
    instructions: '', assignedStore: null, estimatedDistance: null,
  },
  payment: {
    method: 'mbway',
    mbwayPhone: '',
    cardName: '',
    cardNumber: '',
    useGoPoints: false,
    goPointsRedemption: null,
  },
  activeOrder: null,
  acknowledgedOrders: JSON.parse(localStorage.getItem('go_acknowledged_orders') || '[]'),
  orderHistory: [],
  loading: false
});

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProductFromStrapi(entry) {
  const raw = entry?.attributes || entry || {};
  const baseId = raw.sku || raw.code || raw.documentId || entry?.documentId || entry?.id || `prod-${Date.now()}`;
  return {
    id: String(baseId).toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    sku: String(raw.sku || raw.code || baseId || '').toUpperCase(),
    name: raw.name || 'Produto',
    desc: raw.desc || '',
    price: Math.max(0, toNum(raw.price, 0)),
    gomas: Math.max(0, toNum(raw.gomas, 0)),
    popular: !!raw.popular,
    discount: raw.discountLabel || raw.discount || '',
    imageUrl: raw.imageUrl || '',
    sortOrder: toNum(raw.sortOrder, 0),
  };
}

function syncCartItemsWithProducts() {
  const next = {};
  for (const p of PRODUCTS) {
    next[p.id] = Number(store.cart.items[p.id] || 0);
  }
  store.cart.items = next;
}

// ── COMPUTED ─────────────────────────────────────────────────────
export const cartItemCount = computed(() => Object.values(store.cart.items).reduce((sum, qty) => sum + qty, 0));
export const cartProducts = computed(() => PRODUCTS.filter(p => store.cart.items[p.id] > 0).map(p => ({ ...p, qty: store.cart.items[p.id], lineTotal: p.price * store.cart.items[p.id] })));
export const subtotal = computed(() => PRODUCTS.reduce((sum, p) => sum + (p.price * store.cart.items[p.id]), 0));
// RF06 — Custo de entrega dinâmico por escalão de distância
export const deliveryFee = computed(() => {
  const dist = store.delivery.estimatedDistance;
  if (dist == null) return 2.99;          // fallback antes de atribuir loja
  if (dist <= 3)  return 1.99;            // até 3 km
  if (dist <= 7)  return 2.99;            // 3–7 km
  if (dist <= 12) return 3.99;            // 7–12 km
  return 4.99;                            // > 12 km
});
export const urgentFee = computed(() => store.cart.urgentDelivery ? 1.50 : 0);
// RF06 — ETA dinâmico: base 15 min + ~2.5 min por km
export const estimatedETA = computed(() => {
  const dist = store.delivery.estimatedDistance;
  if (dist == null) return 30;            // fallback
  return Math.round(15 + dist * 2.5);
});

export const pointsToEarn = computed(() => Math.floor(subtotal.value * 10));
export const userPointsBalance = computed(() => authState.user?.go_point?.points || 0);
export const canRedeemDelivery = computed(() => userPointsBalance.value >= 500);
export const canRedeemProduct  = computed(() => userPointsBalance.value >= 1000);

export const goPointsDiscount = computed(() => {
  // 1000 pts agora equivalem a 10€ de desconto fixo
  if (store.payment.goPointsRedemption === 'product' && canRedeemProduct.value) {
    return Math.min(subtotal.value, 10.00);
  }
  
  if (store.payment.goPointsRedemption === 'delivery' && canRedeemDelivery.value) {
    return deliveryFee.value;
  }
  
  return 0;
});

export const orderTotal = computed(() => Math.max(0, subtotal.value + deliveryFee.value + urgentFee.value - goPointsDiscount.value));

// ── ACTIONS ──────────────────────────────────────────────────────
export function setCartQty(productId, qty) { store.cart.items[productId] = Math.max(0, qty); }
export function toggleUrgent() { store.cart.urgentDelivery = !store.cart.urgentDelivery; }
export function setDeliveryField(field, value) { store.delivery[field] = value; }
export function setPaymentMethod(method) { store.payment.method = method; }
export function setPaymentField(field, value) { store.payment[field] = value; }
export function toggleGoPoints() { store.payment.useGoPoints = !store.payment.useGoPoints; }
export function assignDefaultStore() { findNearestStore(41.5518, -8.4229); }

export function toggleGoPointsRedemption(type) {
  store.payment.goPointsRedemption = store.payment.goPointsRedemption === type ? null : type;
}

export function findNearestStore(lat, lng) {
  if (!CONTINENTE_STORES.length) return;
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const haversineKm = (aLat, aLng, bLat, bLng) => {
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const p =
      Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(p), Math.sqrt(1 - p));
  };
  let nearest = CONTINENTE_STORES[0];
  let minDist = Infinity;
  for (const s of CONTINENTE_STORES) {
    const dist = haversineKm(lat, lng, s.lat, s.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }
  store.delivery.assignedStore = nearest;
  store.delivery.gpsLat = lat; // Guardar para recalculcar se a lista de lojas mudar
  store.delivery.gpsLng = lng;
  store.delivery.estimatedDistance = Math.round(minDist * 10) / 10;
}

export function isCartValid() { return cartItemCount.value > 0; }
export function isDeliveryValid() {
  return !!(store.delivery.name?.trim().length >= 3 && store.delivery.address?.trim().length >= 5 && store.delivery.postalCode && store.delivery.city);
}

export async function rateOrder(orderId, rating) {
  const order = store.orderHistory.find(o => o.id === orderId);
  if (order) {
    // Atualização otimista local
    order.rating = rating;
    order.status = 'S-15';
    
    // Persistência na API (RF33)
    try {
      const docId = order.documentId || order.id;
      const response = await fetch(`${API_URL}/orders/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify({
          data: {
            rating: rating,
            order_status: 'S-15 Concluído e Avaliado'
          }
        })
      });
      if (!response.ok) {
        console.error('Falha ao guardar avaliação no Strapi.');
      }
    } catch (err) {
      console.error('Erro de rede ao gravar avaliação:', err);
    }
  }
}

export function reOrder(oldOrder) {
  Object.keys(store.cart.items).forEach(id => store.cart.items[id] = 0);
  
  let productsList = [];
  if (Array.isArray(oldOrder.products)) {
    productsList = oldOrder.products;
  } else if (oldOrder.products && typeof oldOrder.products === 'object') {
    if (Array.isArray(oldOrder.products.list)) {
      productsList = oldOrder.products.list;
    } else {
      productsList = Object.values(oldOrder.products).filter(p => p && p.name && p.qty !== undefined);
    }
  }

  productsList.forEach(p => {
    const prod = PRODUCTS.find(item => item.name === p.name);
    if (prod) store.cart.items[prod.id] = p.qty;
  });
}

// ── STRAPI INTEGRATION ───────────────────────────────────────────

export async function fetchCatalogProducts() {
  try {
    const response = await fetch(`${API_URL}/bo/public-products`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error?.message || 'Erro ao carregar catálogo.');
    const rows = Array.isArray(json?.data) ? json.data : [];
    const mapped = rows.map(normalizeProductFromStrapi).filter((p) => p.price >= 0);
    if (mapped.length) {
      PRODUCTS.splice(0, PRODUCTS.length, ...mapped);
      syncCartItemsWithProducts();
    }
  } catch (error) {
    console.warn('Catálogo dinâmico indisponível, a usar fallback estático.', error?.message || error);
  }
}

export async function fetchStores() {
  try {
    const response = await fetch(`${API_URL}/bo/public-stores`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error?.message || 'Erro ao carregar lojas.');
    const rows = Array.isArray(json?.data) ? json.data : [];
    if (rows.length) {
      // Mapear para o formato esperado pelo FO
      const mapped = rows.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        city: s.city
      }));
      CONTINENTE_STORES.splice(0, CONTINENTE_STORES.length, ...mapped);
      // Se já houver um cálculo de proximidade feito com a lista antiga, refazemos
      if (store.delivery.gpsLat) {
        findNearestStore(store.delivery.gpsLat, store.delivery.gpsLng);
      }
    }
  } catch (error) {
    console.warn('Lista de lojas dinâmica indisponível, a usar fallback estático.', error?.message || error);
  }
}

export async function refreshUserProfile() {
  await fetchMe();
}

function normalizeStrapiEntity(entry) {
  if (!entry) return null;
  if (entry.data != null) return normalizeStrapiEntity(entry.data);
  if (entry.attributes) {
    return { ...entry.attributes, id: entry.id, documentId: entry.documentId };
  }
  return entry;
}

export async function fetchUserOrders({ silent = false } = {}) {
  if (!authState.user || !authState.token) return;

  if (!silent && store.orderHistory.length === 0) {
    store.loading = true;
  }

  try {
    const populate = [
      'populate[courier][populate][0]=docSelfie',
      'populate[delivery][populate][0]=courier',
      'populate[delivery][populate][1]=courier.docSelfie',
    ].join('&');
    const response = await fetch(`${API_URL}/orders?${populate}`, {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    });
    const res = await readApiJson(response);

    if (!response.ok) throw new Error(res.error?.message || 'Erro no GET');

    const allOrders = (res.data || []).map(order => {
      const attr = order.attributes || order;
      const statusCode = attr.order_status ? attr.order_status.substring(0, 4) : 'S-01';

      // O Back-Office guarda a mensagem S-03 em items.boMeta.infoRequestMessage
      const boMeta = (attr.items && !Array.isArray(attr.items)) ? attr.items.boMeta : null;
      const adminMsg = attr.adminMessage || order.adminMessage || boMeta?.infoRequestMessage || null;
      const clientRep = attr.clientReply || order.clientReply || null;

      if (statusCode === 'S-03') {
        console.log('[S-03] adminMessage:', adminMsg);
      }

      let productList = [];
      if (Array.isArray(attr.items)) {
        productList = attr.items;
      } else if (attr.items && typeof attr.items === 'object') {
        if (Array.isArray(attr.items.list)) {
          productList = attr.items.list;
        } else {
          productList = Object.values(attr.items).filter(p => p && p.name && p.qty !== undefined);
        }
      }

      // Extrair coordenadas de entrega guardadas na submissão
      const deliveryCoords = (attr.items && !Array.isArray(attr.items)) ? attr.items.deliveryCoords : null;

      return {
        id: Number(order.id),
        documentId: order.documentId,
        orderId: attr.orderId || order.orderId || null,
        date: new Date(attr.createdAt).toLocaleDateString('pt-PT'),
        createdAt: attr.createdAt,
        products: productList,
        total: attr.total_price,
        costEuro: Number(attr.total_price) || 0,
        etaMinutes: Number(attr.estimatedTime) || null,
        priority: Number(attr.priority) || (attr.is_urgent ? 5 : 3),
        isUrgent: !!attr.is_urgent,
        status: statusCode,
        rating: attr.rating,
        store: attr.store_name,
        adminMessage: adminMsg,
        cancelReason: attr.cancelReason || null,
        rejectionReason: attr.rejectionReason || null,
        clientReply: clientRep,
        deliveryCoords,
        storeLatitude: attr.storeLatitude != null ? Number(attr.storeLatitude) : null,
        storeLongitude: attr.storeLongitude != null ? Number(attr.storeLongitude) : null,
        deliveryLatitude: attr.deliveryLatitude != null ? Number(attr.deliveryLatitude) : null,
        deliveryLongitude: attr.deliveryLongitude != null ? Number(attr.deliveryLongitude) : null,
        chatHistory: sortChatHistory(attr.chatHistory || []),
        courier: resolveCourierFromOrder({ courier: attr.courier, delivery: attr.delivery }),
        delivery: normalizeStrapiEntity(attr.delivery),
        courierGpsLat: (() => {
          const del = normalizeStrapiEntity(attr.delivery);
          const lat = Number(del?.courierLatitude);
          const lng = Number(del?.courierLongitude);
          return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? lat : null;
        })(),
        courierGpsLng: (() => {
          const del = normalizeStrapiEntity(attr.delivery);
          const lat = Number(del?.courierLatitude);
          const lng = Number(del?.courierLongitude);
          return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? lng : null;
        })(),
      };
    });

    // 1. Ordenação crucial: Mais recente primeiro
    allOrders.sort((a, b) => b.id - a.id);

    // 2. Estados que encerram uma encomenda definitivamente
    const terminalStates = ['S-11', 'S-12', 'S-13', 'S-15', 'S-16'];

    // 3. CORREÇÃO DA LÓGICA:
    // Olhamos APENAS para a encomenda mais recente (index 0).
    const mostRecent = allOrders[0];

    if (mostRecent && !terminalStates.includes(mostRecent.status)) {
      // Se for S-04 ou S-14, só é ativa se NÃO tiver sido "limpa" (acknowledged) pelo user
      if (['S-04', 'S-14'].includes(mostRecent.status)) {
        if (store.acknowledgedOrders.includes(mostRecent.id)) {
          store.activeOrder = null;
        } else {
          store.activeOrder = mostRecent;
        }
      } else {
        store.activeOrder = mostRecent;
      }
    } else {
      store.activeOrder = null;
    }

    // 4. Atualiza o histórico apenas se houver mudanças reais
    if (JSON.stringify(allOrders) !== JSON.stringify(store.orderHistory)) {
      store.orderHistory = allOrders;
    }

  } catch (error) {
    console.error('Erro ao procurar encomendas:', error);
  } finally {
    if (!silent) store.loading = false;
  }
}

/** Atualiza só a encomenda ativa no histórico — sem loading global */
export function patchActiveOrderFields(patch = {}) {
  if (!store.activeOrder) return;
  Object.assign(store.activeOrder, patch);
  const idx = store.orderHistory.findIndex((o) => o.id === store.activeOrder.id);
  if (idx >= 0) Object.assign(store.orderHistory[idx], patch);
}

export async function submitOrder() {
  if (!authState.user || !authState.token) return { success: false, error: 'Não autenticado' };

  try {
    if (!store.delivery.assignedStore?.name) {
      return { success: false, error: 'Escolhe uma loja Continente válida antes de submeter.' };
    }

    const isUrgent = !!store.cart.urgentDelivery;
    const computedPriority = isUrgent ? 5 : 3;
    const pointsUsed = store.payment.goPointsRedemption === 'product' ? 1000
                     : store.payment.goPointsRedemption === 'delivery' ? 500
                     : 0;

    const body = {
      data: {
        total_price: orderTotal.value,
        order_status: 'S-01 Submetido',
        store_name: store.delivery.assignedStore.name,
        storeLatitude: store.delivery.assignedStore?.lat ?? null,
        storeLongitude: store.delivery.assignedStore?.lng ?? null,
        deliveryLatitude: store.delivery.gpsLat ?? null,
        deliveryLongitude: store.delivery.gpsLng ?? null,
        deliveryAddress: store.delivery.address || '',
        deliveryCity: store.delivery.city || '',
        items: {
          list: cartProducts.value.map(p => ({ sku: p.sku || '', name: p.name, qty: p.qty })),
          deliveryCoords: {
            destLat: store.delivery.gpsLat ?? null,
            destLng: store.delivery.gpsLng ?? null,
            storeLat: store.delivery.assignedStore?.lat ?? null,
            storeLng: store.delivery.assignedStore?.lng ?? null,
            address: store.delivery.address || '',
            city: store.delivery.city || '',
          },
        },
        is_urgent: isUrgent,
        priority: computedPriority,
        estimatedTime: estimatedETA.value,
        user: authState.user.id,
        go_points_redemption: store.payment.goPointsRedemption || null,
        go_points_used: Number(pointsUsed) || 0,
        notes: store.delivery.instructions || '',
      }
    };

    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (response.ok) {
      // Atualiza o histórico imediatamente após a compra
      await fetchUserOrders();
      socket.emit('global_order_status_update', { status: 'S-01' });
      return { success: true };
    } else {
      return { success: false, error: result.error?.message || 'Erro na criação da encomenda' };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function resetCart() {
  Object.keys(store.cart.items).forEach(id => store.cart.items[id] = 0);
  store.cart.urgentDelivery = false;
  store.payment = {
    method: 'mbway',
    mbwayPhone: '',
    cardName: '',
    cardNumber: '',
    useGoPoints: false,
    goPointsRedemption: null,
  };
}


export async function cancelActiveOrder(orderId, reason) {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify({
        data: {
          order_status: 'S-13 Cancelado pelo Cliente',
          cancelReason: reason
        }
      })
    });

    if (response.ok) {
      await fetchUserOrders();
      socket.emit('order_status_update', { room: orderId, status: 'S-13' });
      socket.emit('global_order_status_update', { status: 'S-13' });
      return { success: true };
    }

    const err = await response.json();
    return { success: false, error: err?.error?.message || 'Erro ao cancelar no servidor' };
  } catch (err) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

/**
 * Marca a encomenda atual (cancelada ou rejeitada) como "vista" pelo utilizador,
 * permitindo que ela saia do estado ativo para que possa fazer novas encomendas.
 */
export function acknowledgeActiveOrder() {
  if (!store.activeOrder) return;
  const id = store.activeOrder.id;
  if (!store.acknowledgedOrders.includes(id)) {
    store.acknowledgedOrders.push(id);
    localStorage.setItem('go_acknowledged_orders', JSON.stringify(store.acknowledgedOrders));
  }
  store.activeOrder = null;
}

export async function replyToInfoRequest(documentId, reply) {
  if (!authState.user || !authState.token) return { success: false, error: 'Não autenticado' };
  const text = String(reply || '').trim();
  if (!text) return { success: false, error: 'Resposta vazia.' };
  try {
    const chatRes = await fetch(`${API_URL}/orders/${documentId}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`,
      },
      body: JSON.stringify({ text, channel: 'info_adicional' }),
    });
    if (!chatRes.ok) {
      const err = await chatRes.json();
      return { success: false, error: err?.error?.message || 'Erro ao guardar mensagem' };
    }
    const chatJson = await chatRes.json();
    const chatHistory = sortChatHistory(chatJson?.data?.chatHistory || []);
    const targetOrder = (store.activeOrder?.documentId === documentId)
      ? store.activeOrder
      : store.orderHistory.find((o) => o.documentId === documentId);
    if (targetOrder) {
      targetOrder.chatHistory = chatHistory;
      targetOrder.clientReply = text;
    }

    const response = await fetch(`${API_URL}/orders/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`,
      },
      body: JSON.stringify({
        data: {
          clientReply: text,
          order_status: 'S-02 Em Análise',
        },
      }),
    });

    if (response.ok) {
      await fetchUserOrders({ silent: true });
      socket.emit('order_status_update', { room: documentId, status: 'S-02' });
      socket.emit('global_order_status_update', { status: 'S-02' });
      return { success: true };
    }

    const err = await response.json();
    return { success: false, error: err?.error?.message || 'Erro ao enviar resposta' };
  } catch (err) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

const INVOICE_DOWNLOAD_STATUSES = new Set(['S-11', 'S-15', 'S-16']);

export function canDownloadOrderInvoice(order) {
  return !!order?.documentId && INVOICE_DOWNLOAD_STATUSES.has(String(order?.status || ''));
}

export async function downloadOrderInvoice(documentId, suggestedName = 'fatura.pdf') {
  if (!authState.user || !authState.token) return { success: false, error: 'Não autenticado' };
  try {
    const response = await fetch(`${API_URL}/orders/${encodeURIComponent(documentId)}/invoice`, {
      headers: { Authorization: `Bearer ${authState.token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err?.error?.message || 'Não foi possível descarregar a fatura.' };
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || suggestedName;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Erro ao descarregar fatura.' };
  }
}

export async function sendChatMessage(documentId, text, sender = 'client') {
  if (!authState.user || !authState.token) return { success: false, error: 'Não autenticado' };
  const bodyText = String(text || '').trim();
  if (!bodyText) return { success: false, error: 'Mensagem vazia.' };

  const targetOrder = (store.activeOrder?.documentId === documentId)
    ? store.activeOrder
    : store.orderHistory.find((o) => o.documentId === documentId);

  try {
    const response = await fetch(`${API_URL}/orders/${documentId}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`,
      },
      body: JSON.stringify({ text: bodyText, channel: 'delivery' }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: json?.error?.message || 'Erro ao guardar mensagem' };
    }

    const chatHistory = sortChatHistory(json?.data?.chatHistory || []);
    const newMessage = json?.data?.message || {
      sender,
      text: bodyText,
      time: new Date().toISOString(),
    };
    if (targetOrder) {
      targetOrder.chatHistory = chatHistory.length ? chatHistory : mergeChatHistory(targetOrder.chatHistory, [], newMessage);
    }
    return { success: true, message: newMessage, chatHistory: targetOrder?.chatHistory || chatHistory };
  } catch (err) {
    console.error('Chat Error:', err);
    return { success: false, error: err.message };
  }
}

export function applyOrderChatMessage(orderLike, data) {
  if (!orderLike || !data) return;
  orderLike.chatHistory = mergeChatHistory(
    orderLike.chatHistory,
    data.chatHistory,
    data.message,
  );
}

export function useOrderStore() { return store; }
export default store;

void fetchCatalogProducts();