<template>
  <div class="page" v-if="delivery">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Order banner (Figma: < #ORD-2850 URGENTE €6.50 / state) -->
    <div class="order-banner">
      <button class="ob-back" @click="$router.push('/deliveries')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="ob-info">
        <div class="ob-top-row">
          <span class="ob-id">{{ delivery.orderId }}</span>
          <span class="badge-urgent" v-if="delivery.priority >= 4">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 2L1 21h22L12 2z"/></svg>
            URGENTE
          </span>
          <span class="badge-normal" v-else>Normal</span>
        </div>
        <span class="ob-state">{{ stateLabel }}</span>
      </div>
      <span class="ob-price">€{{ delivery.costEuro?.toFixed(2) || '6.50' }}</span>
    </div>

    <div class="page-body">
      <!-- Stepper (Figma: Aceite → Em recolha → Em trânsito → Chegou ao destino) -->
      <div class="stepper-card">
        <StatusStepper :currentState="delivery.state" :timestamps="delivery.timestamps" />
      </div>

      <!-- Map with state badge -->
      <div class="map-card">
        <div class="map-state-badge" :class="mapBadgeClass">
          <span class="msb-icon" v-html="mapBadgeIcon"></span>
          {{ mapBadgeLabel }}
        </div>
        <div ref="routeMapEl" class="route-map"></div>
        <div class="map-controls">
          <button class="map-zoom" @click="zoomIn">+</button>
          <button class="map-zoom" @click="zoomOut">−</button>
        </div>
      </div>

      <!-- REGISTO DE TEMPOS -->
      <div class="section-card">
        <span class="section-label">REGISTO DE TEMPOS</span>
        <div v-for="(t, i) in timeEntries" :key="i" class="time-row">
          <div class="time-left">
            <span class="time-dot" :class="{ done: t.done }">
              <svg v-if="t.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
            </span>
            <span class="time-name" :class="{ 'time-done': t.done }">{{ t.label }}</span>
          </div>
          <span class="time-val">{{ t.time }}</span>
        </div>
      </div>

      <!-- Client / Destinatário (Figma: avatar + name + phone + chat + call) -->
      <div class="section-card client-card">
        <div class="client-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
        </div>
        <div class="client-info">
          <span class="client-name">{{ delivery.destination.name }}</span>
          <span class="client-phone">{{ delivery.destination.phone }}</span>
        </div>
        <div class="client-actions">
          <a href="#" class="action-btn action-chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </a>
          <a :href="'tel:' + delivery.destination.phone" class="action-btn action-call">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          </a>
        </div>
      </div>

      <!-- Locations: RECOLHA + ENTREGA (Figma: orange dot, green dot, with full addresses) -->
      <div class="section-card">
        <div class="loc-row">
          <div class="loc-dot loc-dot-orange"></div>
          <div class="loc-detail">
            <span class="loc-label">RECOLHA</span>
            <span class="loc-name">{{ delivery.pickup.name }}</span>
            <span class="loc-address">{{ delivery.pickup.address }}</span>
          </div>
        </div>
        <div class="loc-connector"></div>
        <div class="loc-row">
          <div class="loc-dot loc-dot-green"></div>
          <div class="loc-detail">
            <span class="loc-label">ENTREGA</span>
            <span class="loc-name">{{ delivery.destination.name }}</span>
            <span class="loc-address">{{ delivery.destination.address || 'Rua do Sardoal, nº38, Av.Central, Braga' }}</span>
          </div>
        </div>
      </div>

      <!-- ENCOMENDA (Figma: package icon + product name + qty) -->
      <div class="section-card">
        <span class="section-label">ENCOMENDA</span>
        <div v-for="item in delivery.items" :key="item.name" class="item-row">
          <div class="item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
          </div>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-qty">{{ item.qty }} {{ item.unit }}</span>
          </div>
        </div>
        <div class="item-meta">
          Peso total: {{ delivery.weight }} · Tamanho: {{ delivery.size || 'Médio' }}
        </div>
      </div>

      <!-- Instruções especiais -->
      <div class="section-card instructions-card" v-if="delivery.instructions">
        <div class="instr-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" fill="none" stroke="#fff" stroke-width="2"/></svg>
          <span class="instr-title">Instruções especiais</span>
        </div>
        <p class="instr-text">{{ delivery.instructions }}</p>
      </div>

      <!-- Documentação adicional -->
      <div class="section-card doc-link-card">
        <div class="doc-link-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          <span class="doc-link-text">Documentação adicional</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <!-- CTA Buttons (Figma: per-state styling) -->
      <div class="cta-section" v-if="ctaLabel">
        <!-- E-08: Aceitar Entrega (green) -->
        <button v-if="delivery.state === 'E-08'" class="cta-btn cta-green" @click="handleAccept">
          {{ ctaLabel }}
        </button>
        <!-- E-09: Iniciar recolha (green) + Waze (amber) -->
        <template v-else-if="delivery.state === 'E-09'">
          <button class="cta-btn cta-green" @click="handleCTA">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            {{ ctaLabel }}
          </button>
          <a :href="wazeRouteFull" target="_blank" rel="noopener" class="cta-btn cta-amber">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            Iniciar no Waze
          </a>
        </template>
        <!-- E-10: Recolha feita (amber) -->
        <button v-else-if="delivery.state === 'E-10'" class="cta-btn cta-amber" @click="handleCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ ctaLabel }}
        </button>
        <!-- E-11: Cheguei ao destino (amber) -->
        <button v-else-if="delivery.state === 'E-11'" class="cta-btn cta-amber" @click="handleCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          {{ ctaLabel }}
        </button>
        <!-- E-12: Confirmar entrega (green) -->
        <button v-else class="cta-btn cta-green" @click="handleCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          {{ ctaLabel }}
        </button>
      </div>

      <!-- Impossible delivery (link below CTA) -->
      <div v-if="canMarkImpossible" class="impossible-link" @click="showImpossible = true">
        Impossível Entregar
      </div>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-brand">
        <span class="footer-g">G</span>
        <span class="footer-name">GoEverywhere</span>
      </div>
      <p class="footer-copy">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
    </footer>

    <!-- Timer overlay for E-08 -->
    <div v-if="delivery.state === 'E-08'" class="timer-banner">
      <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Tempo para aceitar: <strong>{{ timerDisplay }}</strong></span>
      <button class="timer-accept" @click="handleAccept">Aceitar</button>
    </div>

    <!-- Impossible delivery modal -->
    <Teleport to="body">
      <div v-if="showImpossible" class="modal-overlay" @click.self="showImpossible = false">
        <div class="modal-card">
          <h3>Entrega Impossível</h3>
          <div class="field-group">
            <label>Motivo</label>
            <textarea v-model="impossibleReason" class="field-input" rows="3" placeholder="Descreve o motivo..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showImpossible = false">Cancelar</button>
            <button class="btn-danger" @click="handleImpossible">Confirmar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <div v-else class="page" style="text-align:center; padding-top:80px">
    <p>Entrega não encontrada.</p>
    <button class="cta-btn cta-green" style="margin:16px auto; max-width:200px" @click="$router.push('/deliveries')">Voltar</button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  getDeliveryById, acceptDelivery, advanceDeliveryState,
  markDeliveryImpossible, wazeLink,
} from '../stores/courierStore.js';
import { DELIVERY_STATE, deliveryStateLabels, STATE_CTA } from '../constants.js';
import StatusStepper from '../components/StatusStepper.vue';

const props = defineProps({ id: String });
const router = useRouter();
const routeMapEl = ref(null);
let routeMap = null; let routeLayer = null; let leaflet = null;

const delivery = computed(() => getDeliveryById(props.id));
const ctaLabel = computed(() => delivery.value ? STATE_CTA[delivery.value.state] : null);
const canMarkImpossible = computed(() =>
  delivery.value && ['E-09', 'E-10', 'E-11', 'E-12'].includes(delivery.value.state)
);

const stateLabel = computed(() => {
  if (!delivery.value) return '';
  return {
    'E-08': 'Pedido Recebido',
    'E-09': 'Aceite',
    'E-10': 'Em recolha',
    'E-11': 'Em trânsito',
    'E-12': 'Chegou ao destino',
    'E-13': 'Entregue',
    'E-14': 'Falhou',
  }[delivery.value.state] || deliveryStateLabels[delivery.value.state];
});

// Map badge per Figma
const mapBadgeLabel = computed(() => {
  if (!delivery.value) return '';
  return { 'E-09': 'Aceite', 'E-10': 'Em recolha', 'E-11': 'Em trânsito', 'E-12': 'No destino' }[delivery.value.state] || 'Aceite';
});
const mapBadgeClass = computed(() => {
  if (!delivery.value) return '';
  return { 'E-09': 'msb-green', 'E-10': 'msb-orange', 'E-11': 'msb-blue', 'E-12': 'msb-orange' }[delivery.value.state] || 'msb-green';
});
const mapBadgeIcon = computed(() => {
  const s = delivery.value?.state;
  if (s === 'E-09') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';
  if (s === 'E-10') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  if (s === 'E-11') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/></svg>';
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>';
});

const wazeRouteFull = computed(() => {
  if (!delivery.value) return '#';
  const toPickup = ['E-08', 'E-09', 'E-10'].includes(delivery.value.state);
  return toPickup
    ? wazeLink(delivery.value.pickup.lat, delivery.value.pickup.lng)
    : wazeLink(delivery.value.destination.lat, delivery.value.destination.lng);
});

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

const stateOrder = ['E-09', 'E-10', 'E-11', 'E-12'];
const timeEntries = computed(() => {
  const ts = delivery.value?.timestamps || {};
  const curIdx = stateOrder.indexOf(delivery.value?.state);
  return [
    { label: 'Aceite', time: formatTime(ts['E-09']), done: curIdx >= 0 && !!ts['E-09'] },
    { label: 'Em recolha', time: formatTime(ts['E-10']), done: curIdx >= 1 && !!ts['E-10'] },
    { label: 'Em trânsito', time: formatTime(ts['E-11']), done: curIdx >= 2 && !!ts['E-11'] },
    { label: 'Chegou ao destino', time: formatTime(ts['E-12']), done: curIdx >= 3 && !!ts['E-12'] },
  ];
});

// Timer for E-08
const timerSeconds = ref(300);
let timerInterval = null;
const timerDisplay = computed(() => {
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

function zoomIn() { routeMap?.zoomIn(); }
function zoomOut() { routeMap?.zoomOut(); }

onMounted(() => {
  if (delivery.value?.state === DELIVERY_STATE.E08) {
    timerInterval = setInterval(() => {
      timerSeconds.value--;
      if (timerSeconds.value <= 0) clearInterval(timerInterval);
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
  routeMap?.remove(); routeMap = null; routeLayer = null; leaflet = null;
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

function renderRouteMap() {
  if (!delivery.value || !routeMap || !routeLayer || !leaflet) return;
  routeLayer.clearLayers();
  const p = delivery.value.pickup;
  const d = delivery.value.destination;
  if (p?.lat == null || d?.lat == null) return;

  const s = delivery.value.state;
  const routeColor = s === 'E-09' ? '#22c55e' : s === 'E-10' ? '#f59e0b' : s === 'E-11' ? '#3b82f6' : '#22c55e';
  const isDashed = !['E-13'].includes(s);

  routeLayer.addLayer(leaflet.polyline([[p.lat, p.lng], [d.lat, d.lng]], {
    color: routeColor, weight: 5, opacity: 0.92,
    dashArray: isDashed ? '10 8' : null,
  }));
  routeLayer.addLayer(leaflet.circleMarker([p.lat, p.lng], { radius: 9, fillColor: '#f59e0b', color: '#fff', weight: 2.5, fillOpacity: 1 }));
  routeLayer.addLayer(leaflet.circleMarker([d.lat, d.lng], { radius: 9, fillColor: '#22c55e', color: '#fff', weight: 2.5, fillOpacity: 1 }));
  routeMap.fitBounds(leaflet.latLngBounds([[p.lat, p.lng], [d.lat, d.lng]]), { padding: [24, 24], maxZoom: 14 });
}
</script>

<style scoped>
.logo-mini { width: 36px; height: 34px; border-radius: 14px; object-fit: cover; }
.header-title { font-family: var(--ge-font-display); font-size: 14px; font-weight: 700; color: #111827; }

/* Order banner */
.order-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: #fff; border-bottom: 0.72px solid #e5e7eb;
}
.ob-back { background: none; border: none; cursor: pointer; padding: 4px; display: flex; }
.ob-info { flex: 1; }
.ob-top-row { display: flex; align-items: center; gap: 8px; }
.ob-id { font-family: var(--ge-font-display); font-size: 16px; font-weight: 700; color: #111827; }
.badge-urgent {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; background: #fef2f2;
  border-radius: var(--ge-radius-full);
  font-size: 10px; font-weight: 600; color: #ef4444;
}
.badge-normal {
  padding: 2px 8px; background: #fffbeb;
  border-radius: var(--ge-radius-full);
  font-size: 10px; font-weight: 600; color: #f59e0b;
}
.ob-state { font-size: 12px; color: #6b7280; }
.ob-price { font-family: var(--ge-font-display); font-size: 16px; font-weight: 700; color: #1b8a4a; }

/* Stepper card */
.stepper-card {
  margin: 12px 16px 0;
  padding: 12px 8px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
}

/* Map */
.map-card {
  position: relative;
  margin: 12px 16px;
  border-radius: 16px;
  overflow: hidden;
  border: 0.72px solid #e5e7eb;
}
.route-map { height: 200px; background: var(--ge-page); }
.map-controls {
  position: absolute; bottom: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 4px; z-index: 10;
}
.map-zoom {
  width: 32px; height: 32px;
  background: #fff; border: 0.72px solid #e5e7eb;
  border-radius: 8px; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #111827;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* Map state badge (Figma: colored pill on top-left of map) */
.map-state-badge {
  position: absolute; top: 12px; left: 12px;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px;
  border-radius: var(--ge-radius-full);
  font-size: 11px; font-weight: 600; color: #fff;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.msb-icon { display: inline-flex; }
.msb-green { background: #22c55e; }
.msb-orange { background: #f59e0b; }
.msb-blue { background: #3b82f6; }

/* Section cards */
.section-card {
  margin: 0 16px 12px;
  padding: 16px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
}
.section-label {
  font-family: var(--ge-font-display);
  font-size: 10px; font-weight: 600;
  color: #9ca3af; letter-spacing: 0.04em;
  display: block; margin-bottom: 10px;
}

/* Time log */
.time-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
}
.time-left { display: flex; align-items: center; gap: 8px; }
.time-dot {
  width: 20px; height: 20px;
  border-radius: 50%; background: #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.time-dot.done { background: #22c55e; }
.time-name { font-size: 13px; color: #6b7280; }
.time-name.time-done { color: #111827; font-weight: 500; }
.time-val { font-size: 13px; color: #111827; font-weight: 500; }

/* Client */
.client-card {
  display: flex; align-items: center; gap: 12px;
}
.client-avatar {
  width: 44px; height: 44px;
  background: #fffbeb;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.client-info { flex: 1; }
.client-name { font-size: 14px; font-weight: 600; color: #111827; display: block; }
.client-phone { font-size: 12px; color: #6b7280; }
.client-actions { display: flex; gap: 8px; }
.action-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  text-decoration: none;
  transition: background 0.15s;
}
.action-chat { background: #f0fdf4; border: 0.72px solid #dcfce7; }
.action-call { background: #f0fdf4; border: 0.72px solid #dcfce7; }

/* Locations */
.loc-row { display: flex; align-items: flex-start; gap: 12px; }
.loc-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
.loc-dot-orange { background: #f59e0b; }
.loc-dot-green { background: #22c55e; }
.loc-connector {
  width: 2px; height: 16px;
  background: #e5e7eb;
  margin-left: 5px;
}
.loc-detail { display: flex; flex-direction: column; }
.loc-label { font-size: 10px; font-weight: 700; color: #f59e0b; letter-spacing: 0.04em; }
.loc-row:last-child .loc-label { color: #22c55e; }
.loc-name { font-size: 14px; font-weight: 600; color: #111827; }
.loc-address { font-size: 12px; color: #6b7280; }

/* Items */
.item-row {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 0;
}
.item-icon {
  width: 40px; height: 40px;
  background: #f9fafb;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.item-info { display: flex; flex-direction: column; }
.item-name { font-size: 14px; font-weight: 600; color: #111827; }
.item-qty { font-size: 12px; color: #6b7280; }
.item-meta { font-size: 11px; color: #9ca3af; margin-top: 8px; }

/* Instructions */
.instructions-card { background: #fffbeb; border-color: #fde68a; }
.instr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.instr-title { font-size: 13px; font-weight: 600; color: #92400e; }
.instr-text { font-size: 13px; color: #78350f; margin: 0; }

/* Doc link */
.doc-link-card { padding: 14px 16px; }
.doc-link-row {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
}
.doc-link-text { flex: 1; font-size: 13px; color: #111827; }

/* CTA section */
.cta-section {
  padding: 0 16px 8px;
  display: flex; flex-direction: column; gap: 8px;
}
.cta-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  cursor: pointer;
  transition: transform 0.1s;
  text-decoration: none;
  color: #fff;
}
.cta-btn:active { transform: scale(0.97); }
.cta-green {
  background: #1b8a4a;
  box-shadow: 0 8px 24px rgba(27,138,74,0.25);
}
.cta-amber {
  background: #f59e0b;
  box-shadow: 0 8px 24px rgba(245,158,11,0.3);
}

/* Impossible link */
.impossible-link {
  text-align: center;
  font-size: 13px; font-weight: 500;
  color: #ef4444;
  padding: 8px 16px 16px;
  cursor: pointer;
}

/* Timer */
.timer-banner {
  position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%);
  width: calc(100% - 32px); max-width: 400px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: #fffbeb; border: 0.72px solid #fde68a;
  border-radius: 16px;
  font-size: 13px; color: #92400e;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.timer-accept {
  padding: 8px 16px;
  background: #1b8a4a; color: #fff;
  border: none; border-radius: 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9998;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal-card {
  width: 100%; max-width: 360px;
  padding: 24px; background: #fff;
  border-radius: 16px;
}
.modal-card h3 { margin: 0 0 16px; font-family: var(--ge-font-display); font-size: 18px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 12px; color: #6b7280; font-weight: 500; }
.field-input {
  width: 100%; padding: 12px 16px;
  background: #f9fafb; border: 0.72px solid #e5e7eb;
  border-radius: 16px; font-size: 14px;
  outline: none; resize: vertical;
}
.modal-actions { display: flex; gap: 12px; margin-top: 16px; }
.btn-cancel {
  flex: 1; padding: 12px;
  background: #fff; border: 0.72px solid #e5e7eb;
  border-radius: 12px; font-size: 14px; font-weight: 600;
  cursor: pointer; color: #6b7280;
}
.btn-danger {
  flex: 1; padding: 12px;
  background: #ef4444; color: #fff;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}

/* Footer */
.app-footer { text-align: center; padding: 32px 28px; }
.footer-brand { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
.footer-g {
  width: 28px; height: 28px;
  background: #1b8a4a; color: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ge-font-display); font-size: 14px; font-weight: 700;
}
.footer-name { font-family: var(--ge-font-display); font-size: 14px; font-weight: 700; color: #111827; }
.footer-copy { font-size: 11px; color: #9ca3af; margin: 0; }
</style>
