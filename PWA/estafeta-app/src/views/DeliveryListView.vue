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

    <!-- Stats bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">Ganhos</span>
        <span class="stat-value stat-value-green">€{{ store.shiftStats.earnings.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Entregas</span>
        <span class="stat-value">{{ store.shiftStats.completed }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Avaliação</span>
        <span class="stat-value">{{ store.courier.rating }} <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg></span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Aceitação</span>
        <span class="stat-value">{{ store.courier.onTimeRate }}%</span>
      </div>
    </div>

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
          <span class="ab-order">{{ active.orderId }} — {{ active.destination.name }}</span>
        </div>
        <svg class="ab-arrow" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      <!-- List header -->
      <div class="list-header">
        <span class="list-count">{{ list.length }} entrega{{ list.length > 1 ? 's' : '' }} disponíve{{ list.length > 1 ? 'is' : 'l' }}</span>
        <span class="list-sort">Ordenado por prioridade</span>
      </div>

      <!-- Delivery cards -->
      <div class="delivery-list">
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
import { useRouter } from 'vue-router';
import {
  store,
  filteredDeliveries,
  activeDelivery,
  acceptDelivery,
  fetchDeliveries,
  togglePause,
  isPaused,
  setPausedOnAppOpen,
  startGpsTracking,
  stopGpsTracking,
} from '../stores/courierStore.js';
import { deliveryStateLabels } from '../constants.js';
import DeliveryCard from '../components/DeliveryCard.vue';
import FilterPanel from '../components/FilterPanel.vue';

const router = useRouter();
const showFilters = ref(false);
const mapEl = ref(null);
let map = null;
let leaflet = null;
let layer = null;

const courierPaused = computed(() => isPaused());

const list = computed(() => filteredDeliveries.value);
const active = computed(() => activeDelivery.value);
const mapDeliveries = computed(() => {
  const byId = new Map();
  for (const d of list.value) byId.set(d.id, d);
  if (active.value) byId.set(active.value.id, active.value);
  return [...byId.values()].filter((d) => d.pickup && d.destination);
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
  startGpsTracking(); // Start GPS when delivery accepted
  router.push(`/deliveries/${id}`);
}
function goToDetail(id) { router.push(`/deliveries/${id}`); }
function goToActive() { if (active.value) router.push(`/deliveries/${active.value.id}`); }

async function handleTogglePause() {
  await togglePause();
}

function zoomIn() { map?.zoomIn(); }
function zoomOut() { map?.zoomOut(); }

let pollInterval = null;

onMounted(async () => {
  if (store.activeDeliveryId) {
    router.replace(`/deliveries/${store.activeDeliveryId}`);
    return;
  }

  // Ao abrir a PWA, o estafeta entra em pausa até ativar online manualmente.
  await setPausedOnAppOpen();

  // Refresh deliveries from Strapi
  await fetchDeliveries();

  await nextTick();
  if (!mapEl.value) return;
  const L = await import('leaflet');
  leaflet = L;
  await import('leaflet/dist/leaflet.css');
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView([41.15, -8.63], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  layer = L.layerGroup().addTo(map);
  renderMap();
  setTimeout(() => map?.invalidateSize(), 120);

  // Poll for new deliveries every 15s
  pollInterval = setInterval(() => fetchDeliveries(), 15000);
});

// Force redirect if active delivery detected
watch(() => store.activeDeliveryId, (newId) => {
  if (newId) {
    router.replace(`/deliveries/${newId}`);
  }
}, { immediate: true });

watch([mapDeliveries, active], () => renderMap(), { deep: true });

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
  map?.remove(); map = null; layer = null; leaflet = null;
});

function renderMap() {
  if (!map || !layer || !leaflet) return;
  layer.clearLayers();
  const points = [];
  for (const d of mapDeliveries.value) {
    const p = d.pickup;
    const dst = d.destination;
    if (p?.lat == null || dst?.lat == null) continue;
    const isActive = active.value?.id === d.id;
    const line = leaflet.polyline([[p.lat, p.lng], [dst.lat, dst.lng]], {
      color: isActive ? '#22c55e' : '#2563eb', weight: isActive ? 5 : 3.5,
      opacity: 0.9, dashArray: isActive ? null : '8 7',
    });
    layer.addLayer(line);
    layer.addLayer(leaflet.circleMarker([p.lat, p.lng], { radius: 7, fillColor: '#ff9800', color: '#fff', weight: 2, fillOpacity: 0.95 }));
    layer.addLayer(leaflet.circleMarker([dst.lat, dst.lng], { radius: 7, fillColor: isActive ? '#22c55e' : '#2563eb', color: '#fff', weight: 2, fillOpacity: 0.95 }));
    points.push([p.lat, p.lng], [dst.lat, dst.lng]);
  }
  if (points.length > 1) map.fitBounds(leaflet.latLngBounds(points), { padding: [20, 20], maxZoom: 13 });
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
.ab-order { font-size: 14px; font-weight: 600; }
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
  display: flex; flex-direction: column; gap: 12px;
}
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
