<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />

    <main class="cf-checkout-main history-main">
      <header class="hist-head">
        <p class="cf-checkout-kicker">As tuas compras</p>
        <h1 class="cf-checkout-title">Histórico</h1>
      </header>

      <div class="cf-tabs" role="tablist">
        <router-link to="/order/tracking" class="cf-tab" role="tab">Encomenda ativa</router-link>
        <span class="cf-tab is-active" role="tab" aria-selected="true">Histórico</span>
      </div>

      <div class="gopoints-bar">
        <div class="gp-left">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f57f17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
          <div>
            <span class="gp-balance">{{ userPointsBalance }} GoPoints</span>
          </div>
        </div>
        <div class="gp-tiers">
          <span class="tier" :class="{ available: userPointsBalance >= 500, 'locked-cursor': userPointsBalance < 500 }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            500 pts = Entrega grátis
          </span>
          <span class="tier" :class="{ available: userPointsBalance >= 1000, 'locked-cursor': userPointsBalance < 1000 }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            1000 pts = Desconto de 10€
          </span>
        </div>
      </div>

      <div v-if="store.loading && sortedOrders.length === 0" class="loading-history">
        <p>A carregar o teu histórico...</p>
      </div>

      <div class="orders-list" v-else-if="sortedOrders.length > 0">
        <div v-for="order in sortedOrders" :key="order.id" class="order-card">
          <div class="order-top">
            <div>
              <h3>Encomenda #{{ order.id }}</h3>
              <span class="order-date">{{ order.date }}</span>
            </div>
            <span class="status" :class="statusClass(order.status)">
              {{ statusLabel(order.status) }}
            </span>
          </div>

          <div class="order-items">
            <span v-for="p in order.products" :key="p.name" class="order-product">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#00c853"><circle cx="12" cy="12" r="8"/></svg>
              {{ p.name }}
            </span>
            <span class="order-total">€{{ order.total?.toFixed(2) }}</span>
          </div>

          <div class="order-bottom">
            <div class="delivery-info">
              <span v-if="order.store" class="info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ order.store }}
              </span>
              <span v-if="order.rating" class="info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ order.rating.toFixed(1) }}
              </span>
            </div>
            <div class="order-actions">
              <button
                v-if="!order.rating && (order.status === 'S-11' || order.status === 'S-16')"
                class="btn-rate"
                @click="openRatingModal(order)"
              >
                Avaliar
              </button>
              <button class="btn-repeat" @click="repeatOrder(order)">
                Repetir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!store.loading" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <h3>Sem histórico</h3>
        <p>Ainda não tens encomendas concluídas.</p>
        <router-link to="/order/select" class="btn-new">Começar encomenda</router-link>
      </div>
    </main>

    <SiteFooter />

    <div v-if="showRatingModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Avaliar Encomenda</h3>
        <div class="stars">
          <button v-for="i in 5" :key="i" @click="ratingValue = i" :class="{ active: i <= ratingValue }">★</button>
        </div>
        <p>{{ ratingLabels[ratingValue - 1] || 'Seleciona uma nota' }}</p>
        <div class="modal-btns">
          <button @click="showRatingModal = false">Cancelar</button>
          <button @click="submitRating" :disabled="ratingValue === 0">Confirmar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import {
  useOrderStore,
  ORDER_STATES,
  reOrder,
  rateOrder,
  fetchUserOrders,
  refreshUserProfile,
  cancelActiveOrder,
  userPointsBalance
} from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const showRatingModal = ref(false);
const ratingOrder = ref(null);
const ratingValue = ref(0);
const ratingLabels = ['Mau', 'Medíocre', 'Razoável', 'Bom', 'Excelente'];

// --- Lógica para o Cancelamento (Requisito S-13) ---
const showCancelModal = ref(false);
const orderToCancel = ref(null);
const cancelReasonInput = ref('');
const cancelling = ref(false);

function openCancelModal(order) {
  orderToCancel.value = order;
  cancelReasonInput.value = '';
  showCancelModal.value = true;
}

async function confirmOrderCancellation() {
  if (!orderToCancel.value || cancelReasonInput.value.trim().length < 5) return;
  
  cancelling.value = true;
  // Chama a função que criaste na store
  const result = await cancelActiveOrder(orderToCancel.value.id, cancelReasonInput.value);
  
  if (result.success) {
    showCancelModal.value = false;
    cancelReasonInput.value = '';
  } else {
    alert(`Erro: ${result.error}`);
  }
  cancelling.value = false;
}

// ── LÓGICA DE ORDENAÇÃO (APENAS UMA DECLARAÇÃO AQUI) ──
const sortedOrders = computed(() => {
  if (!store.orderHistory) return [];
  const terminalStates = ['S-04', 'S-11', 'S-12', 'S-13', 'S-14', 'S-15', 'S-16'];
  return [...store.orderHistory]
    .filter(order => terminalStates.includes(order.status))
    .sort((a, b) => Number(b.id) - Number(a.id));
});

let refreshInterval = null;

onMounted(async () => {
  // Carrega imediatamente ao entrar
  await Promise.all([fetchUserOrders(), refreshUserProfile()]);

  // Configura o intervalo de atualização (30 segundos)
  refreshInterval = setInterval(async () => {
    const terminalStates = ['S-04', 'S-11', 'S-12', 'S-13', 'S-14', 'S-15', 'S-16'];
    const hasActive = store.orderHistory.some(o => !terminalStates.includes(o.status));
    
    // Se houver encomendas ativas, atualiza em background
    if (hasActive) {
      await Promise.all([fetchUserOrders(), refreshUserProfile()]);
    }
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

function statusLabel(status) {
  return ORDER_STATES[status]?.label || status;
}

function statusClass(status) {
  if (['S-11', 'S-15', 'S-16'].includes(status)) return 'delivered';
  if (['S-04', 'S-12', 'S-13', 'S-14'].includes(status)) return 'cancelled';
  return 'pending';
}

function openRatingModal(order) {
  ratingOrder.value = order;
  ratingValue.value = 0;
  showRatingModal.value = true;
}

function submitRating() {
  if (ratingOrder.value && ratingValue.value > 0) {
    rateOrder(ratingOrder.value.id, ratingValue.value);
    showRatingModal.value = false;
  }
}

function repeatOrder(order) {
  reOrder(order);
  router.push('/order/select');
}
</script>



<style scoped>
.modal-btns {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.modal-btns button {
  padding: 0.5rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--cf-line);
  background: var(--cf-card);
}


.stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.stars button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #d1d5db;
  transition: color 0.15s ease;
  line-height: 1;
}

.stars button.active {
  color: #f59e0b;
}



.locked-cursor {
  cursor: not-allowed !important;
  opacity: 0.7;
}



.loading-history {
  text-align: center;
  padding: 3rem;
  color: var(--cf-muted);
  font-family: var(--cf-font);
}

.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.history-main {
  padding-bottom: 3rem;
}

.hist-head {
  margin-bottom: 1.5rem;
  max-width: 36rem;
}

.gopoints-bar {
  max-width: 700px;
  margin: 0 auto 1.75rem;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fcd34d;
  border-radius: var(--cf-radius-lg);
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.gp-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.gp-balance {
  font-weight: 800;
  font-size: 1.25rem;
  color: #b45309;
  display: block;
  font-family: var(--cf-display);
  letter-spacing: 0.02em;
}

.gp-pending {
  font-size: 0.75rem;
  color: var(--cf-muted);
  display: block;
}

.gp-tiers {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tier {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--cf-muted);
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.tier.available {
  color: #b45309;
  background: rgba(180, 83, 9, 0.08);
  font-weight: 600;
}

.orders-list {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--cf-line);
  box-shadow: var(--cf-shadow);
  transition: box-shadow 0.2s ease;
}

.order-card:hover {
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

.order-top h3 {
  font-family: var(--cf-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.order-date {
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.status {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.status.delivered {
  background: rgba(16, 185, 129, 0.12);
  color: var(--cf-success);
}

.status.cancelled {
  background: #fef2f2;
  color: var(--cf-danger);
}

.status.active {
  background: #e0f2fe;
  color: #0369a1;
}

.status.pending {
  background: var(--cf-warn-soft);
  color: var(--cf-warn);
}

.order-items {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 0;
  border-top: 1px solid var(--cf-line);
  border-bottom: 1px solid var(--cf-line);
  font-size: 0.875rem;
}

.order-product {
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-total {
  font-family: var(--cf-display);
  font-weight: 700;
  font-size: 1.125rem;
}

.order-meta {
  padding: 0.65rem 0 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.delivery-info {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--cf-muted);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.unrated {
  color: var(--cf-line);
  font-style: italic;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.btn-rate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 0.875rem;
  border: 1px solid #fcd34d;
  border-radius: var(--cf-radius);
  background: #fffbeb;
  font-family: var(--cf-font);
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  color: #92400e;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.btn-rate:hover {
  border-color: #fbbf24;
  background: #fef3c7;
}

.btn-repeat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 0.875rem;
  background: var(--cf-cta);
  color: #fff;
  border-radius: var(--cf-radius);
  font-weight: 600;
  font-size: 0.8125rem;
  border: none;
  cursor: pointer;
  font-family: var(--cf-font);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  transition: background 0.2s ease;
}

.btn-repeat:hover {
  background: var(--cf-cta-hover);
}

.empty-state {
  max-width: 400px;
  margin: 4rem auto;
  text-align: center;
}

.empty-state h3 {
  font-family: var(--cf-display);
  font-size: 1.375rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.btn-new {
  display: inline-block;
  background: var(--cf-cta);
  color: #fff;
  padding: 0.875rem 1.5rem;
  border-radius: var(--cf-radius);
  font-weight: 700;
  font-size: 0.9375rem;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
  transition: background 0.2s ease;
}

.btn-new:hover {
  background: var(--cf-cta-hover);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  padding: 1.75rem;
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--cf-line);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
  text-align: center;
}

.modal-card h3 {
  font-family: var(--cf-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.modal-card p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 1.25rem;
  line-height: 1.45;
}

.star-rating {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
}

.star-btn:focus-visible {
  outline: 2px solid var(--cf-cta);
  outline-offset: 2px;
}

.rating-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #d97706;
  margin-bottom: 1.25rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-modal-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #fff;
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-cancel:hover {
  background: var(--cf-surface);
}

.btn-modal-confirm {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1.25rem;
  background: var(--cf-cta);
  color: #fff;
  border: none;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.btn-modal-confirm:hover:not(:disabled) {
  background: var(--cf-cta-hover);
}

.btn-modal-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.modal-enter-active {
  animation: modalIn 0.25s ease;
}

.modal-leave-active {
  animation: modalOut 0.2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modalOut {
  to {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .gopoints-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
