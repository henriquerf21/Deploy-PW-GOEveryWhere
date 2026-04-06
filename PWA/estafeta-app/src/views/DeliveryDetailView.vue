<template>
  <div class="page" v-if="delivery">
    <div class="page-header">
      <button class="back-btn" @click="$router.push('/deliveries')">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h1>{{ delivery.orderId }}</h1>
      <span class="badge" :class="priorityClass">
        <span v-if="delivery.priority === 5" class="p-icon" v-html="SVG.flame"></span>
        P{{ delivery.priority }}
      </span>
    </div>

    <!-- Status Stepper -->
    <div class="stepper-section">
      <StatusStepper :currentState="delivery.state" :timestamps="delivery.timestamps" />
    </div>

    <!-- Timer for E-08: 5 min acceptance -->
    <div v-if="delivery.state === 'E-08'" class="timer-banner">
      <span><span class="timer-icon" v-html="SVG.clock"></span> Tempo para aceitar: <strong>{{ timerDisplay }}</strong></span>
      <button class="btn btn-primary btn-sm" @click="handleAccept">Aceitar</button>
    </div>

    <!-- CTA Button -->
    <div class="cta-section" v-if="ctaLabel && delivery.state !== 'E-08'">
      <button class="btn btn-primary btn-block btn-lg cta-btn" @click="handleCTA">
        <span v-html="stateIcon"></span> {{ ctaLabel }}
      </button>
      <button
        v-if="canMarkImpossible"
        class="btn btn-danger btn-block"
        style="margin-top:8px"
        @click="showImpossible = true"
      >
        <span v-html="SVG.xCircle"></span> Entrega Impossível
      </button>
    </div>

    <!-- Mapa do caminho -->
    <div class="section card">
      <div class="section-title"><span class="s-icon" v-html="SVG.road"></span> Mapa do Caminho</div>
      <div ref="routeMapEl" class="route-map"></div>
      <div class="route-actions">
        <a :href="wazeRouteFull" target="_blank" rel="noopener" class="btn btn-primary btn-block">
          <span v-html="SVG.navigation"></span> Abrir Rota Completa no Waze
        </a>
      </div>
    </div>

    <!-- Map / Locations -->
    <div class="section card">
      <div class="section-title"><span class="s-icon" v-html="SVG.mapPin"></span> Localizações</div>
      <div class="loc-block">
        <div class="loc-label">RECOLHA</div>
        <div class="loc-name">{{ delivery.pickup.name }}</div>
        <div class="loc-address">{{ delivery.pickup.address }}</div>
        <a :href="wazePickup" target="_blank" rel="noopener" class="waze-btn">
          <span v-html="SVG.navigation"></span> Abrir no Waze
        </a>
      </div>
      <div class="loc-divider"></div>
      <div class="loc-block">
        <div class="loc-label">ENTREGA</div>
        <div class="loc-name">{{ delivery.destination.name }}</div>
        <div class="loc-address">{{ delivery.destination.address }}</div>
        <a :href="wazeDest" target="_blank" rel="noopener" class="waze-btn">
          <span v-html="SVG.navigation"></span> Abrir no Waze
        </a>
      </div>
    </div>

    <!-- Client info -->
    <div class="section card">
      <div class="section-title"><span class="s-icon" v-html="SVG.user"></span> Cliente</div>
      <div class="client-row">
        <div>
          <div class="client-name">{{ delivery.destination.name }}</div>
          <div class="client-phone">{{ delivery.destination.phone }}</div>
        </div>
        <div class="client-actions">
          <a :href="'tel:' + delivery.destination.phone" class="action-circle"><span v-html="SVG.phone"></span></a>
          <a :href="'sms:' + delivery.destination.phone" class="action-circle"><span v-html="SVG.message"></span></a>
        </div>
      </div>
    </div>

    <!-- Order items -->
    <div class="section card">
      <div class="section-title"><span class="s-icon" v-html="SVG.package"></span> Encomenda</div>
      <div v-for="item in delivery.items" :key="item.name" class="item-row">
        <span class="item-name">{{ item.name }}</span>
        <span class="item-qty">{{ item.qty }} {{ item.unit }}</span>
      </div>
      <div class="item-meta">
        <span>Peso: {{ delivery.weight }}</span>
        <span>Tamanho: {{ delivery.size }}</span>
      </div>
    </div>

    <!-- Instructions -->
    <div v-if="delivery.instructions" class="section card">
      <div class="section-title"><span class="s-icon" v-html="SVG.fileText"></span> Instruções Especiais</div>
      <p class="instructions-text">{{ delivery.instructions }}</p>
    </div>

    <!-- Time log -->
    <div class="section card">
      <div class="section-title"><span class="s-icon" v-html="SVG.clock"></span> Registo de Tempos</div>
      <div class="time-log">
        <div v-for="(ts, state) in delivery.timestamps" :key="state" class="time-row">
          <span class="time-state">{{ deliveryStateLabels[state] }}</span>
          <span class="time-val">{{ formatTime(ts) }}</span>
        </div>
        <div v-if="!Object.keys(delivery.timestamps).length" class="time-empty">Ainda sem registos.</div>
      </div>
    </div>

    <!-- Additional docs button -->
    <div class="section">
      <button class="btn btn-secondary btn-block" @click="$router.push(`/confirm/${delivery.id}`)">
        <span v-html="SVG.paperclip"></span> Documentação Adicional
      </button>
    </div>

    <!-- Impossible delivery modal -->
    <div v-if="showImpossible" class="modal-overlay" @click.self="showImpossible = false">
      <div class="modal-card card">
        <h3>Entrega Impossível</h3>
        <div class="input-group">
          <label>Motivo</label>
          <textarea v-model="impossibleReason" class="input-field" rows="3" placeholder="Descreve o motivo..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showImpossible = false">Cancelar</button>
          <button class="btn btn-danger" @click="handleImpossible">Confirmar</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="page page-body" style="text-align:center; padding-top:80px">
    <p>Entrega não encontrada.</p>
    <button class="btn btn-primary" @click="$router.push('/deliveries')">Voltar</button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  getDeliveryById,
  acceptDelivery,
  advanceDeliveryState,
  markDeliveryImpossible,
  wazeLink,
} from '../stores/courierStore.js';
import {
  DELIVERY_STATE,
  deliveryStateLabels,
  STATE_CTA,
  deliveryStateIcons,
  SVG,
} from '../constants.js';
import { PRIORITY_BADGE_CLASS } from '../constants.js';
import StatusStepper from '../components/StatusStepper.vue';

const props = defineProps({ id: String });
const router = useRouter();
const routeMapEl = ref(null);
let routeMap = null;
let routeLayer = null;
let leaflet = null;

const delivery = computed(() => getDeliveryById(props.id));
const priorityClass = computed(() => PRIORITY_BADGE_CLASS[delivery.value?.priority] || '');
const ctaLabel = computed(() => delivery.value ? STATE_CTA[delivery.value.state] : null);
const stateIcon = computed(() => delivery.value ? (deliveryStateIcons[delivery.value.state] || '') : '');
const canMarkImpossible = computed(() => {
  if (!delivery.value) return false;
  return ['E-09', 'E-10', 'E-11', 'E-12'].includes(delivery.value.state);
});

const wazePickup = computed(() => delivery.value ? wazeLink(delivery.value.pickup.lat, delivery.value.pickup.lng) : '#');
const wazeDest = computed(() => delivery.value ? wazeLink(delivery.value.destination.lat, delivery.value.destination.lng) : '#');
const wazeRouteFull = computed(() => {
  if (!delivery.value) return '#';
  // Waze não suporta bem múltiplos waypoints no deeplink web.
  // Aqui abrimos a próxima perna completa da operação:
  // - antes/recolha: rota para a loja
  // - após recolha: rota para o destino final
  const toPickup = ['E-08', 'E-09', 'E-10'].includes(delivery.value.state);
  return toPickup
    ? wazeLink(delivery.value.pickup.lat, delivery.value.pickup.lng)
    : wazeLink(delivery.value.destination.lat, delivery.value.destination.lng);
});

// 5-min timer
const timerSeconds = ref(300);
let timerInterval = null;
const timerDisplay = computed(() => {
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

onMounted(() => {
  if (delivery.value?.state === DELIVERY_STATE.E08) {
    timerInterval = setInterval(() => {
      timerSeconds.value--;
      if (timerSeconds.value <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }
});

onMounted(async () => {
  await nextTick();
  if (!routeMapEl.value || !delivery.value) return;
  const L = await import('leaflet');
  leaflet = L;
  await import('leaflet/dist/leaflet.css');
  const center = [delivery.value.pickup.lat, delivery.value.pickup.lng];
  routeMap = L.map(routeMapEl.value, { zoomControl: false, attributionControl: false }).setView(center, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(routeMap);
  routeLayer = L.layerGroup().addTo(routeMap);
  renderRouteMap();
  setTimeout(() => routeMap?.invalidateSize(), 160);
});

watch(delivery, () => renderRouteMap(), { deep: true });

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  routeMap?.remove();
  routeMap = null;
  routeLayer = null;
  leaflet = null;
});

function handleAccept() {
  if (timerInterval) clearInterval(timerInterval);
  acceptDelivery(props.id);
}

function handleCTA() {
  if (!delivery.value) return;
  if (delivery.value.state === DELIVERY_STATE.E12) {
    router.push(`/confirm/${props.id}`);
    return;
  }
  advanceDeliveryState(props.id);
}

const showImpossible = ref(false);
const impossibleReason = ref('');

function handleImpossible() {
  if (!impossibleReason.value.trim()) return;
  markDeliveryImpossible(props.id, impossibleReason.value, null);
  showImpossible.value = false;
  router.push('/deliveries');
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function renderRouteMap() {
  if (!delivery.value || !routeMap || !routeLayer || !leaflet) return;
  routeLayer.clearLayers();
  const p = delivery.value.pickup;
  const d = delivery.value.destination;
  if (p?.lat == null || p?.lng == null || d?.lat == null || d?.lng == null) return;

  const isDone = delivery.value.state === DELIVERY_STATE.E13;
  const isFailed = delivery.value.state === DELIVERY_STATE.E14;
  const routeColor = isDone ? '#00c853' : isFailed ? '#ef4444' : '#2563eb';
  const dash = isDone ? null : isFailed ? '4 8' : '10 8';

  routeLayer.addLayer(
    leaflet.polyline([[p.lat, p.lng], [d.lat, d.lng]], {
      color: routeColor, weight: 5, opacity: 0.92, dashArray: dash,
    }).bindPopup(`<strong>${delivery.value.orderId}</strong><br/>Rota de entrega`)
  );
  routeLayer.addLayer(
    leaflet.circleMarker([p.lat, p.lng], {
      radius: 8, fillColor: '#ff9800', color: '#fff', weight: 2.2, fillOpacity: 1,
    }).bindPopup(`Recolha · ${p.name}`)
  );
  routeLayer.addLayer(
    leaflet.circleMarker([d.lat, d.lng], {
      radius: 8, fillColor: routeColor, color: '#fff', weight: 2.2, fillOpacity: 1,
    }).bindPopup(`Destino · ${d.name}`)
  );
  routeMap.fitBounds(leaflet.latLngBounds([[p.lat, p.lng], [d.lat, d.lng]]), { padding: [24, 24], maxZoom: 14 });
}
</script>

<style scoped>
.back-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--ge-radius); background: var(--ge-page);
  color: var(--ge-text);
}
.p-icon { display: inline-flex; }
.p-icon :deep(svg) { width: 12px; height: 12px; }
.stepper-section {
  padding: 16px;
  background: var(--ge-surface);
  border-bottom: 1px solid var(--ge-border);
}
.timer-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 0 16px 12px;
  background: var(--ge-status-pending-bg);
  border-radius: var(--ge-radius);
  font-size: 13px;
  color: #92400e;
}
.timer-icon { display: inline-flex; vertical-align: middle; margin-right: 4px; }
.timer-icon :deep(svg) { width: 14px; height: 14px; }
.btn-sm { padding: 8px 16px; font-size: 12px; }
.cta-section { padding: 12px 16px; }
.cta-btn { font-size: 16px; padding: 16px; display: inline-flex; align-items: center; gap: 8px; }
.cta-btn :deep(svg) { width: 18px; height: 18px; }

.section { margin: 0 16px 12px; }
.section-title {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--ge-text-secondary);
  padding: 12px 16px 8px;
  display: flex; align-items: center; gap: 6px;
}
.s-icon { display: inline-flex; color: var(--ge-text-muted); }
.s-icon :deep(svg) { width: 14px; height: 14px; }
.card .section-title { padding-top: 14px; }
.route-map {
  height: 210px;
  border-radius: var(--ge-radius);
  overflow: hidden;
  margin: 0 12px 12px;
  background: var(--ge-page);
}
.route-actions {
  padding: 0 12px 12px;
}
.route-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.route-actions .btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.loc-block { padding: 0 16px 12px; }
.loc-label { font-size: 10px; font-weight: 700; color: var(--ge-text-muted); letter-spacing: 0.06em; margin-bottom: 2px; }
.loc-name { font-weight: 600; font-size: 14px; }
.loc-address { font-size: 12px; color: var(--ge-text-secondary); margin-bottom: 6px; }
.waze-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: var(--ge-brand);
  padding: 6px 12px; background: var(--ge-brand-soft);
  border-radius: var(--ge-radius-full);
}
.waze-btn :deep(svg) { width: 14px; height: 14px; }
.loc-divider { height: 1px; background: var(--ge-border-light); margin: 0 16px; }

.client-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px 14px;
}
.client-name { font-weight: 600; font-size: 14px; }
.client-phone { font-size: 13px; color: var(--ge-text-secondary); }
.client-actions { display: flex; gap: 8px; }
.action-circle {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: var(--ge-page); border-radius: 50%;
  color: var(--ge-text-secondary); text-decoration: none;
}
.action-circle :deep(svg) { width: 18px; height: 18px; }

.item-row {
  display: flex; justify-content: space-between;
  padding: 6px 16px; font-size: 13px;
}
.item-name { font-weight: 500; }
.item-qty { color: var(--ge-text-secondary); }
.item-meta {
  display: flex; gap: 16px; padding: 8px 16px 14px;
  font-size: 12px; color: var(--ge-text-muted);
}

.instructions-text {
  padding: 0 16px 14px; margin: 0;
  font-size: 13px; color: var(--ge-text); line-height: 1.5;
}

.time-log { padding: 0 16px 14px; }
.time-row {
  display: flex; justify-content: space-between;
  padding: 4px 0; font-size: 13px;
}
.time-state { color: var(--ge-text-secondary); }
.time-val { font-weight: 600; }
.time-empty { font-size: 13px; color: var(--ge-text-muted); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal-card {
  width: 100%; max-width: 360px; padding: 24px;
}
.modal-card h3 { margin: 0 0 16px; font-family: var(--ge-font-display); }
.modal-actions { display: flex; gap: 12px; margin-top: 16px; }
.modal-actions .btn { flex: 1; }
</style>
