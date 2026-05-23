<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="GoEverywhere" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
      <div class="header-right">
        <button class="online-pill" :class="{ paused: courierPaused }" @click="handleTogglePause">
          <span class="online-dot" :class="{ 'paused-dot': courierPaused }"></span>
          <span>{{ courierPaused ? 'Em Pausa' : 'Online' }}</span>
        </button>
        <button class="header-icon-btn" @click="showFilters = true" title="Filtros">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
        </button>
      </div>
    </div>

    <LocationPermissionBanner v-if="!courierPaused" />

    <!-- Filter chips & map -->
    <div class="page-body">
      <!-- Filter chips -->
      <div class="chip-bar">
        <button class="filter-chip" :class="{ active: showFilters }" @click="showFilters = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Filtros
        </button>
        <button class="filter-chip" :class="{ active: store.filters.type === 'normal' }" @click="toggleFilter('normal')">Normal</button>
        <button class="filter-chip" :class="{ active: store.filters.type === 'urgente' }" @click="toggleFilter('urgente')">Urgente</button>
        <button class="filter-chip" :class="{ active: store.filters.maxPickupDist <= 15 }" @click="toggleDistance()">≤15km</button>
        <router-link to="/history" class="filter-chip history-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Histórico
        </router-link>
      </div>

      <!-- Map -->
      <div class="card mini-map-card">
        <div ref="mapEl" class="mini-map"></div>
        <div class="map-controls">
          <button class="map-zoom" @click="zoomIn">+</button>
          <button class="map-zoom" @click="zoomOut">−</button>
        </div>
      </div>

      <!-- Active delivery banner -->
      <div v-if="active" class="active-banner" @click="goToActive">
        <div class="ab-left">
          <span class="ab-state">{{ deliveryStateLabels[active.state] }}</span>
          <span v-if="courierPaused" class="ab-pause-hint">· estafeta em pausa</span>
          <span class="ab-order">{{ active.orderId }} — {{ active.destination.address || active.pickup.name }}</span>
        </div>
        <svg class="ab-arrow" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      <!-- List header -->
      <div class="list-header">
        <span class="list-count">{{ list.length }} entrega{{ list.length > 1 ? 's' : '' }} disponíve{{ list.length > 1 ? 'is' : 'l' }}</span>
        <span class="list-sort">Ordenado por prioridade</span>
      </div>

      <!-- Delivery cards -->
      <div class="delivery-list" :class="{ 'is-syncing': deliveriesSyncing }">
        <div v-if="deliveriesSyncing" class="list-sync-overlay" aria-hidden="true">
          <span class="list-sync-spinner"></span>
        </div>
        <DeliveryCard
          v-for="d in list"
          :key="d.id"
          :delivery="d"
          @accept="handleAccept"
          @details="goToDetail"
        />
      </div>

      <p class="empty-state" v-if="!list.length && !active">
        Nenhuma entrega disponível.
      </p>
    </div>

    <FilterPanel v-model="showFilters" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import {
  store,
  filteredDeliveries,
  activeDelivery,
  acceptDelivery,
  fetchDeliveries,
  togglePause,
  isPaused,
  requestDeviceLocation,
  stopGpsTracking,
  getMapCourierPosition,
  deliveriesSyncing,
} from '../stores/courierStore.js';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  mapboxgl,
  MAP_STYLES,
  isValidCoord,
  fetchMapboxRoute,
  fetchDeliveryRouteLegs,
  toRouteFeature,
  safeFitBounds,
} from '../utils/mapbox.js';
import { setDeliveryMapPins, clearDeliveryMapPins } from '../utils/mapPinLayers.js';

import { deliveryStateLabels } from '../constants.js';
import DeliveryCard from '../components/DeliveryCard.vue';
import FilterPanel from '../components/FilterPanel.vue';
import LocationPermissionBanner from '../components/LocationPermissionBanner.vue';

const router = useRouter();
const route = useRoute();
const showFilters = ref(false);
const mapEl = ref(null);
let map = null;
let listMapRenderSeq = 0;
let listMapMounted = false;
let listMapStylePending = false;
let listGpsRenderTimer = null;

function canUseListMap(seq, mapRef) {
  return (
    listMapMounted &&
    seq === listMapRenderSeq &&
    mapRef &&
    map === mapRef &&
    mapRef.isStyleLoaded()
  );
}

function teardownListMap() {
  listMapMounted = false;
  listMapRenderSeq += 1;
  listMapStylePending = false;
  if (listGpsRenderTimer) {
    clearTimeout(listGpsRenderTimer);
    listGpsRenderTimer = null;
  }
  clearDeliveryMapPins(map);
  try {
    map?.remove();
  } catch { /* */ }
  map = null;
}

const courierPaused = computed(() => isPaused());

const list = computed(() => filteredDeliveries.value);
const active = computed(() => activeDelivery.value);
/** Mini-mapa: com entrega ativa só essa; senão pedidos disponíveis */
const mapDeliveries = computed(() => {
  if (active.value?.pickup && active.value?.destination) {
    return [active.value];
  }
  return list.value.filter((d) => d.pickup && d.destination);
});

function toggleFilter(type) {
  store.filters.type = store.filters.type === type ? 'all' : type;
}
function toggleDistance() {
  store.filters.maxPickupDist = store.filters.maxPickupDist <= 15 ? 50 : 15;
}

async function handleAccept(id) {
  const ok = await acceptDelivery(id);
  if (!ok) return;
  await requestDeviceLocation({ force: true });
  goToDetail(id);
}
function goToDetail(id) {
  teardownListMap();
  router.push(`/deliveries/${id}`);
}
function goToActive() {
  if (!active.value) return;
  teardownListMap();
  router.push(`/deliveries/${active.value.id}`);
}

async function handleTogglePause() {
  await togglePause();
}

function zoomIn() { map?.zoomTo(map.getZoom() + 1); }
function zoomOut() { map?.zoomTo(map.getZoom() - 1); }

function clearListRouteLayers() {
  for (const id of ['list-route-leg1', 'list-route-leg2', 'list-route-line']) {
    try {
      if (map?.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
      if (map?.getSource(id)) map.removeSource(id);
    } catch { /* */ }
  }
}

function setListRouteLayer(sourceId, feature, color, dash = null) {
  if (!map?.isStyleLoaded() || !feature) return;
  const layerId = `${sourceId}-line`;
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(feature);
    map.setPaintProperty(layerId, 'line-color', color);
  } else {
    map.addSource(sourceId, { type: 'geojson', data: feature });
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': color,
        'line-width': sourceId.includes('leg1') ? 4 : 5,
        'line-opacity': 0.9,
        ...(dash ? { 'line-dasharray': dash } : {}),
      },
    });
  }
}

let pollInterval = null;

onMounted(async () => {
  listMapMounted = true;
  await fetchDeliveries();
  if (!courierPaused.value) {
    void requestDeviceLocation();
  }

  await nextTick();
  if (!listMapMounted || !mapEl.value) return;
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: MAP_STYLES.overview,
    center: [-8.63, 41.15],
    zoom: 11,
    attributionControl: false,
  });
  map.on('dragstart', () => { listMapViewLocked = true; });
  map.on('zoomstart', (ev) => { if (ev?.originalEvent) listMapViewLocked = true; });
  map.on('load', () => {
    if (listMapMounted) scheduleListMapRender({ refit: true });
  });
  setTimeout(() => {
    if (listMapMounted) map?.resize();
  }, 120);

  // Poll for new deliveries every 15s
  pollInterval = setInterval(() => fetchDeliveries({ silent: true, syncUi: true }), 30000);
});


watch(mapDeliveries, () => {
  scheduleListMapRender({ refit: !listMapViewLocked });
}, { deep: true });

watch(() => active.value?.id, () => {
  scheduleListMapRender({ refit: true });
});

watch(() => store.gpsCoords, () => {
  if (!listMapMounted || route.name !== 'Deliveries') return;
  clearTimeout(listGpsRenderTimer);
  listGpsRenderTimer = setTimeout(() => scheduleListMapRender({ refit: false }), 400);
}, { deep: true });

onBeforeRouteLeave(() => {
  teardownListMap();
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
  teardownListMap();
});

let listMapViewLocked = false;

function scheduleListMapRender(opts = {}) {
  if (!listMapMounted || !map) return;
  void renderMap(opts);
}

async function renderMap({ refit = false } = {}) {
  if (!listMapMounted || !map) return;
  const mapRef = map;

  if (!mapRef.isStyleLoaded()) {
    if (!listMapStylePending) {
      listMapStylePending = true;
      mapRef.once('style.load', () => {
        listMapStylePending = false;
        if (listMapMounted && map === mapRef) scheduleListMapRender({ refit });
      });
    }
    return;
  }

  const seq = ++listMapRenderSeq;

  clearListRouteLayers();

  const fitLngLat = [];
  let courierPos = null;
  const focus = active.value || mapDeliveries.value[0];
  if (!focus?.pickup || !focus?.destination) return;

  const p = focus.pickup;
  const dst = focus.destination;
  if (!isValidCoord(p) || !isValidCoord(dst)) return;

  courierPos = active.value ? getMapCourierPosition(focus) : null;
  if (courierPos) {
    const legs = await fetchDeliveryRouteLegs(courierPos, p, dst);
    if (!canUseListMap(seq, mapRef)) return;
    setListRouteLayer('list-route-leg1', legs.leg1, '#38bdf8', [2, 1.5]);
    setListRouteLayer('list-route-leg2', legs.leg2, '#22c55e');
    fitLngLat.push([courierPos.lng, courierPos.lat]);
  } else {
    const routeLine = await fetchMapboxRoute([p, dst]);
    if (!canUseListMap(seq, mapRef)) return;
    setListRouteLayer('list-route-line', toRouteFeature(routeLine?.geometry), '#2563eb', [2, 1.5]);
  }

  if (!canUseListMap(seq, mapRef)) return;

  await setDeliveryMapPins(mapRef, { store: p, home: dst, courier: courierPos });
  if (!canUseListMap(seq, mapRef)) return;

  fitLngLat.push([p.lng, p.lat], [dst.lng, dst.lat]);

  if (fitLngLat.length > 0 && refit && !listMapViewLocked) {
    const lngs = fitLngLat.map((c) => c[0]);
    const lats = fitLngLat.map((c) => c[1]);
    safeFitBounds(
      mapRef,
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 28, maxZoom: active.value ? 14 : 12, duration: refit ? 300 : 0 },
    );
  }
}

</script>

<style scoped>
.logo-mini {
  width: 36px; height: 34px;
  border-radius: 14px; object-fit: cover;
}
.header-title {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.header-right {
  margin-left: auto;
  display: flex; align-items: center; gap: 8px;
}
.online-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: #f0fdf4;
  border: 0.72px solid #dcfce7;
  border-radius: var(--ge-radius-full);
  font-size: 11px; font-weight: 600;
  color: #1b8a4a;
  cursor: pointer;
  transition: all 0.2s;
}
.online-pill.paused {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.online-dot {
  width: 8px; height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}
.online-dot.paused-dot {
  background: #f59e0b;
  animation: none;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.header-icon-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  color: #6b7280;
}

/* Stats bar */
.stats-bar {
  display: flex;
  padding: 12px 16px;
  gap: 4px;
  background: #fff;
  border-bottom: 0.72px solid #e5e7eb;
}
.stat-item {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; gap: 2px;
}
.stat-label {
  font-size: 10px; color: #9ca3af;
}
.stat-value {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
  display: flex; align-items: center; gap: 3px;
}
.stat-value-green { color: #1b8a4a; }

/* Chip bar */
.chip-bar {
  display: flex; gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.chip-bar::-webkit-scrollbar { display: none; }
.filter-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: var(--ge-radius-full);
  font-size: 12px; font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
}
.filter-chip.active {
  background: var(--ge-brand);
  color: #fff;
  border-color: var(--ge-brand);
}
.history-chip {
  margin-left: auto;
  background: #f9fafb;
}

/* Map */
.mini-map-card {
  position: relative;
  margin-bottom: 16px;
  border-radius: 16px;
  overflow: hidden;
}
.mini-map {
  height: 200px;
  background: var(--ge-page);
}
:deep(.mapboxgl-canvas) { outline: none; }
:deep(.mapboxgl-marker) { pointer-events: none; }
:deep(.ge-map-marker-icon) {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
}
.map-controls {
  position: absolute;
  bottom: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 4px;
  z-index: 10;
}
.map-zoom {
  width: 32px; height: 32px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 8px;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #111827;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* Active banner */
.active-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ge-brand), var(--ge-brand-hover));
  border-radius: 16px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(27,138,74,0.3);
}
.ab-left { display: flex; flex-direction: column; gap: 2px; }
.ab-state { font-size: 11px; font-weight: 700; text-transform: uppercase; opacity: 0.85; }
.ab-pause-hint { font-size: 11px; font-weight: 500; color: #b45309; }
.ab-order { font-size: 13px; font-weight: 600; display: block; margin-top: 2px; }
.ab-arrow { opacity: 0.7; }

/* List header */
.list-header {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.list-count {
  font-size: 12px; font-weight: 500; color: #111827;
}
.list-sort {
  font-size: 10px; color: #9ca3af;
}

/* Delivery list */
.delivery-list {
  position: relative;
  display: flex; flex-direction: column; gap: 12px;
}
.delivery-list.is-syncing {
  min-height: 48px;
}
.list-sync-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 24px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 12px;
  pointer-events: none;
}
.list-sync-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--ge-brand, #1b8a4a);
  border-radius: 50%;
  animation: list-spin 0.7s linear infinite;
}
@keyframes list-spin {
  to { transform: rotate(360deg); }
}
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
