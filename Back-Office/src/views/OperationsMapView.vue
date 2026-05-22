<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Operações em tempo real</p>
        <h1 class="bo-page-head__title">Mapa operacional</h1>
        <p class="bo-page-head__sub">
          Estafetas online, lojas Continente, clientes e rotas calculadas. Clica num pedido para isolá-lo no mapa.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <span v-if="routesLoading" class="bo-badge bo-badge--info">A calcular rotas...</span>
        <span v-else-if="usedFallback" class="bo-badge bo-badge--warn">Algumas rotas em linha reta</span>
        <button v-if="mapIsolated" type="button" class="bo-btn bo-btn--outline" @click="clearMapSelection">Mostrar todas</button>
      </div>
    </header>

    <div v-if="routeError" class="bo-card bo-card--padded" style="border-left: 4px solid var(--bo-warning);">
      <p class="bo-muted" style="font-size: 13px; margin: 0;">{{ routeError }}</p>
    </div>
    <div v-if="isolateInvalid" class="bo-card bo-card--padded" style="border-left: 4px solid var(--bo-danger); background: var(--bo-danger-soft);">
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #991b1b;">
        O pedido na URL não está roteável (atribui estafeta, loja e GPS) ou não existe.
      </p>
    </div>

    <div class="layout">
      <aside class="panel">
        <header class="panel__head">
          <h3 class="panel__title">{{ mapIsolated ? 'Estafeta desta entrega' : 'Estafetas' }}</h3>
          <p class="panel__sub">{{ mapIsolated ? 'Apenas o motorista do pedido selecionado.' : 'Online e com encomenda atribuída.' }}</p>
        </header>
        <ul class="panel__list">
          <li v-if="!couriersForSidePanel.length" class="bo-muted" style="font-size: 13px; padding: 12px 0;">Sem estafetas para mostrar.</li>
          <li v-for="c in couriersForSidePanel" :key="c.id" class="panel__item">
            <span class="pulse" aria-hidden="true" />
            <div class="panel__item-body">
              <div class="panel__item-name">{{ c.name }}</div>
              <div class="panel__item-meta">{{ courierStateLabels[c.state] }} · {{ c.online ? 'Online' : 'Offline' }}</div>
              <div v-if="c.currentOrderId" class="panel__item-order">Pedido {{ c.currentOrderId }} · ETA ~{{ c.etaMinutes }} min</div>
              <div v-else class="panel__item-meta">Sem encomenda atribuída</div>
            </div>
          </li>
        </ul>
      </aside>

      <div class="map-wrap">
        <div ref="mapEl" class="map" role="application" aria-label="Mapa operacional" />
        <div class="legend">
          <span class="leg"><img class="leg-rider-thumb" :src="courierPinUrl" width="16" height="16" alt="" /> Estafeta</span>
          <span class="leg"><img class="leg-store-thumb" :src="continentePinUrl" width="16" height="16" alt="" /> Loja</span>
          <span class="leg"><img class="leg-house-thumb" :src="customerHousePinUrl" width="16" height="16" alt="" /> Cliente</span>
          <span class="leg"><i class="leg-dash--sample" /> Estafeta para loja</span>
          <span class="leg"><i class="leg-line--sample" /> Loja para cliente</span>
        </div>
      </div>

      <aside class="panel">
        <header class="panel__head">
          <h3 class="panel__title">Pedidos com rota</h3>
          <p class="panel__sub">Atribuídos ou em trânsito (loja e GPS). Clica para isolar no mapa.</p>
          <span v-if="mapIsolated" class="bo-badge bo-badge--info" style="margin-top: 8px;">Mapa: {{ selectedOrderId }}</span>
        </header>
        <ul class="panel__list">
          <li
            v-for="o in routableOrders"
            :key="o.id"
            class="panel__item panel__item--click"
            :class="{ 'is-selected': selectedOrderId === o.id }"
            role="button"
            tabindex="0"
            @click="selectOrder(o.id)"
            @keydown.enter.prevent="selectOrder(o.id)"
          >
            <div class="panel__item-body">
              <div class="panel__item-name">{{ o.id }}</div>
              <div class="panel__item-meta">{{ o.clientName }}</div>
              <div class="panel__item-meta">Loja: {{ storeName(o.storeId) }}</div>
              <div class="panel__item-meta">Estafeta: {{ courierName(o.courierId) }}</div>
              <div class="panel__item-eta">ETA ~{{ o.etaMinutes ?? '—' }} min · {{ orderStatusLabels[o.status] }}</div>
            </div>
          </li>
          <li v-if="!routableOrders.length" class="bo-muted" style="font-size: 13px; padding: 12px 0;">
            Nenhum pedido elegível. Aprova, atribui estafeta e define loja.
          </li>
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
  refreshStores,
} from '../stores/logisticsStore.js';
import { courierStateLabels, COURIER_STATE, orderStatusLabels } from '../constants/logistics.js';
import { fetchDeliveryLegs, deliveryLegsStraightLine } from '../utils/osrmRouting.js';

const courierPinUrl = `${import.meta.env.BASE_URL}media/map/courier-pin.png`;
const continentePinUrl = `${import.meta.env.BASE_URL}media/map/continente-pin.png`;
const customerHousePinUrl = `${import.meta.env.BASE_URL}media/map/customer-house-pin.png`;

/** Marcadores no mapa (mais discretos) */
const COURIER_ICON_PX = 40;
const STORE_ICON_PX = 28;
const CUSTOMER_ICON_PX = 26;

/**
 * Cada pedido = uma família néon: perna ① e ② são dois tons da mesma cor,
 * para distinguir pernas mas reconhecer a mesma entrega frente a outras famílias.
 */
const ORDER_ROUTE_PALETTES = [
  { leg1: '#e8ff00', leg2: '#00ff66' }, // lima → verde puro (máximo contraste)
  { leg1: '#00ffff', leg2: '#0066ff' }, // ciano puro → azul elétrico
  { leg1: '#ff00ff', leg2: '#ff0080' }, // magenta → rosa choque
  { leg1: '#ffff00', leg2: '#ffcc00' }, // amarelo puro → âmbar vivo
  { leg1: '#bfff00', leg2: '#00ff00' }, // lima → verde limão
  { leg1: '#e040fb', leg2: '#aa00ff' }, // roxo néon (dois tons)
  { leg1: '#ffab00', leg2: '#ff3d00' }, // âmbar → laranja forte
  { leg1: '#ff0055', leg2: '#ff3333' }, // vermelho néon (dois tons)
  { leg1: '#00ffcc', leg2: '#00ff44' }, // aqua → verde néon
  { leg1: '#77ffff', leg2: '#2979ff' }, // ciano claro → azul royal
];

function routePaletteForOrderId(id) {
  const s = String(id ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ORDER_ROUTE_PALETTES[Math.abs(h) % ORDER_ROUTE_PALETTES.length];
}

let courierIconStatic = null;
let courierIconAnim = null;
let storeMapIcon = null;
let customerMapIcon = null;

function getCourierIcon(animated) {
  const px = COURIER_ICON_PX;
  if (animated) {
    if (!courierIconAnim) {
      courierIconAnim = L.icon({
        iconUrl: courierPinUrl,
        iconSize: [px, px],
        iconAnchor: [px / 2, px],
        popupAnchor: [0, -px],
        className: 'bo-courier-marker-icon bo-courier-marker-icon--anim',
      });
    }
    return courierIconAnim;
  }
  if (!courierIconStatic) {
    courierIconStatic = L.icon({
      iconUrl: courierPinUrl,
      iconSize: [px, px],
      iconAnchor: [px / 2, px],
      popupAnchor: [0, -px],
      className: 'bo-courier-marker-icon',
    });
  }
  return courierIconStatic;
}

function getStoreMapIcon() {
  if (!storeMapIcon) {
    const px = STORE_ICON_PX;
    storeMapIcon = L.icon({
      iconUrl: continentePinUrl,
      iconSize: [px, px],
      iconAnchor: [px / 2, px],
      popupAnchor: [0, -px],
      className: 'bo-store-marker-icon',
    });
  }
  return storeMapIcon;
}

function getCustomerMapIcon() {
  if (!customerMapIcon) {
    const px = CUSTOMER_ICON_PX;
    customerMapIcon = L.icon({
      iconUrl: customerHousePinUrl,
      iconSize: [px, px],
      iconAnchor: [px / 2, px],
      popupAnchor: [0, -px],
      className: 'bo-customer-marker-icon',
    });
  }
  return customerMapIcon;
}

function validLatLngPair(p) {
  return (
    Array.isArray(p) &&
    p.length >= 2 &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number' &&
    !Number.isNaN(p[0]) &&
    !Number.isNaN(p[1])
  );
}

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

const selectedRoutableOrder = computed(() => {
  const id = selectedOrderId.value;
  if (!id) return null;
  return routableOrders.value.find((o) => o.id === id) || null;
});

/** URL tem ?order= mas o pedido não é roteável */
const isolateInvalid = computed(() => {
  const id = selectedOrderId.value;
  return !!id && !selectedRoutableOrder.value;
});

/** Um pedido válido selecionado → mapa só com essa entrega */
const mapIsolated = computed(() => !!selectedRoutableOrder.value);

/** Pedidos para desenhar rotas e bounds */
const ordersForMap = computed(() => {
  if (isolateInvalid.value) return [];
  const one = selectedRoutableOrder.value;
  if (one) return [one];
  return routableOrders.value;
});

const activeCouriers = computed(() =>
  logistics.couriers.filter((c) => c.state === COURIER_STATE.E06 || c.state === COURIER_STATE.E07 || !!c.currentOrderId)
);

const couriersForSidePanel = computed(() => {
  const sel = selectedRoutableOrder.value;
  if (!sel) return activeCouriers.value;
  const c = getCourierById(sel.courierId);
  return c ? [c] : [];
});

function storeName(id) {
  if (!id) return '—';
  return getStoreById(id)?.name || id;
}

function courierName(id) {
  if (!id) return '—';
  return getCourierById(id)?.name || id;
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
  animMarker = L.marker(coords[0], { icon: getCourierIcon(true), zIndexOffset: 1000 }).addTo(map);
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

function clearMapSelection() {
  selectOrder('');
}

/** Camadas por perna: contorno escuro, brilho da cor, halo branco, traço principal. */
const ROUTE_LEG_LAYER_COUNT = 4;

function addRouteLeg(latlngs, color, options) {
  const { weight, opacity, dashArray } = options;
  const under = L.polyline(latlngs, {
    color: '#000000',
    weight: weight + 6,
    opacity: 0.45,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(routesGroup);
  const glow = L.polyline(latlngs, {
    color,
    weight: weight + 7,
    opacity: 0.5,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(routesGroup);
  const halo = L.polyline(latlngs, {
    color: '#ffffff',
    weight: weight + 3,
    opacity: Math.min(1, opacity + 0.28),
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(routesGroup);
  const line = L.polyline(latlngs, {
    color,
    weight,
    opacity,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: dashArray || null,
  }).addTo(routesGroup);
  routeLayers.push(under, glow, halo, line);
}

function drawMarkers() {
  if (!map) return;
  markerLayers.forEach((l) => map.removeLayer(l));
  markerLayers.length = 0;

  if (isolateInvalid.value) {
    return;
  }

  const isolated = mapIsolated.value;
  const selOrder = selectedRoutableOrder.value;

  const storesToShow = isolated && selOrder?.storeId
    ? logistics.continentStores.filter((s) => s.id === selOrder.storeId)
    : logistics.continentStores;

  for (const s of storesToShow) {
    const m = L.marker([s.lat, s.lng], { icon: getStoreMapIcon() }).addTo(map);
    m.bindPopup(`<strong>${s.name}</strong><br/>Loja Continente`);
    markerLayers.push(m);
  }

  const hideCourierIds = new Set();
  if (selOrder?.status === ORDER_STATUS.IN_TRANSIT && selOrder.courierId) {
    hideCourierIds.add(selOrder.courierId);
  }

  const couriersToIterate = isolated && selOrder?.courierId
    ? logistics.couriers.filter((c) => c.id === selOrder.courierId)
    : logistics.couriers;

  for (const c of couriersToIterate) {
    if (c.lat == null || (c.lat === 0 && c.lng === 0) || hideCourierIds.has(c.id)) continue;
    const m = L.marker([c.lat, c.lng], { icon: getCourierIcon(false) }).addTo(map);
    m.bindPopup(`<strong>${c.name}</strong><br/>${courierStateLabels[c.state]}`);
    markerLayers.push(m);
  }

  const ordersForDest = isolated && selOrder ? [selOrder] : routableOrders.value;
  for (const o of ordersForDest) {
    if (o.destLat == null || o.destLng == null) continue;
    const m = L.marker([o.destLat, o.destLng], { icon: getCustomerMapIcon() }).addTo(map);
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

  const orders = ordersForMap.value;
  if (!orders.length) {
    routesLoading.value = false;
    drawMarkers();
    return;
  }

  const singleFocus = mapIsolated.value;

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
      if (!validLatLngPair(courier) || !validLatLngPair(store) || !validLatLngPair(dest)) continue;
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

      const focused = singleFocus || selectedOrderId.value === o.id;
      const wMain = focused ? 6 : 5;
      const opacityMain = focused ? 1 : 0.92;
      const { leg1: col1, leg2: col2 } = routePaletteForOrderId(o.id);

      addRouteLeg(legs.leg1, col1, {
        weight: wMain,
        opacity: opacityMain,
        dashArray: '16 12',
      });
      addRouteLeg(legs.leg2, col2, {
        weight: wMain,
        opacity: opacityMain,
        dashArray: null,
      });
      const n = routeLayers.length;
      const k = ROUTE_LEG_LAYER_COUNT;
      routeLayers[n - k * 2 + k - 1].bindPopup(`<strong>${o.id}</strong><br/>① Estafeta → loja (recolha)`);
      routeLayers[n - 1].bindPopup(`<strong>${o.id}</strong><br/>② Loja → cliente (entrega)`);

      if (o.status === ORDER_STATUS.IN_TRANSIT && (singleFocus || selectedOrderId.value === o.id)) {
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
  void refreshStores();
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
.layout {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 18px;
  align-items: stretch;
  min-height: 540px;
}

@media (max-width: 1100px) {
  .layout { grid-template-columns: 1fr; min-height: auto; }
}

.panel {
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-lg);
  box-shadow: var(--bo-shadow);
  display: flex;
  flex-direction: column;
  max-height: 720px;
  overflow: hidden;
}

.panel__head {
  padding: 16px 18px;
  border-bottom: 1px solid var(--bo-border);
}

.panel__title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
}

.panel__sub {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--bo-text-secondary);
}

.panel__list {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  overflow-y: auto;
  flex: 1;
}

.panel__item {
  display: flex;
  gap: 10px;
  padding: 12px 8px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.panel__item:last-child { border-bottom: none; }

.panel__item--click {
  cursor: pointer;
  border-radius: 8px;
  transition: background var(--bo-transition-fast);
}

.panel__item--click:hover { background: var(--bo-page); }

.panel__item--click.is-selected {
  background: var(--bo-info-soft);
  outline: 1px solid #93c5fd;
}

.panel__item-body { flex: 1; min-width: 0; }

.panel__item-name {
  font-weight: 600;
  color: var(--bo-text);
  font-size: 13.5px;
}

.panel__item-meta {
  font-size: 12px;
  color: var(--bo-text-secondary);
  margin-top: 2px;
}

.panel__item-order {
  font-size: 12px;
  color: var(--bo-brand);
  font-weight: 600;
  margin-top: 4px;
}

.panel__item-eta {
  font-weight: 700;
  color: var(--bo-success);
  font-size: 12px;
  margin-top: 4px;
}

.pulse {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--bo-success);
  box-shadow: 0 0 12px rgba(5, 150, 105, 0.6);
  flex-shrink: 0;
  animation: pulse 1.4s ease-in-out infinite;
}

.map-wrap {
  position: relative;
  padding: 0;
  overflow: hidden;
  min-height: 400px;
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-lg);
  box-shadow: var(--bo-shadow);
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

.leg-rider-thumb {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
}

.leg-store-thumb {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 50%;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
}

/* Pin gotícula + casa (sem máscara circular) */
.leg-house-thumb {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
}

.leg--leg1 i.leg-dash--sample {
  height: 4px;
  width: 28px;
  border-radius: 2px;
  background: repeating-linear-gradient(90deg, #ccff00 0 4px, transparent 4px 7px);
  box-shadow: 0 0 8px rgba(204, 255, 0, 0.65);
}

.leg--leg2 i.leg-line--sample {
  height: 4px;
  width: 28px;
  border-radius: 2px;
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.65);
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
/* Leaflet aplica a class no <img> do marcador */
.bo-store-marker-icon {
  border-radius: 50%;
  object-fit: cover;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}

.bo-customer-marker-icon {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
}

.bo-courier-marker-icon {
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4));
}

.bo-courier-marker-icon--anim {
  animation: bo-courier-bob 1.1s ease-in-out infinite;
}

@keyframes bo-courier-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
</style>
