import { reactive, computed } from 'vue';
import authState from './authStore';

const API_URL = 'http://localhost:1337/api';

// ── DATA TABLES ──────────────────────────────────────────────────
export const CONTINENTE_STORES = [
  { id: 1, name: 'Continente Nova Arcada', address: 'Nova Arcada, Av. Cávado, 4700-084 Braga', lat: 41.5472, lng: -8.4057 },
  { id: 2, name: 'Continente Braga Parque', address: 'Braga Parque, R. do Carmo, 4700-309 Braga', lat: 41.5518, lng: -8.4229 },
  { id: 3, name: 'Continente Bom Dia Gualtar', address: 'R. dos Peões, 4710-057 Braga', lat: 41.5614, lng: -8.3960 },
  { id: 4, name: 'Continente Bom Dia São Vicente', address: 'R. de São Vicente, 4710-331 Braga', lat: 41.5536, lng: -8.4335 },
  { id: 5, name: 'Continente Guimarães Shopping', address: 'Guimarães Shopping, 4810-000 Guimarães', lat: 41.4425, lng: -8.2918 },
];

export const ORDER_STATES = {
  'S-01': { label: 'Submetido', color: '#6b7280', icon: '📩' },
  'S-02': { label: 'Em Análise', color: '#f59e0b', icon: '🔍' },
  'S-09': { label: 'Em Trânsito', color: '#00c853', icon: '🚀' },
  'S-11': { label: 'Entregue', color: '#059669', icon: '✅', terminal: true },
  'S-15': { label: 'Concluído e Avaliado', color: '#059669', icon: '⭐', terminal: true },
};

export const PRODUCTS = reactive([
  { id: 'frasco-1', name: '1 Frasco', desc: '30 gomas proteicas', price: 14.99, gomas: 30 },
  { id: 'pack-2', name: 'Pack 2 Frascos', desc: 'Poupa 10% — 60 gomas', price: 26.99, gomas: 60, popular: true, discount: '-10%' },
  { id: 'pack-3', name: 'Pack 3 Frascos', desc: 'Poupa 15% — 90 gomas', price: 38.24, gomas: 90, discount: '-15%' },
]);

// ── STATE ────────────────────────────────────────────────────────
const store = reactive({
  cart: { items: { 'frasco-1': 0, 'pack-2': 0, 'pack-3': 0 }, urgentDelivery: false },
  delivery: {
    name: '', phone: '', address: '', postalCode: '', city: '',
    assignedStore: null, estimatedDistance: null,
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
export const deliveryFee = computed(() => 2.99);
export const urgentFee = computed(() => store.cart.urgentDelivery ? 1.50 : 0);
export const estimatedETA = computed(() => 30);

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
  let nearest = CONTINENTE_STORES[0];
  let minDist = Infinity;
  for (const s of CONTINENTE_STORES) {
    const dist = Math.sqrt((s.lat - lat) ** 2 + (s.lng - lng) ** 2);
    if (dist < minDist) { minDist = dist; nearest = s; }
  }
  store.delivery.assignedStore = nearest;
  store.delivery.estimatedDistance = Math.round(minDist * 111 * 10) / 10;
}

export function isCartValid() { return cartItemCount.value > 0; }
export function isDeliveryValid() {
  return !!(store.delivery.name?.trim().length >= 3 && store.delivery.address?.trim().length >= 5 && store.delivery.postalCode && store.delivery.city);
}

export function rateOrder(orderId, rating) {
  const order = store.orderHistory.find(o => o.id === orderId);
  if (order) {
    order.rating = rating;
    order.status = 'S-15';
  }
}

export function reOrder(oldOrder) {
  Object.keys(store.cart.items).forEach(id => store.cart.items[id] = 0);
  if (oldOrder.products) {
    oldOrder.products.forEach(p => {
      const prod = PRODUCTS.find(item => item.name === p.name);
      if (prod) store.cart.items[prod.id] = p.qty;
    });
  }
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

export async function refreshUserProfile() {
  if (!authState.token) return;
  try {
    const response = await fetch(`${API_URL}/users/me?populate=go_point`, {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    });
    const userData = await response.json();
    if (response.ok) {
      const newPoints = userData?.go_point?.points;
      const currentPoints = authState.user?.go_point?.points;
      if (newPoints !== currentPoints) {
        authState.user = { ...authState.user, ...userData };
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
  }
}

export async function fetchUserOrders() {
  if (!authState.user || !authState.token) return;

  if (store.orderHistory.length === 0) {
    store.loading = true;
  }

  try {
    const response = await fetch(`${API_URL}/orders?populate=*`, {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    });
    const res = await response.json();

    if (!response.ok) throw new Error(res.error?.message || 'Erro no GET');

    const allOrders = (res.data || []).map(order => {
      const attr = order.attributes || order;
      const statusCode = attr.order_status ? attr.order_status.substring(0, 4) : 'S-01';

      return {
        id: Number(order.id),
        date: new Date(attr.createdAt).toLocaleDateString('pt-PT'),
        createdAt: attr.createdAt,
        products: attr.items || [],
        total: attr.total_price,
        status: statusCode,
        rating: attr.rating,
        store: attr.store_name
      };
    });

    // 1. Ordenação crucial: Mais recente primeiro
    allOrders.sort((a, b) => b.id - a.id);

    // 2. Estados que encerram uma encomenda
    const terminalStates = ['S-04', 'S-11', 'S-12', 'S-13', 'S-14', 'S-15', 'S-16'];

    // 3. CORREÇÃO DA LÓGICA:
    // Olhamos APENAS para a encomenda mais recente (index 0).
    // Se ela não for terminal, é a ativa. Caso contrário, não há nenhuma ativa.
    if (allOrders.length > 0 && !terminalStates.includes(allOrders[0].status)) {
      store.activeOrder = allOrders[0];
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
    store.loading = false;
  }
}

export async function submitOrder() {
  if (!authState.user || !authState.token) return { success: false, error: 'Não autenticado' };

  try {
    const pointsUsed = store.payment.goPointsRedemption === 'product' ? 1000
                     : store.payment.goPointsRedemption === 'delivery' ? 500
                     : 0;

    const body = {
      data: {
        total_price: orderTotal.value,
        order_status: 'S-01 Submetido',
        store_name: store.delivery.assignedStore?.name || 'Continente Braga',
        items: cartProducts.value.map(p => ({ name: p.name, qty: p.qty })),
        is_urgent: store.cart.urgentDelivery,
        user: authState.user.id,
        go_points_redemption: store.payment.goPointsRedemption || null,
        go_points_used: pointsUsed,
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

export function useOrderStore() { return store; }
export default store;

void fetchCatalogProducts();