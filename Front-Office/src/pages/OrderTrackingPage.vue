<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import DeliveryRouteMap from '../components/DeliveryRouteMap.vue';
import { getDestinationLatLng } from '../utils/mapCoords.js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore, ORDER_STATES, fetchUserOrders } from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const order = computed(() => store.activeOrder);
const showCancelModal = ref(false);
const cancelJustification = ref('');
const ratingValue = ref(0);
const toastMessage = ref('');
let pollingTimer = null;

// ── CICLO DE VIDA ──────────────────────────────────────────────────
onMounted(async () => {
  // 1. Carrega dados imediatamente ao entrar
  await fetchUserOrders();
  
  // 2. POLLING: Verifica o Strapi a cada 5 segundos (Requisito RNF04)
  pollingTimer = setInterval(async () => {
    if (order.value && !ORDER_STATES[order.value.status]?.terminal) {
      const oldStatus = order.value.status;
      await fetchUserOrders();
      
      if (order.value && order.value.status !== oldStatus) {
        showStateToast(order.value.status);
      }
    }
  }, 5000);
});

onUnmounted(() => {
  clearInterval(pollingTimer);
});

// ── COMPUTED ────────────────────────────────────────────────────────
const currentStateData = computed(() => order.value ? ORDER_STATES[order.value.status] : null);

const stateClass = computed(() => {
  if (!order.value) return '';
  const s = order.value.status;
  if (s === 'S-09') return 'in-transit';
  if (['S-10', 'S-11'].includes(s)) return 'arrived';
  return '';
});

const routeProgress = computed(() => {
  if (!order.value) return 0;
  const flow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const idx = flow.indexOf(order.value.status);
  return idx < 0 ? 0 : Math.min(100, (idx / (flow.length - 1)) * 100);
});

const trackingMapCoords = computed(() => {
  const o = order.value;
  if (!o) return null;
  // Fallback para Braga se a loja não tiver coordenadas
  const storeLat = o.store?.lat || 41.5518;
  const storeLng = o.store?.lng || -8.4229;
  const dest = getDestinationLatLng(o.delivery || {}, storeLat, storeLng);
  return { storeLat, storeLng, destLat: dest.lat, destLng: dest.lng };
});

const timelineSteps = computed(() => {
  if (!order.value) return [];
  const flow = [
    { state: 'S-01', label: 'Enviada' },
    { state: 'S-02', label: 'Em Análise' },
    { state: 'S-05', label: 'Aprovada' },
    { state: 'S-07', label: 'Estafeta a caminho' },
    { state: 'S-08', label: 'Em Recolha' },
    { state: 'S-09', label: 'Em Trânsito' },
    { state: 'S-11', label: 'Entregue' },
  ];
  const currentFlow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const currentIdx = currentFlow.indexOf(order.value.status);

  return flow.map((step) => {
    const stepIdx = currentFlow.indexOf(step.state);
    return {
      ...step,
      done: stepIdx < currentIdx && stepIdx >= 0,
      active: step.state === order.value.status
    };
  });
});

// ── MÉTODOS ────────────────────────────────────────────────────────
function showStateToast(newState) {
  const data = ORDER_STATES[newState];
  if (data) {
    toastMessage.value = `Nova atualização: ${data.label}`;
    setTimeout(() => { toastMessage.value = ''; }, 3000);
  }
}

function submitRating() {
  // Aqui chamarias a função do store para gravar no Strapi
  router.push('/order/history');
}
</script>

<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />

    <main class="cf-checkout-main tracking-main">
      <header class="track-head">
        <p class="cf-checkout-kicker">Em tempo real</p>
        <h1 class="cf-checkout-title">Acompanhamento</h1>
      </header>

      <div class="cf-tabs" role="tablist">
        <span class="cf-tab is-active" role="tab" aria-selected="true">Encomenda ativa</span>
        <router-link to="/order/history" class="cf-tab" role="tab">Histórico</router-link>
      </div>

      <div v-if="order" class="tracking-layout">
        <div class="map-card">
          <div class="map-leaflet-host" :class="stateClass">
            <DeliveryRouteMap
              v-if="trackingMapCoords"
              :key="order.id"
              :store-lat="trackingMapCoords.storeLat"
              :store-lng="trackingMapCoords.storeLng"
              :dest-lat="trackingMapCoords.destLat"
              :dest-lng="trackingMapCoords.destLng"
              :courier-progress="routeProgress"
              height="300px"
            />
          </div>
          <div class="eta-bar">
            <span class="transit-badge" :style="{ background: currentStateData?.color + '18', color: currentStateData?.color }">
              {{ currentStateData?.label }}
            </span>
          </div>
        </div>

        <div class="details-card">
          <div class="order-header">
            <h3>Encomenda #{{ order.id.substring(0, 8) }}</h3>
            <div class="order-items-list">
              <span v-for="item in order.products" :key="item.name" class="order-items">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981" style="margin-right:8px"><circle cx="12" cy="12" r="8"/></svg>
                {{ item.qty }}x {{ item.name }}
              </span>
            </div>
          </div>

          <div class="timeline">
            <div v-for="step in timelineSteps" :key="step.state" 
                 class="timeline-step" :class="{ done: step.done, active: step.active }">
              <div class="timeline-dot">
                <svg v-if="step.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span class="timeline-label">{{ step.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h3>Sem encomenda ativa</h3>
        <p>Não tens nenhuma entrega a decorrer neste momento.</p>
        <router-link to="/order/select" class="btn-new-order">Fazer nova encomenda</router-link>
      </div>
    </main>
    <SiteFooter />

    <Transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tracking-main {
  padding-bottom: 3rem;
}

.track-head {
  margin-bottom: 1.5rem;
  max-width: 36rem;
}

.tracking-layout {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.map-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  overflow: hidden;
  border: 1px solid var(--cf-line);
  box-shadow: var(--cf-shadow);
}

.map-leaflet-host {
  min-height: 280px;
  position: relative;
}

.map-leaflet-host.in-transit {
  box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.35);
}

.map-leaflet-host.arrived {
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.35);
}

.eta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--cf-line);
}

.eta-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cf-muted);
}

.eta-time {
  display: block;
  font-family: var(--cf-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.transit-badge {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
}

.details-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  padding: 1.75rem;
  border: 1px solid var(--cf-line);
  box-shadow: var(--cf-shadow);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.order-header h2 {
  font-family: var(--cf-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.order-items {
  font-size: 0.8125rem;
  color: var(--cf-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.urgent-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--cf-warn-soft);
  color: var(--cf-warn);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.timeline {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.timeline-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  position: relative;
  font-size: 0.875rem;
  color: var(--cf-muted);
}

.timeline-step.done {
  color: var(--cf-success);
  font-weight: 500;
}

.timeline-step.active {
  color: var(--cf-ink);
  font-weight: 600;
}

.timeline-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--cf-line);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.timeline-step.done .timeline-dot {
  background: var(--cf-success);
}

.timeline-step.active .timeline-dot {
  background: var(--cf-cta);
  box-shadow: 0 0 0 4px var(--cf-cta-soft);
}

.timeline-dot.empty {
  background: #e2e8f0;
}

.timeline-content {
  display: flex;
  flex-direction: column;
}

.timeline-time {
  font-size: 0.6875rem;
  color: var(--cf-muted);
}

.timeline-connector {
  position: absolute;
  left: 12px;
  top: 36px;
  width: 2px;
  height: 20px;
  background: var(--cf-line);
}

.done-connector {
  background: var(--cf-success);
}

.driver-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.driver-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--cf-cta);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.driver-info {
  flex: 1;
  min-width: 0;
}

.driver-name {
  font-weight: 700;
  font-size: 0.9375rem;
}

.driver-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8125rem;
  color: var(--cf-muted);
}

.driver-transport {
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.driver-actions {
  display: flex;
  gap: 8px;
}

.driver-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--cf-line);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cf-ink);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.driver-btn:hover {
  border-color: var(--cf-cta);
  background: var(--cf-cta-soft);
  color: var(--cf-cta-hover);
}

.btn-cancel {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid var(--cf-danger);
  border-radius: var(--cf-radius);
  background: #fff;
  color: var(--cf-danger);
  font-family: var(--cf-font);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-cancel:hover {
  background: #fef2f2;
}

.delivered-section {
  margin-top: 0.5rem;
}

.delivered-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--cf-success);
  font-size: 0.9375rem;
}

.rate-section {
  text-align: center;
}

.rate-section p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 0.75rem;
}

.star-rating {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1rem;
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

.btn-rate-submit {
  background: var(--cf-cta);
  color: #fff;
  border: none;
  padding: 0.75rem 1.75rem;
  border-radius: var(--cf-radius);
  font-weight: 700;
  font-family: var(--cf-font);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
  transition: background 0.2s ease;
}

.btn-rate-submit:hover:not(:disabled) {
  background: var(--cf-cta-hover);
}

.btn-rate-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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

.btn-new-order {
  display: block;
  background: var(--cf-cta);
  color: #fff;
  padding: 0.875rem 1.5rem;
  border-radius: var(--cf-radius);
  font-weight: 700;
  font-size: 0.9375rem;
  text-decoration: none;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
  transition: background 0.2s ease;
}

.btn-new-order:hover {
  background: var(--cf-cta-hover);
}

.btn-history-link {
  display: block;
  color: var(--cf-muted);
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
}

.btn-history-link:hover {
  color: var(--cf-cta);
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
  max-width: 420px;
  width: 100%;
  border: 1px solid var(--cf-line);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
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
  margin-bottom: 1rem;
  line-height: 1.45;
}

.modal-card .form-group {
  margin-bottom: 1rem;
}

.modal-card .form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.modal-card textarea {
  width: 100%;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  padding: 0.75rem;
  font-family: var(--cf-font);
  font-size: 0.875rem;
  min-height: 5rem;
  outline: none;
  resize: vertical;
}

.modal-card textarea:focus {
  border-color: var(--cf-danger);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-modal-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #fff;
  font-family: var(--cf-font);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-modal-cancel:hover {
  background: var(--cf-surface);
}

.btn-modal-confirm {
  padding: 0.5rem 1rem;
  background: var(--cf-danger);
  color: #fff;
  border: none;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-confirm:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-modal-confirm:disabled {
  opacity: 0.5;
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

.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #1e293b;
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  pointer-events: none;
}

.toast-enter-active {
  animation: toastIn 0.35s ease;
}

.toast-leave-active {
  animation: toastOut 0.25s ease;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastOut {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
}

@media (max-width: 768px) {
  .tracking-layout {
    grid-template-columns: 1fr;
  }
}
</style>
