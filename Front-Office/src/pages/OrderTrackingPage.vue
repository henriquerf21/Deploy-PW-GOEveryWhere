<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />

    <main class="cf-checkout-main tracking-main">
      <header class="track-head">
        <p class="cf-checkout-kicker">Em tempo real</p>
        <h1 class="cf-checkout-title">Acompanhamento</h1>
        <p class="cf-checkout-sub">Estado da encomenda, rota indicativa e contacto do estafeta quando disponível.</p>
      </header>

      <div class="cf-tabs" role="tablist">
        <span class="cf-tab is-active" role="tab" aria-selected="true">Encomenda ativa</span>
        <router-link to="/order/history" class="cf-tab" role="tab">Histórico</router-link>
      </div>

      <div v-if="order" class="tracking-layout">
        <!-- Left: Map -->
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
              :dim-tiles="stateClass === 'in-transit'"
              height="300px"
              aria-label="Mapa da rota entre a loja Continente e a tua morada"
            />
          </div>
          <div class="eta-bar">
            <div>
              <span class="eta-label">Chegada estimada</span>
              <span class="eta-time">~{{ etaDisplay }} min</span>
            </div>
            <span class="transit-badge" :style="{ background: currentStateData?.color + '18', color: currentStateData?.color }">
              {{ currentStateData?.label || 'Processando' }}
            </span>
          </div>
        </div>

        <!-- Right: Order Details -->
        <div class="details-card">
          <div class="order-header">
            <div>
              <h2>#{{ order.id }}</h2>
              <span class="order-items" v-for="item in order.products" :key="item.name">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#00c853" stroke="none"><circle cx="12" cy="12" r="8"/></svg>
                {{ item.name }}
              </span>
            </div>
            <span v-if="order.urgent" class="urgent-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Urgente
            </span>
          </div>

          <!-- Timeline -->
          <div class="timeline">
            <div
              v-for="(step, idx) in timelineSteps"
              :key="step.state"
              class="timeline-step"
              :class="{ done: step.done, active: step.active, future: !step.done && !step.active }"
            >
              <div class="timeline-dot" :class="{ empty: !step.done && !step.active }">
                <svg v-if="step.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="timeline-content">
                <span class="timeline-label">{{ step.label }}</span>
                <span v-if="step.time" class="timeline-time">{{ step.time }}</span>
              </div>
              <div v-if="idx < timelineSteps.length - 1" class="timeline-connector" :class="{ 'done-connector': step.done }"></div>
            </div>
          </div>

          <!-- Driver -->
          <div class="driver-card" v-if="order.estafeta && isEstafetaVisible">
            <div class="driver-avatar">{{ order.estafeta.initials }}</div>
            <div class="driver-info">
              <span class="driver-name">{{ order.estafeta.name }}</span>
              <div class="driver-rating">
                <span>{{ order.estafeta.rating }}</span>
                <svg v-for="s in 5" :key="s" width="12" height="12" viewBox="0 0 24 24" :fill="s <= Math.round(order.estafeta.rating) ? '#f59e0b' : '#e5e7eb'" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <span class="driver-transport">{{ order.estafeta.transport }}</span>
            </div>
            <div class="driver-actions">
              <button class="driver-btn" title="Ligar" aria-label="Ligar ao estafeta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
              <button class="driver-btn" title="Mensagem" aria-label="Enviar mensagem ao estafeta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
          </div>

          <!-- Cancel Button -->
          <button v-if="canCancel" class="btn-cancel" @click="showCancelModal = true">
            Cancelar Encomenda
          </button>

          <!-- Delivered — Rate -->
          <div v-if="order.status === 'S-11'" class="delivered-section">
            <div class="delivered-banner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>A tua encomenda foi entregue com sucesso!</span>
            </div>
            <div class="rate-section">
              <p>Avalia a tua experiência:</p>
              <div class="star-rating">
                <button
                  v-for="s in 5"
                  :key="s"
                  class="star-btn"
                  :class="{ filled: s <= ratingValue }"
                  @click="ratingValue = s"
                  :aria-label="'Avaliar ' + s + ' estrelas'"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" :fill="s <= ratingValue ? '#f59e0b' : 'none'" :stroke="s <= ratingValue ? '#f59e0b' : '#d1d5db'" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
              </div>
              <button class="btn-rate-submit" @click="submitRating" :disabled="ratingValue === 0">
                Enviar Avaliação
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No active order -->
      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <h3>Sem encomenda ativa</h3>
        <p>Quando fizeres uma compra, o estado aparece aqui com a estimativa de chegada.</p>
        <router-link to="/order/select" class="btn-new-order">Nova encomenda</router-link>
        <router-link to="/order/history" class="btn-history-link">Ver histórico</router-link>
      </div>

      <!-- Cancel Modal -->
      <Transition name="modal">
        <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
          <div class="modal-card">
            <h3>Cancelar Encomenda</h3>
            <p>Tens a certeza de que queres cancelar a encomenda <strong>#{{ order?.id }}</strong>?</p>
            <div class="form-group">
              <label for="cancel-reason">Justificação (obrigatória)</label>
              <textarea id="cancel-reason" v-model="cancelJustification" placeholder="Motivo do cancelamento..."></textarea>
            </div>
            <div class="modal-actions">
              <button class="btn-modal-cancel" @click="showCancelModal = false">Voltar</button>
              <button class="btn-modal-confirm" @click="confirmCancel" :disabled="!cancelJustification.trim()">Confirmar Cancelamento</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- State Change Toast -->
      <Transition name="toast">
        <div v-if="toastMessage" class="toast-notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import DeliveryRouteMap from '../components/DeliveryRouteMap.vue';
import { getDestinationLatLng } from '../utils/mapCoords.js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  useOrderStore, ORDER_STATES, advanceOrderState, cancelOrder, completeOrder
} from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const order = computed(() => store.activeOrder);
const showCancelModal = ref(false);
const cancelJustification = ref('');
const ratingValue = ref(0);
const toastMessage = ref('');
let advanceTimer = null;
let toastTimer = null;

const currentStateData = computed(() => {
  if (!order.value) return null;
  return ORDER_STATES[order.value.status] || null;
});

const stateClass = computed(() => {
  if (!order.value) return '';
  const s = order.value.status;
  if (s === 'S-09') return 'in-transit';
  if (s === 'S-10' || s === 'S-11') return 'arrived';
  return '';
});

const routeProgress = computed(() => {
  if (!order.value) return 0;
  const flow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const idx = flow.indexOf(order.value.status);
  if (idx < 0) return 0;
  return Math.min(100, (idx / (flow.length - 1)) * 100);
});

const trackingMapCoords = computed(() => {
  const o = order.value;
  if (!o?.store?.lat || o.store.lng == null) return null;
  const dest = getDestinationLatLng(o.delivery, o.store.lat, o.store.lng);
  return {
    storeLat: o.store.lat,
    storeLng: o.store.lng,
    destLat: dest.lat,
    destLng: dest.lng,
  };
});

const etaDisplay = computed(() => {
  if (!order.value) return '--';
  const flow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const idx = flow.indexOf(order.value.status);
  const remaining = Math.max(0, flow.length - 1 - idx);
  const base = order.value.urgent ? 15 : (order.value.eta || 30);
  return Math.max(1, Math.round(base * (remaining / (flow.length - 1))));
});

const timelineSteps = computed(() => {
  if (!order.value) return [];
  const flow = [
    { state: 'S-01', label: 'Encomenda Submetida' },
    { state: 'S-02', label: 'Em Análise' },
    { state: 'S-05', label: 'Aprovada' },
    { state: 'S-07', label: 'Aceite pelo Estafeta' },
    { state: 'S-08', label: 'Em Recolha' },
    { state: 'S-09', label: 'Em Trânsito' },
    { state: 'S-10', label: 'No Destino' },
    { state: 'S-11', label: 'Entregue' },
  ];
  const currentFlow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const currentIdx = currentFlow.indexOf(order.value.status);

  return flow.map((step) => {
    const stepIdx = currentFlow.indexOf(step.state);
    const timelineEntry = order.value.timeline?.find(t => t.state === step.state);
    return {
      ...step,
      done: stepIdx <= currentIdx && stepIdx >= 0 && step.state !== order.value.status,
      active: step.state === order.value.status,
      time: timelineEntry ? new Date(timelineEntry.time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : null,
    };
  });
});

const isEstafetaVisible = computed(() => {
  if (!order.value) return false;
  return ['S-07','S-08','S-09','S-10','S-11'].includes(order.value.status);
});

const canCancel = computed(() => {
  if (!order.value) return false;
  return ['S-01','S-02','S-03','S-05','S-06'].includes(order.value.status);
});

function showStateToast(newState) {
  const data = ORDER_STATES[newState];
  if (data) {
    toastMessage.value = data.label;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastMessage.value = ''; }, 3000);
  }
}

function startAutoAdvance() {
  advanceTimer = setInterval(() => {
    if (order.value && !ORDER_STATES[order.value.status]?.terminal) {
      const next = advanceOrderState();
      if (next) showStateToast(next);
      if (!next || ORDER_STATES[next]?.terminal) clearInterval(advanceTimer);
    } else {
      clearInterval(advanceTimer);
    }
  }, 4000);
}

function confirmCancel() {
  if (cancelJustification.value.trim()) {
    cancelOrder(cancelJustification.value);
    showCancelModal.value = false;
    showStateToast('S-13');
  }
}

function submitRating() {
  if (ratingValue.value > 0) {
    completeOrder(ratingValue.value);
    router.push('/order/history');
  }
}

onMounted(() => { if (order.value) startAutoAdvance(); });
onUnmounted(() => { clearInterval(advanceTimer); clearTimeout(toastTimer); });
</script>

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
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--cf-ink);
  color: #fff;
  padding: 0.875rem 1.25rem;
  border-radius: var(--cf-radius);
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 999;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
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
