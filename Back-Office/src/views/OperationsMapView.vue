<template>
  <div class="page">
    <p class="lead">
      Percurso de entrega (OSRM + OpenStreetMap): estafeta → loja Continente → morada do cliente. Toque num pedido à direita para
      destacar a rota; em trânsito, o marcador do estafeta anima ao longo do trajeto loja → cliente.
    </p>
    <div v-if="routeError" class="banner" role="status">{{ routeError }}</div>
    <div class="layout">
      <aside class="panel panel--left card">
        <h3>Estafetas</h3>
        <p class="hint">Online e com encomenda</p>
        <ul class="list">
          <li v-for="c in activeCouriers" :key="c.id" class="li">
            <span class="pulse" aria-hidden="true" />
            <div>
              <strong>{{ c.name }}</strong>
              <div class="muted">{{ courierStateLabels[c.state] }} · {{ c.online ? 'Online' : 'Offline' }}</div>
              <div v-if="c.currentOrderId" class="order-line">Pedido {{ c.currentOrderId }} · ETA ~{{ c.etaMinutes }} min</div>
              <div v-else class="muted">Sem encomenda atribuída</div>
            </div>
          </li>
        </ul>
      </aside>

      <div class="map-wrap card">
        <div ref="mapEl" class="map" role="application" aria-label="Mapa operacional" />
        <div class="legend">
          <span class="leg leg--rider"><i /> Estafeta</span>
          <span class="leg leg--store"><i /> Continente</span>
          <span class="leg leg--dest"><i /> Cliente</span>
          <span class="leg leg--leg1"><i /> Até à loja</span>
          <span class="leg leg--leg2"><i /> Loja → cliente</span>
          <span v-if="routesLoading" class="leg leg--load">A calcular rotas…</span>
          <span v-else-if="usedFallback" class="leg leg--warn">Alguns traços: linha reta (API indisponível)</span>
        </div>
      </div>

      <aside class="panel panel--right card">
        <h3>Pedidos com rota</h3>
        <p class="hint">Atribuídos ou em trânsito (com loja e GPS)</p>
        <ul class="list">
          <li
            v-for="o in routableOrders"
            :key="o.id"
            class="li li--click"
            :class="{ 'is-selected': selectedOrderId === o.id }"
            role="button"
            tabindex="0"
            @click="selectOrder(o.id)"
            @keydown.enter.prevent="selectOrder(o.id)"
          >
            <div>
              <strong>{{ o.id }}</strong>
              <div class="muted">{{ o.clientName }}</div>
              <div>Loja: {{ storeName(o.storeId) }}</div>
              <div>Estafeta: {{ courierName(o.courierId) }}</div>
              <div class="eta">ETA ~{{ o.etaMinutes ?? '—' }} min · {{ orderStatusLabels[o.status] }}</div>
            </div>
          </li>
          <li v-if="!routableOrders.length" class="li muted">Nenhum pedido elegível. Aprove, atribua estafeta e defina loja.</li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  logistics,
  ORDER_STATUS,
  getStoreById,
  getCourierById,
} from '../stores/logisticsStore.js';
import { courierStateLabels, COURIER_STATE, orderStatusLabels } from '../constants/logistics.js';
import { fetchDeliveryLegs, deliveryLegsStraightLine } from '../utils/osrmRouting.js';

const mapEl = ref(null);
const route = useRoute();
const router = useRouter();
let map = null;
const markerLayers = [];
const routeLayers = [];
let routesGroup = null;
let animMarker = null;
let animTimer = null;
let abortCtrl = null;
let debounceT = null;

const selectedOrderId = ref('');
const routesLoading = ref(false);
const routeError = ref('');
const usedFallback = ref(false);

const routableOrders = computed(() =>
  logistics.orders.filter(
    (o) =>
      o.courierId &&
      o.storeId &&
      o.destLat != null &&
      o.destLng != null &&
      [ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT].includes(o.status)
  )
);

const activeCouriers = computed(() =>
  logistics.couriers.filter((c) => c.state === COURIER_STATE.E06 || !!c.currentOrderId)
);

function storeName(id) {
  if (!id) return '—';
  return getStoreById(id)?.name || id;
}

function courierName(id) {
  if (!id) return '—';
  return getCourierById(id)?.name || id;
}

function makePulseIcon(className) {
  return L.divIcon({
    className: `bo-pin ${className}`,
    html: '<span class="bo-pin__dot"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function clearAnim() {
  if (animTimer) {
    clearInterval(animTimer);
    animTimer = null;
  }
  if (animMarker && map) {
    map.removeLayer(animMarker);
    animMarker = null;
  }
}

function startCourierAnimAlongLeg2(coords) {
  clearAnim();
  if (!map || !coords?.length) return;
  animMarker = L.marker(coords[0], { icon: makePulseIcon('bo-pin--rider-anim'), zIndexOffset: 1000 }).addTo(map);
  let idx = 0;
  animTimer = setInterval(() => {
    idx = (idx + 1) % coords.length;
    animMarker?.setLatLng(coords[idx]);
  }, 120);
}

function selectOrder(id) {
  selectedOrderId.value = id;
  router.replace({ name: 'map', query: id ? { order: id } : {} });
}

function drawMarkers() {
  if (!map) return;
  markerLayers.forEach((l) => map.removeLayer(l));
  markerLayers.length = 0;

  for (const s of logistics.continentStores) {
    const m = L.marker([s.lat, s.lng], { icon: makePulseIcon('bo-pin--store') }).addTo(map);
    m.bindPopup(`<strong>${s.name}</strong><br/>Loja Continente`);
    markerLayers.push(m);
  }

  const hideCourierIds = new Set();
  const sel = selectedOrderId.value;
  const selOrder = routableOrders.value.find((o) => o.id === sel);
  if (selOrder?.status === ORDER_STATUS.IN_TRANSIT && selOrder.courierId) {
    hideCourierIds.add(selOrder.courierId);
  }

  for (const c of logistics.couriers) {
    if (c.lat == null || hideCourierIds.has(c.id)) continue;
    const m = L.marker([c.lat, c.lng], { icon: makePulseIcon('bo-pin--rider') }).addTo(map);
    m.bindPopup(`<strong>${c.name}</strong><br/>${courierStateLabels[c.state]}`);
    markerLayers.push(m);
  }

  for (const o of routableOrders.value) {
    if (o.destLat == null || o.destLng == null) continue;
    const m = L.marker([o.destLat, o.destLng], { icon: makePulseIcon('bo-pin--dest') }).addTo(map);
    m.bindPopup(`Destino · ${o.id}<br/>${o.clientName}`);
    markerLayers.push(m);
  }
}

async function refreshRoutes() {
  if (!map || !routesGroup) return;
  abortCtrl?.abort();
  abortCtrl = new AbortController();
  const signal = abortCtrl.signal;

  routeLayers.forEach((l) => routesGroup.removeLayer(l));
  routeLayers.length = 0;
  clearAnim();
  usedFallback.value = false;
  routeError.value = '';

  const orders = routableOrders.value;
  if (!orders.length) {
    routesLoading.value = false;
    drawMarkers();
    return;
  }

  routesLoading.value = true;
  try {
    for (const o of orders) {
      if (signal.aborted) return;
      const c = getCourierById(o.courierId);
      const s = getStoreById(o.storeId);
      if (!c || !s) continue;
      const courier = [c.lat, c.lng];
      const store = [s.lat, s.lng];
      const dest = [o.destLat, o.destLng];
      let legs;
      try {
        legs = await fetchDeliveryLegs(courier, store, dest, signal);
      } catch {
        if (signal.aborted) return;
        legs = deliveryLegsStraightLine(courier, store, dest);
      }
      if (signal.aborted) return;
      if (!legs?.leg1?.length || !legs?.leg2?.length) continue;
      if (!legs.fromApi) usedFallback.value = true;

      const sel = selectedOrderId.value === o.id;
      const w = sel ? 5 : 3;
      const o1 = sel ? 0.95 : 0.28;
      const o2 = sel ? 0.95 : 0.28;

      const p1 = L.polyline(legs.leg1, { color: '#2563eb', weight: w, opacity: o1 }).addTo(routesGroup);
      const p2 = L.polyline(legs.leg2, { color: '#059669', weight: w, opacity: o2 }).addTo(routesGroup);
      p1.bindPopup(`${o.id}: estafeta → loja`);
      p2.bindPopup(`${o.id}: loja → cliente`);
      routeLayers.push(p1, p2);

      if (sel && o.status === ORDER_STATUS.IN_TRANSIT) {
        startCourierAnimAlongLeg2(legs.leg2);
      }
    }
  } finally {
    if (!signal.aborted) routesLoading.value = false;
  }

  drawMarkers();

  const boundsPoints = [];
  for (const l of routeLayers) {
    l.getLatLngs().forEach((pt) => {
      if (Array.isArray(pt)) pt.forEach((p) => boundsPoints.push(p));
      else boundsPoints.push(pt);
    });
  }
  markerLayers.forEach((m) => boundsPoints.push(m.getLatLng()));
  if (boundsPoints.length) {
    try {
      const b = L.latLngBounds(boundsPoints);
      if (b.isValid()) map.fitBounds(b, { padding: [48, 48], maxZoom: 14 });
    } catch {
      /* ignore */
    }
  }
}

function scheduleRefresh() {
  clearTimeout(debounceT);
  debounceT = setTimeout(() => {
    debounceT = null;
    refreshRoutes();
  }, 350);
}

watch(
  () => route.query.order,
  (q) => {
    selectedOrderId.value = typeof q === 'string' ? q : '';
    scheduleRefresh();
  },
  { immediate: true }
);

watch(
  () => [logistics.orders, logistics.couriers],
  () => scheduleRefresh(),
  { deep: true }
);

watch(selectedOrderId, () => scheduleRefresh());

onMounted(() => {
  if (!mapEl.value) return;
  map = L.map(mapEl.value).setView([41.15, -8.63], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);
  routesGroup = L.layerGroup().addTo(map);
  void refreshRoutes();
  setTimeout(() => map?.invalidateSize(), 250);
});

onBeforeUnmount(() => {
  abortCtrl?.abort();
  clearTimeout(debounceT);
  clearAnim();
  map?.remove();
  map = null;
  routesGroup = null;
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lead {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.banner {
  padding: 10px 14px;
  border-radius: var(--bo-radius-sm);
  background: #fef3c7;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
}

.layout {
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  gap: 14px;
  min-height: min(560px, 72vh);
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .map-wrap {
    order: -1;
    min-height: 380px;
  }
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.panel {
  padding: 16px;
  overflow-y: auto;
}

.panel h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.li {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--bo-border);
  font-size: 13px;
}

.li--click {
  cursor: pointer;
  border-radius: var(--bo-radius-sm);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
}

.li--click:hover {
  background: var(--bo-page);
}

.li--click.is-selected {
  background: #eff6ff;
  outline: 1px solid #93c5fd;
}

.pulse {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  animation: pulse 1.4s ease-in-out infinite;
}

.muted {
  color: var(--bo-text-secondary);
  font-size: 12px;
}

.order-line {
  font-size: 12px;
  color: var(--bo-brand);
  font-weight: 600;
  margin-top: 4px;
}

.eta {
  font-weight: 700;
  color: #059669;
  margin-top: 4px;
}

.map-wrap {
  position: relative;
  padding: 0;
  overflow: hidden;
  min-height: 400px;
}

.map {
  height: 100%;
  min-height: 400px;
}

.map-wrap :deep(.leaflet-container) {
  height: 100%;
  min-height: 400px;
  border-radius: var(--bo-radius-lg);
}

.legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 800;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.94);
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  font-size: 11px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  max-width: calc(100% - 24px);
}

.leg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.leg i {
  display: inline-block;
  width: 14px;
  height: 4px;
  border-radius: 2px;
}

.leg--rider i {
  background: #2563eb;
}
.leg--store i {
  background: #10b981;
}
.leg--dest i {
  background: #dc2626;
}
.leg--leg1 i {
  background: #2563eb;
  height: 3px;
}
.leg--leg2 i {
  background: #059669;
  height: 3px;
}
.leg--load,
.leg--warn {
  width: 100%;
  flex-basis: 100%;
}
.leg--warn i {
  display: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.7;
  }
}
</style>

<style>
.bo-pin {
  background: transparent !important;
  border: none !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
}
.bo-pin__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  animation: bo-pin-pulse 1.5s ease-in-out infinite;
}
.bo-pin--store .bo-pin__dot {
  background: #10b981;
}
.bo-pin--rider .bo-pin__dot {
  background: #2563eb;
}
.bo-pin--rider-anim .bo-pin__dot {
  background: #1d4ed8;
  animation: bo-pin-pulse 0.8s ease-in-out infinite;
}
.bo-pin--dest .bo-pin__dot {
  background: #dc2626;
}
@keyframes bo-pin-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}
</style>
