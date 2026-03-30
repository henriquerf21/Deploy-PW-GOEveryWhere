import { reactive, computed } from 'vue';

// ── Continente stores (hardcoded for simulation) ─────────────────
const CONTINENTE_STORES = [
  { id: 1, name: 'Continente Nova Arcada', address: 'Nova Arcada, Av. Cávado, 4700-084 Braga', lat: 41.5472, lng: -8.4057 },
  { id: 2, name: 'Continente Braga Parque', address: 'Braga Parque, R. do Carmo, 4700-309 Braga', lat: 41.5518, lng: -8.4229 },
  { id: 3, name: 'Continente Bom Dia Gualtar', address: 'R. dos Peões, 4710-057 Braga', lat: 41.5614, lng: -8.3960 },
  { id: 4, name: 'Continente Bom Dia São Vicente', address: 'R. de São Vicente, 4710-331 Braga', lat: 41.5536, lng: -8.4335 },
  { id: 5, name: 'Continente Guimarães Shopping', address: 'Guimarães Shopping, 4810-000 Guimarães', lat: 41.4425, lng: -8.2918 },
];

// ── Estafetas pool (simulated) ───────────────────────────────────
const ESTAFETAS = [
  { id: 1, name: 'João S.', initials: 'JS', rating: 4.9, deliveries: 342, transport: 'Bicicleta Elétrica' },
  { id: 2, name: 'Ana M.', initials: 'AM', rating: 4.8, deliveries: 218, transport: 'Scooter' },
  { id: 3, name: 'Pedro L.', initials: 'PL', rating: 4.7, deliveries: 156, transport: 'Bicicleta Elétrica' },
  { id: 4, name: 'Maria C.', initials: 'MC', rating: 5.0, deliveries: 89, transport: 'Scooter' },
];

// ── Order state labels ───────────────────────────────────────────
export const ORDER_STATES = {
  'S-01': { label: 'Submetido', color: '#6b7280', icon: '📩' },
  'S-02': { label: 'Em Análise', color: '#f59e0b', icon: '🔍' },
  'S-03': { label: 'Info Adicional Solicitada', color: '#f97316', icon: '📋' },
  'S-04': { label: 'Rejeitado', color: '#ef4444', icon: '❌', terminal: true },
  'S-05': { label: 'Aprovado', color: '#10b981', icon: '✅' },
  'S-06': { label: 'Aguardando Aceitação', color: '#8b5cf6', icon: '⏳' },
  'S-07': { label: 'Aceite pelo Estafeta', color: '#3b82f6', icon: '🏍️' },
  'S-08': { label: 'Em Recolha', color: '#06b6d4', icon: '🏪' },
  'S-09': { label: 'Em Trânsito', color: '#00c853', icon: '🚀' },
  'S-10': { label: 'No Destino', color: '#059669', icon: '📍' },
  'S-11': { label: 'Entregue', color: '#059669', icon: '✅', terminal: true },
  'S-12': { label: 'Não Foi Possível Entregar', color: '#ef4444', icon: '⚠️', terminal: true },
  'S-13': { label: 'Cancelado pelo Cliente', color: '#ef4444', icon: '🚫', terminal: true },
  'S-14': { label: 'Cancelado pelo Admin', color: '#ef4444', icon: '🚫', terminal: true },
  'S-15': { label: 'Concluído e Avaliado', color: '#059669', icon: '⭐', terminal: true },
  'S-16': { label: 'Concluído Sem Avaliação', color: '#6b7280', icon: '✔️', terminal: true },
};

// ── Product catalog ──────────────────────────────────────────────
export const PRODUCTS = [
  { id: 'frasco-1', name: '1 Frasco', desc: '30 gomas proteicas', price: 14.99, gomas: 30 },
  { id: 'pack-2', name: 'Pack 2 Frascos', desc: 'Poupa 10% — 60 gomas', price: 26.99, gomas: 60, popular: true, discount: '-10%' },
  { id: 'pack-3', name: 'Pack 3 Frascos', desc: 'Poupa 15% — 90 gomas', price: 38.24, gomas: 90, discount: '-15%' },
];

// ── Create the store ─────────────────────────────────────────────
const store = reactive({
  // Cart
  cart: {
    items: {
      'frasco-1': 1,
      'pack-2': 0,
      'pack-3': 0,
    },
    urgentDelivery: false,
  },

  // Delivery
  delivery: {
    name: '',
    phone: '',
    nif: '',
    address: '',
    postalCode: '',
    city: '',
    floor: '',
    instructions: '',
    gpsLat: null,
    gpsLng: null,
    assignedStore: null,
    estimatedDistance: null,
  },

  // Payment
  payment: {
    method: 'mbway', // 'card', 'mbway', 'multibanco'
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    mbwayPhone: '',
    useGoPoints: false,
    goPointsRedemption: null, // 'delivery_free' or 'product_free'
  },

  // GoPoints
  goPoints: {
    balance: 1250, // simulated balance
    pending: 0,
  },

  // Active order
  activeOrder: null,

  // History
  orderHistory: [
    {
      id: 'ORD-2846',
      date: '25 Mar 2026 · 14:32',
      products: [{ name: '2x GoGummies', qty: 2 }],
      total: 26.99,
      status: 'S-15',
      deliveryTime: 28,
      rating: 5.0,
      store: 'Continente Nova Arcada',
      rated: true,
    },
    {
      id: 'ORD-2831',
      date: '20 Mar 2026 · 10:15',
      products: [{ name: '1x GoGummies', qty: 1 }],
      total: 14.99,
      status: 'S-15',
      deliveryTime: 22,
      rating: 4.8,
      store: 'Continente Braga Parque',
      rated: true,
    },
    {
      id: 'ORD-2804',
      date: '15 Mar 2026 · 18:45',
      products: [{ name: '3x GoGummies', qty: 3 }],
      total: 38.24,
      status: 'S-11',
      deliveryTime: 35,
      rating: null,
      store: 'Continente Nova Arcada',
      rated: false,
    },
  ],
});

// ── Computed helpers ──────────────────────────────────────────────
export const cartItemCount = computed(() => {
  return Object.values(store.cart.items).reduce((sum, qty) => sum + qty, 0);
});

export const cartProducts = computed(() => {
  return PRODUCTS.filter(p => store.cart.items[p.id] > 0).map(p => ({
    ...p,
    qty: store.cart.items[p.id],
    lineTotal: p.price * store.cart.items[p.id],
  }));
});

export const subtotal = computed(() => {
  return PRODUCTS.reduce((sum, p) => sum + (p.price * store.cart.items[p.id]), 0);
});

export const deliveryFee = computed(() => {
  const base = 2.49;
  const perKm = 0.50;
  const distance = store.delivery.estimatedDistance || 3; // default 3km
  let fee = base + (perKm * distance);
  fee = Math.round(fee * 100) / 100;
  // Free delivery with GoPoints
  if (store.payment.useGoPoints && store.payment.goPointsRedemption === 'delivery_free') {
    return 0;
  }
  // Free delivery for orders > €25
  if (subtotal.value >= 25) return 0;
  return fee;
});

export const urgentFee = computed(() => {
  return store.cart.urgentDelivery ? 1.50 : 0;
});

export const productDiscount = computed(() => {
  if (store.payment.useGoPoints && store.payment.goPointsRedemption === 'product_free') {
    // Discount the cheapest product
    const items = cartProducts.value;
    if (items.length > 0) {
      const cheapest = [...items].sort((a, b) => a.price - b.price)[0];
      return cheapest.price;
    }
  }
  return 0;
});

export const orderTotal = computed(() => {
  return Math.max(0, subtotal.value + deliveryFee.value + urgentFee.value - productDiscount.value);
});

export const estimatedETA = computed(() => {
  if (store.cart.urgentDelivery) return 15;
  const distance = store.delivery.estimatedDistance || 3;
  return Math.round(20 + distance * 3); // ~20 min base + 3 min/km
});

export const pointsToEarn = computed(() => {
  return Math.floor(orderTotal.value * 10); // 10 pts per euro
});

// ── Actions ──────────────────────────────────────────────────────
export function setCartQty(productId, qty) {
  store.cart.items[productId] = Math.max(0, qty);
}

export function toggleUrgent() {
  store.cart.urgentDelivery = !store.cart.urgentDelivery;
}

export function setDeliveryField(field, value) {
  store.delivery[field] = value;
}

export function setPaymentMethod(method) {
  store.payment.method = method;
}

export function setPaymentField(field, value) {
  store.payment[field] = value;
}

export function toggleGoPoints(redemptionType) {
  if (store.payment.useGoPoints && store.payment.goPointsRedemption === redemptionType) {
    store.payment.useGoPoints = false;
    store.payment.goPointsRedemption = null;
  } else {
    store.payment.useGoPoints = true;
    store.payment.goPointsRedemption = redemptionType;
  }
}

export function findNearestStore(lat, lng) {
  let nearest = CONTINENTE_STORES[0];
  let minDist = Infinity;
  for (const s of CONTINENTE_STORES) {
    const dist = Math.sqrt((s.lat - lat) ** 2 + (s.lng - lng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }
  store.delivery.assignedStore = nearest;
  store.delivery.estimatedDistance = Math.round(minDist * 111 * 10) / 10; // rough km
}

export function assignDefaultStore() {
  // Default to Braga
  findNearestStore(41.5518, -8.4229);
}

export function submitOrder() {
  const orderId = 'ORD-' + String(2847 + store.orderHistory.length).padStart(4, '0');
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  const estafeta = ESTAFETAS[Math.floor(Math.random() * ESTAFETAS.length)];

  store.activeOrder = {
    id: orderId,
    date: dateStr,
    products: cartProducts.value.map(p => ({ name: `${p.qty}x ${p.name}`, qty: p.qty })),
    total: orderTotal.value,
    subtotal: subtotal.value,
    deliveryFee: deliveryFee.value,
    urgentFee: urgentFee.value,
    urgent: store.cart.urgentDelivery,
    status: 'S-01',
    store: store.delivery.assignedStore,
    delivery: { ...store.delivery },
    payment: { method: store.payment.method },
    estafeta,
    eta: estimatedETA.value,
    pointsEarned: pointsToEarn.value,
    timeline: [
      { state: 'S-01', time: now.toISOString(), done: true },
    ],
    rating: null,
  };

  // Deduct GoPoints if used
  if (store.payment.useGoPoints) {
    const cost = store.payment.goPointsRedemption === 'delivery_free' ? 500 : 1000;
    store.goPoints.balance -= cost;
  }

  // Add earned points to pending
  store.goPoints.pending += store.activeOrder.pointsEarned;

  return store.activeOrder;
}

export function advanceOrderState() {
  if (!store.activeOrder) return;
  const flow = ['S-01', 'S-02', 'S-05', 'S-06', 'S-07', 'S-08', 'S-09', 'S-10', 'S-11'];
  const currentIdx = flow.indexOf(store.activeOrder.status);
  if (currentIdx < 0 || currentIdx >= flow.length - 1) return;
  const nextState = flow[currentIdx + 1];
  store.activeOrder.status = nextState;
  store.activeOrder.timeline.push({
    state: nextState,
    time: new Date().toISOString(),
    done: true,
  });
  return nextState;
}

export function cancelOrder(justification) {
  if (!store.activeOrder) return;
  const cancelable = ['S-01', 'S-02', 'S-03', 'S-05', 'S-06'];
  if (!cancelable.includes(store.activeOrder.status)) return false;
  store.activeOrder.status = 'S-13';
  store.activeOrder.cancellation = { justification, time: new Date().toISOString() };
  moveActiveToHistory();
  return true;
}

export function completeOrder(rating = null) {
  if (!store.activeOrder) return;
  if (rating) {
    store.activeOrder.status = 'S-15';
    store.activeOrder.rating = rating;
  } else {
    store.activeOrder.status = 'S-16';
  }
  // Move pending points to balance
  store.goPoints.balance += store.activeOrder.pointsEarned;
  store.goPoints.pending -= store.activeOrder.pointsEarned;
  moveActiveToHistory();
}

function moveActiveToHistory() {
  if (!store.activeOrder) return;
  store.orderHistory.unshift({
    id: store.activeOrder.id,
    date: store.activeOrder.date,
    products: store.activeOrder.products,
    total: store.activeOrder.total,
    status: store.activeOrder.status,
    deliveryTime: store.activeOrder.eta,
    rating: store.activeOrder.rating,
    store: store.activeOrder.store?.name || 'Continente',
    rated: !!store.activeOrder.rating,
  });
  store.activeOrder = null;
}

export function reOrder(historyOrder) {
  // Reset cart
  Object.keys(store.cart.items).forEach(k => store.cart.items[k] = 0);
  // Recreate from history (simplified)
  for (const p of historyOrder.products) {
    const qty = p.qty || 1;
    // Match to first product slot
    if (qty >= 3) store.cart.items['pack-3'] = 1;
    else if (qty >= 2) store.cart.items['pack-2'] = 1;
    else store.cart.items['frasco-1'] = 1;
  }
}

export function rateOrder(orderId, rating) {
  const order = store.orderHistory.find(o => o.id === orderId);
  if (order) {
    order.rating = rating;
    order.rated = true;
    order.status = 'S-15';
  }
}

export function isDeliveryValid() {
  const d = store.delivery;
  return d.name.trim() && d.phone.trim() && d.address.trim() && d.postalCode.trim() && d.city.trim();
}

export function isCartValid() {
  return cartItemCount.value > 0;
}

// ── Export store ─────────────────────────────────────────────────
export function useOrderStore() {
  return store;
}

export { CONTINENTE_STORES, ESTAFETAS };

export default store;
