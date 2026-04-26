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
          <div class="map-leaflet-host">
            <DeliveryRouteMap
              v-if="trackingMapCoords"
              :key="order.id"
              :store-lat="trackingMapCoords.storeLat"
              :store-lng="trackingMapCoords.storeLng"
              :dest-lat="trackingMapCoords.destLat"
              :dest-lng="trackingMapCoords.destLng"
              :courier-progress="displayProgress"
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
            <h3>Encomenda #{{ order.id }}</h3>
            <div class="order-items-list">
              <span v-for="item in order.products" :key="item.name" class="order-items">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981" style="margin-right:8px"><circle cx="12" cy="12" r="8"/></svg>
                {{ item.qty }}x {{ item.name }}
              </span>
            </div>
          </div>

          <div class="timeline">
            <div v-for="step in timelineSteps" :key="step.state" 
                 class="timeline-step" :class="{ done: step.done, active: step.active, skipped: step.skipped }">
              <div class="timeline-dot">
                <svg v-if="step.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else-if="step.skipped" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="3">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span class="timeline-label" :class="{ 'label-skipped': step.skipped }">{{ step.label }}</span>
            </div>
          </div>

          <!-- S-03: Info Adicional Solicitada — Alerta + Resposta -->
          <div v-if="order.status === 'S-03'" class="s03-card">
            <div class="s03-header">
              <div class="s03-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h4 class="s03-title">Informação Adicional Solicitada</h4>
                <p class="s03-subtitle">O administrador precisa de esclarecimentos sobre o teu pedido.</p>
              </div>
            </div>

            <div v-if="order.adminMessage" class="s03-message">
              <span class="s03-message-label">Mensagem do Admin:</span>
              <p class="s03-message-text">{{ order.adminMessage }}</p>
            </div>

            <div v-if="s03Sent" class="s03-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Resposta enviada com sucesso! O pedido voltou para análise.</span>
            </div>

            <div v-else class="s03-reply-form">
              <label for="s03-reply" class="s03-reply-label">A tua resposta</label>
              <textarea
                id="s03-reply"
                v-model="s03ReplyText"
                class="s03-textarea"
                placeholder="Explica o que o admin pediu (ex: confirmar morada, nº de porta, etc.)"
                rows="3"
              ></textarea>
              <div class="s03-reply-actions">
                <span class="s03-char-count" :class="{ 'min-reached': s03ReplyText.trim().length >= 10 }">
                  {{ s03ReplyText.trim().length }} / mín. 10 caracteres
                </span>
                <button
                  class="s03-btn-send"
                  :disabled="s03ReplyText.trim().length < 10 || s03Sending"
                  @click="submitS03Reply"
                >
                  {{ s03Sending ? 'A enviar...' : 'Enviar Resposta' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Botão de cancelamento — só aparece nos estados S-01 a S-06 -->
          <div v-if="['S-01', 'S-02', 'S-03', 'S-05', 'S-06'].includes(order.status)" class="cancel-zone">
            <button class="btn-cancel-active" @click="openCancelModal(order)">
              Cancelar Pedido
            </button>
            <p class="cancel-hint">Podes cancelar enquanto o pedido não for aceite por um estafeta.</p>
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

    <!-- Modal de Cancelamento (S-13) -->
    <div v-if="showCancelModal" class="modal-overlay">
      <div class="modal-card cancel-modal">
        <h3>Cancelar Encomenda</h3>
        <p>Indica o motivo do cancelamento (obrigatório):</p>
        <textarea
          v-model="cancelReasonInput"
          placeholder="Ex: Enganei-me na morada ou nos itens..."
          class="cancel-textarea"
        ></textarea>
        <div class="modal-btns">
          <button @click="showCancelModal = false" class="btn-back">Voltar</button>
          <button
            @click="confirmOrderCancellation"
            :disabled="cancelReasonInput.trim().length < 5 || cancelling"
            class="btn-confirm-cancel"
          >
            {{ cancelling ? 'A cancelar encomenda...' : 'Confirmar Cancelamento' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Sucesso pós-cancelamento -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-card success-modal">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h3>Encomenda Cancelada</h3>
        <p>A tua encomenda foi cancelada com sucesso.</p>
        <div class="modal-btns success-btns">
          <button @click="goToHistory" class="btn-history">
            Ver Histórico
          </button>
          <button @click="goToNewOrder" class="btn-reorder">
            Encomendar Novamente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import DeliveryRouteMap from '../components/DeliveryRouteMap.vue';
import { getDestinationLatLng } from '../utils/mapCoords.js';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore, ORDER_STATES, fetchUserOrders, cancelActiveOrder, replyToInfoRequest } from '../stores/orderStore.js';
import { requestNotificationPermission, notifyOrderStateChange } from '../utils/notifications.js';

const router = useRouter();
const store = useOrderStore();

const order = computed(() => store.activeOrder);
const toastMessage = ref('');
let pollingTimer = null;

// --- Cancelamento (S-13) ---
const showCancelModal = ref(false);
const orderToCancel = ref(null);
const cancelReasonInput = ref('');
const cancelling = ref(false);
const showSuccessModal = ref(false);

// --- S-03: Info Adicional Solicitada ---
const s03ReplyText = ref('');
const s03Sending = ref(false);
const s03Sent = ref(false);

async function submitS03Reply() {
  if (!order.value || s03ReplyText.value.trim().length < 10) return;
  s03Sending.value = true;
  const result = await replyToInfoRequest(order.value.documentId, s03ReplyText.value.trim());
  if (result.success) {
    s03Sent.value = true;
    s03ReplyText.value = '';
    showStateToast('S-02');
  } else {
    alert(`Erro: ${result.error}`);
  }
  s03Sending.value = false;
}

function openCancelModal(o) {
  orderToCancel.value = o;
  cancelReasonInput.value = '';
  showCancelModal.value = true;
}

async function confirmOrderCancellation() {
  if (!orderToCancel.value || cancelReasonInput.value.trim().length < 5) return;
  cancelling.value = true;
  const result = await cancelActiveOrder(orderToCancel.value.documentId, cancelReasonInput.value);
  if (result.success) {
    showCancelModal.value = false;
    cancelReasonInput.value = '';
    showSuccessModal.value = true;
  } else {
    alert(`Erro: ${result.error}`);
  }
  cancelling.value = false;
}

function goToHistory() {
  showSuccessModal.value = false;
  router.push('/order/history');
}

function goToNewOrder() {
  showSuccessModal.value = false;
  router.push('/order/select');
}

// ── CICLO DE VIDA ──────────────────────────────────────────────────
onMounted(async () => {
  // RF13: Pedir permissão para notificações do browser
  requestNotificationPermission();

  await fetchUserOrders();
  pollingTimer = setInterval(async () => {
    if (order.value && !ORDER_STATES[order.value.status]?.terminal) {
      const oldStatus = order.value.status;
      await fetchUserOrders();
      if (order.value && order.value.status !== oldStatus) {
        showStateToast(order.value.status);
        // RF13: Notificação nativa do browser em cada mudança de estado
        notifyOrderStateChange(order.value.id, order.value.status, ORDER_STATES[order.value.status]);
      }
    }
  }, 10000); // RNF02: Atualização a cada 10 segundos
});

onUnmounted(() => {
  clearInterval(pollingTimer);
});

// ── COMPUTED ────────────────────────────────────────────────────────
const currentStateData = computed(() => order.value ? ORDER_STATES[order.value.status] : null);

const routeProgress = computed(() => {
  if (!order.value) return 0;
  const flow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const idx = flow.indexOf(order.value.status);
  return idx < 0 ? 0 : Math.min(100, (idx / (flow.length - 1)) * 100);
});

// --- Animação Fluida do Estafeta (RF08) ---
const displayProgress = ref(0);
let animationFrame = null;

watch(routeProgress, (newVal) => {
  const start = displayProgress.value;
  const end = newVal;
  
  if (start === end) return;
  
  // Se for o primeiro carregamento ou voltar ao início, salta diretamente sem animar desde o 0 de forma visível
  if (start === 0 && end > 0 && !animationFrame) {
    displayProgress.value = end;
    return;
  }
  
  const startTime = performance.now();
  const duration = 2500; // 2.5s de animação fluida para a nova posição
  
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  function animate(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);
    // easeInOutQuad
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    displayProgress.value = start + (end - start) * ease;
    
    if (t < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
  animationFrame = requestAnimationFrame(animate);
}, { immediate: true });

const trackingMapCoords = computed(() => {
  const o = order.value;
  if (!o) return null;

  // Usar coordenadas reais guardadas na submissão da encomenda
  const dc = o.deliveryCoords;
  if (dc?.storeLat && dc?.storeLng && dc?.destLat && dc?.destLng) {
    return {
      storeLat: dc.storeLat,
      storeLng: dc.storeLng,
      destLat: dc.destLat,
      destLng: dc.destLng,
    };
  }

  // Fallback para encomendas antigas sem coordenadas guardadas
  const storeLat = 41.5518;
  const storeLng = -8.4229;
  const dest = getDestinationLatLng(o.delivery || {}, storeLat, storeLng);
  return { storeLat, storeLng, destLat: dest.lat, destLng: dest.lng };
});

const timelineSteps = computed(() => {
  if (!order.value) return [];

  // S-03 só aparece como concluído se a encomenda realmente passou por Info Solicitada
  const s03WasTriggered = !!order.value.adminMessage;

  const flow = [
    { state: 'S-01', label: 'Pedido Recebido', optional: false },
    { state: 'S-02', label: 'Em Análise', optional: false },
    { state: 'S-03', label: 'Info Solicitada', optional: true, triggered: s03WasTriggered },
    { state: 'S-05', label: 'Aprovada', optional: false },
    { state: 'S-07', label: 'Preparação', optional: false },
    { state: 'S-09', label: 'Em Trânsito', optional: false },
    { state: 'S-11', label: 'Entregue', optional: false },
  ];
  const currentFlow = ['S-01','S-02','S-03','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const currentIdx = currentFlow.indexOf(order.value.status);

  return flow.map((step) => {
    const stepIdx = currentFlow.indexOf(step.state);
    const isPast = stepIdx < currentIdx && stepIdx !== -1;

    // Etapa opcional não acionada e já ultrapassada = skipped
    if (step.optional && !step.triggered && isPast) {
      return { ...step, done: false, active: false, skipped: true };
    }

    return {
      ...step,
      done: isPast,
      active: step.state === order.value.status,
      skipped: false,
    };
  });
});

// ── MÉTODOS ────────────────────────────────────────────────────────
function showStateToast(newState) {
  const data = ORDER_STATES[newState];
  if (data) {
    toastMessage.value = `Atualização: ${data.label}`;
    setTimeout(() => { toastMessage.value = ''; }, 3000);
  }
}
</script>


<style scoped>
.success-modal {
  text-align: center;
}

.success-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.success-btns {
  flex-direction: column;
  gap: 0.5rem;
}

.btn-history {
  background: var(--cf-card);
  color: var(--cf-muted);
  border: 1px solid var(--cf-line);
  padding: 0.75rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.btn-history:hover {
  background: var(--cf-surface);
}

.btn-reorder {
  background: var(--cf-cta);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.btn-reorder:hover {
  background: var(--cf-cta-hover);
}

.cancel-zone {
  margin-top: 2rem;
  text-align: center;
  padding: 1.5rem;
  border-top: 1px dashed var(--cf-line);
}

.btn-cancel-active {
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-active:hover {
  background: #fef2f2;
  transform: translateY(-2px);
}

.cancel-hint {
  font-size: 0.8rem;
  color: var(--cf-muted);
  margin-top: 0.5rem;
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
}

.cancel-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: inherit;
  resize: none;
}

.modal-btns {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.btn-back {
  background: var(--cf-card);
  color: var(--cf-muted);
  border: 1px solid var(--cf-line);
  padding: 0.5rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-back:hover {
  background: var(--cf-surface);
}

.btn-confirm-cancel {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}




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

.timeline-step.skipped .timeline-dot {
  background: #e2e8f0;
  border: 1.5px dashed #cbd5e1;
}

.timeline-step.skipped {
  color: #cbd5e1;
}

.label-skipped {
  text-decoration: line-through;
  color: #cbd5e1;
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

/* ══════════════════════════════════════════
   S-03: INFO ADICIONAL SOLICITADA
   ══════════════════════════════════════════ */
.s03-card {
  margin-top: 1.5rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: var(--cf-radius-lg);
  padding: 1.5rem;
  animation: s03FadeIn 0.4s ease;
}

@keyframes s03FadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.s03-header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.s03-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.s03-title {
  margin: 0;
  font-family: var(--cf-display);
  font-size: 1rem;
  font-weight: 700;
  color: #92400e;
}

.s03-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: #b45309;
  line-height: 1.4;
}

.s03-message {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.s03-message-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400e;
  margin-bottom: 0.4rem;
}

.s03-message-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #78350f;
  font-weight: 500;
}

.s03-success {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.28);
  border-radius: var(--cf-radius);
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
}

.s03-reply-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.s03-reply-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #92400e;
}

.s03-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem 1rem;
  border: 1px solid #fde68a;
  border-radius: var(--cf-radius);
  background: #fff;
  font-family: var(--cf-font);
  font-size: 0.875rem;
  color: var(--cf-ink);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.s03-textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}

.s03-textarea::placeholder {
  color: #d97706;
  opacity: 0.6;
}

.s03-reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.s03-char-count {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 500;
}

.s03-char-count.min-reached {
  color: #059669;
}

.s03-btn-send {
  background: var(--cf-cta);
  color: #fff;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.25);
  transition: background 0.2s ease, opacity 0.2s ease;
}

.s03-btn-send:hover:not(:disabled) {
  background: var(--cf-cta-hover);
}

.s03-btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
