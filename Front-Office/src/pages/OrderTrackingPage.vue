<template>
  <div class="page-wrapper">
    <SiteHeader />

    <main class="tracking-main">
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active">Encomenda Ativa</button>
        <router-link to="/order/history" class="tab">Histórico</router-link>
      </div>

      <div v-if="order" class="tracking-layout">
        <!-- Left: Map -->
        <div class="map-card">
          <div class="map-placeholder" :class="stateClass">
            <div class="map-visual">
              <div class="map-pin-store">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><rect x="2" y="7" width="20" height="5"/></svg>
                <small>{{ order.store?.name?.replace('Continente ', '') || 'Loja' }}</small>
              </div>
              <div class="map-route-animated">
                <div class="route-line" :style="{ width: routeProgress + '%' }"></div>
                <div class="delivery-icon" :style="{ left: routeProgress + '%' }">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
              </div>
              <div class="map-pin-dest">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <small>Destino</small>
              </div>
            </div>
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
        <p>Não tens nenhuma encomenda em curso no momento.</p>
        <router-link to="/order/select" class="btn-new-order">Fazer Nova Encomenda</router-link>
        <router-link to="/order/history" class="btn-history-link">Ver Histórico →</router-link>
      </div>

      <!-- Cancel Modal -->
      <Transition name="modal">
        <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
          <div class="modal-card">
            <h3>Cancelar Encomenda</h3>
            <p>Tem a certeza que deseja cancelar a encomenda <strong>#{{ order?.id }}</strong>?</p>
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

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand"><span class="footer-logo">G</span><span>GoEverywhere</span></div>
        <p class="copyright">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
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
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: #f6f7f7; color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

.site-header { background: rgba(255,255,255,0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; padding: 14px 32px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111827; transition: opacity 0.2s; }
.logo:hover { opacity: 0.8; }
.logo-img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; }
.logo-text { font-family: 'Lora', serif; font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }

.tracking-main { flex: 1; padding: 32px; animation: contentIn 0.5s ease-out; }
@keyframes contentIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.tabs { display: flex; gap: 0; max-width: 1000px; margin: 0 auto 28px; background: #e5e7eb; border-radius: 12px; padding: 4px; }
.tab { flex: 1; padding: 12px; text-align: center; border: none; background: transparent; font-family: 'Raleway', sans-serif; font-weight: 600; font-size: 14px; color: #6b7280; cursor: pointer; border-radius: 10px; text-decoration: none; transition: all 0.25s ease; }
.tab.active { background: #fff; color: #111827; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.tab:hover:not(.active) { color: #374151; }

.tracking-layout { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start; }

/* Map */
.map-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.03); }
.map-placeholder { background: linear-gradient(145deg, #e8f5e9, #c8e6c9); height: 320px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; transition: background 1s; }
.map-placeholder.in-transit { background: linear-gradient(145deg, #e3f2fd, #bbdefb); animation: transitPulse 3s ease-in-out infinite; }
.map-placeholder.arrived { background: linear-gradient(145deg, #e8f5e9, #a5d6a7); }
@keyframes transitPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }

.map-visual { display: flex; align-items: center; justify-content: center; gap: 0; width: 85%; }
.map-pin-store, .map-pin-dest { display: flex; flex-direction: column; align-items: center; gap: 6px; background: rgba(255,255,255,0.95); border-radius: 14px; padding: 12px 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); z-index: 2; }
.map-pin-store small, .map-pin-dest small { font-size: 11px; font-weight: 700; color: #374151; }

.map-route-animated { flex: 1; height: 4px; background: #d1d5db; position: relative; margin: 0 8px; border-radius: 2px; }
.route-line { position: absolute; left: 0; top: 0; height: 100%; background: #00c853; border-radius: 2px; transition: width 1s ease; }
.delivery-icon { position: absolute; top: -16px; transition: left 1s ease; transform: translateX(-50%); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }

.eta-bar { display: flex; justify-content: space-between; align-items: center; padding: 22px 26px; }
.eta-label { display: block; font-size: 13px; color: #6b7280; font-weight: 500; }
.eta-time { display: block; font-family: 'Lora', serif; font-size: 26px; font-weight: 700; }
.transit-badge { padding: 6px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; transition: all 0.3s; }

/* Details */
.details-card { background: #fff; border-radius: 20px; padding: 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.03); }
.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.order-header h2 { font-family: 'Lora', serif; font-size: 20px; font-weight: 700; }
.order-items { font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.urgent-badge { display: flex; align-items: center; gap: 6px; background: #fff3e0; color: #e65100; padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 12px; white-space: nowrap; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0; margin-bottom: 24px; }
.timeline-step { display: flex; align-items: center; gap: 14px; padding: 10px 0; position: relative; font-size: 14px; color: #9ca3af; }
.timeline-step.done { color: #059669; font-weight: 500; }
.timeline-step.active { color: #111827; font-weight: 600; }
.timeline-dot { width: 26px; height: 26px; border-radius: 50%; background: #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s; }
.timeline-step.done .timeline-dot { background: #059669; }
.timeline-step.active .timeline-dot { background: #00c853; box-shadow: 0 0 0 6px rgba(0,200,83,0.15); animation: pulse 2s ease-in-out infinite; }
.timeline-dot.empty { background: #e5e7eb; }
.timeline-content { display: flex; flex-direction: column; }
.timeline-label { font-size: 14px; }
.timeline-time { font-size: 11px; color: #9ca3af; font-weight: 400; }
.timeline-connector { position: absolute; left: 12px; top: 36px; width: 2px; height: 20px; background: #e5e7eb; }
.done-connector { background: #059669; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(0,200,83,0.15); } 50% { box-shadow: 0 0 0 8px rgba(0,200,83,0.08); } }

/* Driver */
.driver-card { display: flex; align-items: center; gap: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; margin-bottom: 16px; animation: fadeIn 0.4s ease; }
.driver-avatar { width: 48px; height: 48px; border-radius: 50%; background: #00c853; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
.driver-info { flex: 1; }
.driver-name { font-weight: 700; font-size: 15px; display: block; }
.driver-rating { display: flex; align-items: center; gap: 3px; font-size: 13px; color: #6b7280; }
.driver-transport { font-size: 12px; color: #9ca3af; }
.driver-actions { display: flex; gap: 8px; }
.driver-btn { width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; color: #374151; }
.driver-btn:hover { border-color: #00c853; background: #f0fdf4; color: #00c853; }

/* Cancel */
.btn-cancel { width: 100%; padding: 14px; border: 2px solid #ef4444; border-radius: 14px; background: #fff; color: #ef4444; font-family: 'Raleway', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.25s ease; }
.btn-cancel:hover { background: #fef2f2; }

/* Delivered */
.delivered-section { animation: fadeIn 0.5s ease; }
.delivered-banner { display: flex; align-items: center; gap: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 18px; font-weight: 600; color: #059669; font-size: 15px; }
.rate-section { text-align: center; }
.rate-section p { font-size: 14px; color: #6b7280; margin-bottom: 14px; }
.star-rating { display: flex; justify-content: center; gap: 8px; margin-bottom: 18px; }
.star-btn { background: none; border: none; cursor: pointer; transition: transform 0.2s ease; padding: 4px; }
.star-btn.filled { transform: scale(1.15); }
.star-btn:hover { transform: scale(1.25); }
.btn-rate-submit { background: #00c853; color: #fff; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 700; font-family: 'Raleway', sans-serif; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 12px rgba(0,200,83,0.25); }
.btn-rate-submit:hover:not(:disabled) { background: #00b048; }
.btn-rate-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* Empty State */
.empty-state { max-width: 400px; margin: 80px auto; text-align: center; }
.empty-state h3 { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; margin: 16px 0 8px; }
.empty-state p { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
.btn-new-order { display: block; background: #00c853; color: #fff; padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.25s ease; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(0,200,83,0.25); }
.btn-new-order:hover { background: #00b048; transform: translateY(-1px); }
.btn-history-link { display: block; color: #6b7280; font-weight: 600; font-size: 14px; text-decoration: none; transition: color 0.2s; }
.btn-history-link:hover { color: #00c853; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-card { background: #fff; border-radius: 20px; padding: 32px; max-width: 440px; width: 90%; box-shadow: 0 16px 48px rgba(0,0,0,0.15); }
.modal-card h3 { font-family: 'Lora', serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.modal-card p { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
.modal-card .form-group { margin-bottom: 20px; }
.modal-card .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.modal-card textarea { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 12px; font-family: 'Raleway', sans-serif; font-size: 14px; min-height: 80px; outline: none; resize: vertical; transition: border-color 0.25s ease; }
.modal-card textarea:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-modal-cancel { padding: 10px 20px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: #fff; font-family: 'Raleway', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-modal-cancel:hover { background: #f3f4f6; }
.btn-modal-confirm { padding: 10px 20px; background: #ef4444; color: #fff; border: none; border-radius: 10px; font-family: 'Raleway', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.25s ease; }
.btn-modal-confirm:hover:not(:disabled) { background: #dc2626; }
.btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalOut 0.2s ease; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes modalOut { from { opacity: 1; } to { opacity: 0; } }

/* Toast */
.toast-notification { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #059669; color: #fff; padding: 14px 24px; border-radius: 14px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 999; }
.toast-enter-active { animation: toastIn 0.4s ease; }
.toast-leave-active { animation: toastOut 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes toastOut { from { opacity: 1; } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }

.site-footer { background: #111827; color: #fff; padding: 32px; }
.footer-inner { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-family: 'Lora', serif; }
.footer-logo { width: 34px; height: 34px; border-radius: 10px; background: #00c853; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.copyright { font-size: 13px; color: #9ca3af; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .tracking-layout { grid-template-columns: 1fr; }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
}
</style>
