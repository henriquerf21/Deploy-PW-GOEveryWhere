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

export const PRODUCTS = [
  { id: 'frasco-1', name: '1 Frasco', desc: '30 gomas proteicas', price: 14.99, gomas: 30 },
  { id: 'pack-2', name: 'Pack 2 Frascos', desc: 'Poupa 10% — 60 gomas', price: 26.99, gomas: 60, popular: true, discount: '-10%' },
  { id: 'pack-3', name: 'Pack 3 Frascos', desc: 'Poupa 15% — 90 gomas', price: 38.24, gomas: 90, discount: '-15%' },
];

// ── STATE ────────────────────────────────────────────────────────
const store = reactive({
  cart: { items: { 'frasco-1': 1, 'pack-2': 0, 'pack-3': 0 }, urgentDelivery: false },
  delivery: {
    name: '', phone: '', address: '', postalCode: '', city: '', 
    assignedStore: null, estimatedDistance: null,
  },
  payment: { method: 'mbway', mbwayPhone: '', useGoPoints: false, goPointsRedemption: null },
  goPoints: { balance: 1250 },
  activeOrder: null,
  orderHistory: [],
  loading: false
});

// ── COMPUTED ─────────────────────────────────────────────────────
export const cartItemCount = computed(() => Object.values(store.cart.items).reduce((sum, qty) => sum + qty, 0));
export const cartProducts = computed(() => PRODUCTS.filter(p => store.cart.items[p.id] > 0).map(p => ({ ...p, qty: store.cart.items[p.id], lineTotal: p.price * store.cart.items[p.id] })));
export const subtotal = computed(() => PRODUCTS.reduce((sum, p) => sum + (p.price * store.cart.items[p.id]), 0));
export const deliveryFee = computed(() => (subtotal.value >= 25 ? 0 : 2.99));
export const urgentFee = computed(() => store.cart.urgentDelivery ? 1.50 : 0);
export const orderTotal = computed(() => subtotal.value + deliveryFee.value + urgentFee.value);
export const estimatedETA = computed(() => 30);
export const pointsToEarn = computed(() => Math.floor(orderTotal.value * 10));
export const productDiscount = computed(() => 0); // Para evitar erros de importação

// ── ACTIONS (Todas restauradas para evitar SyntaxErrors no Vite) ──
export function setCartQty(productId, qty) { store.cart.items[productId] = Math.max(0, qty); }
export function toggleUrgent() { store.cart.urgentDelivery = !store.cart.urgentDelivery; }
export function setDeliveryField(field, value) { store.delivery[field] = value; }
export function setPaymentMethod(method) { store.payment.method = method; }
export function setPaymentField(field, value) { store.payment[field] = value; }
export function toggleGoPoints() {}
export function assignDefaultStore() { findNearestStore(41.5518, -8.4229); }

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
export function isDeliveryValid() { return !!(store.delivery.name && store.delivery.address); }

// FUNÇÕES PARA O HISTÓRICO (O que faltava!)
export function rateOrder(orderId, rating) {
  const order = store.orderHistory.find(o => o.id === orderId);
  if (order) {
    order.rating = rating;
    order.status = 'S-15'; // Marca como avaliado
    // Aqui podias fazer um fetch PUT para gravar a nota no Strapi
  }
}

export function reOrder(oldOrder) {
  // Limpa o carrinho e adiciona o que estava na ordem antiga
  Object.keys(store.cart.items).forEach(id => store.cart.items[id] = 0);
  if (oldOrder.products) {
    oldOrder.products.forEach(p => {
      // Tenta encontrar o ID do produto pelo nome
      const prod = PRODUCTS.find(item => item.name === p.name);
      if (prod) store.cart.items[prod.id] = p.qty;
    });
  }
}

// ── STRAPI INTEGRATION (v5) ──────────────────────────────────────

export async function fetchUserOrders() {
  if (!authState.user || !authState.token) return;
  store.loading = true;
  
  try {
    const userUID = authState.user.documentId || authState.user.id;
    const url = `${API_URL}/orders?filters[user][documentId][$eq]=${userUID}&populate=*`;
    
    const response = await fetch(url, { 
      headers: { 'Authorization': `Bearer ${authState.token}` } 
    });
    const res = await response.json();
    
    if (!response.ok) throw new Error(res.error?.message || "Erro no GET");

    const allOrders = (res.data || []).map(order => {
      const attr = order.attributes || order;
      
      // Extrai apenas o código (ex: "S-01") 
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

    // Ordena por ID decrescente
    allOrders.sort((a, b) => b.id - a.id);

    store.orderHistory = allOrders;

    // Estados terminais baseados no Caderno de Encargos
    const terminalStates = ['S-04', 'S-11', 'S-12', 'S-13', 'S-14', 'S-15', 'S-16'];
    
    // Procura a encomenda mais recente que NÃO terminou
    store.activeOrder = allOrders.find(o => !terminalStates.includes(o.status)) || null;

  } catch (error) { 
    console.error("Erro ao procurar encomendas:", error); 
  } finally { 
    store.loading = false; 
  }
}

export async function submitOrder() {
  if (!authState.user) return { success: false, error: 'Não autenticado' };
  
  try {
    const body = {
      data: {
        total_price: orderTotal.value, 
        // CORREÇÃO: O valor tem de ser IDENTICO ao que está no Strapi
        order_status: 'S-01 Submetido', 
        
        store_name: store.delivery.assignedStore?.name || 'Continente Braga',
        items: cartProducts.value.map(p => ({ name: p.name, qty: p.qty })),
        user: authState.user.id, 
        is_urgent: store.cart.urgentDelivery
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
      await fetchUserOrders();
      return { success: true };
    } else {
      // O erro que recebeste veio daqui
      return { 
        success: false, 
        error: result.error?.message || "Erro de validação" 
      };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Suporte Tracking
export function advanceOrderState() {}
export function cancelOrder() {}
export function completeOrder() {}

export function useOrderStore() { return store; }
export default store;

