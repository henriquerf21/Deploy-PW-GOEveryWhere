<template>
  <div class="page">
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.svg" alt="GoEverywhere" class="logo-mini" />
      <h1>Entregas</h1>
      <button class="filter-fab" @click="showFilters = true" title="Filtros">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
        <span v-if="hasActiveFilters" class="filter-dot"></span>
      </button>
    </div>

    <!-- Active delivery banner -->
    <div v-if="active" class="active-banner" @click="goToActive">
      <div class="ab-left">
        <span class="ab-state">{{ deliveryStateLabels[active.state] }}</span>
        <span class="ab-order">{{ active.orderId }} — {{ active.destination.name }}</span>
      </div>
      <svg class="ab-arrow" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </div>

    <div class="page-body">
      <div class="card mini-map-card">
        <div class="mini-map-head">
          <strong>Mapa das Entregas do Turno</strong>
          <span>{{ mapDeliveries.length }} rota{{ mapDeliveries.length === 1 ? '' : 's' }}</span>
        </div>
        <div ref="mapEl" class="mini-map"></div>
      </div>

      <p class="list-count" v-if="list.length">{{ list.length }} entrega{{ list.length > 1 ? 's' : '' }} disponíve{{ list.length > 1 ? 'is' : 'l' }}</p>
      <p class="empty-state" v-if="!list.length && !active">
        Nenhuma entrega disponível com os filtros atuais.<br>
        <button class="btn btn-secondary" style="margin-top:12px" @click="showFilters = true">Ajustar Filtros</button>
      </p>

      <div class="delivery-list">
        <DeliveryCard
          v-for="d in list"
          :key="d.id"
          :delivery="d"
          @accept="handleAccept"
          @details="goToDetail"
        />
      </div>
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

const list = computed(() => filteredDeliveries.value);
const active = computed(() => activeDelivery.value);
const mapDeliveries = computed(() => {
  const byId = new Map();
  for (const d of list.value) byId.set(d.id, d);
  if (active.value) byId.set(active.value.id, active.value);
  return [...byId.values()].filter((d) => d.pickup && d.destination);
});

const hasActiveFilters = computed(() => {
  const f = store.filters;
  return f.type !== 'all' || f.maxPickupDist < 50 || f.maxDeliveryDist < 50 || f.maxTime < 120 || f.zone !== 'all';
});

function handleAccept(id) {
  acceptDelivery(id);
  router.push(`/deliveries/${id}`);
}

function goToDetail(id) {
  router.push(`/deliveries/${id}`);
}

function goToActive() {
  if (active.value) router.push(`/deliveries/${active.value.id}`);
}

onMounted(async () => {
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
});

watch([mapDeliveries, active], () => renderMap(), { deep: true });

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  layer = null;
  leaflet = null;
});

function renderMap() {
  if (!map || !layer || !leaflet) return;
  layer.clearLayers();
  const points = [];
  for (const d of mapDeliveries.value) {
    const p = d.pickup;
    const dst = d.destination;
    if (p?.lat == null || p?.lng == null || dst?.lat == null || dst?.lng == null) continue;
    const isActive = active.value?.id === d.id;
    const line = leaflet.polyline(
      [[p.lat, p.lng], [dst.lat, dst.lng]],
      {
        color: isActive ? '#00e676' : '#2563eb',
        weight: isActive ? 5 : 3.5,
        opacity: 0.9,
        dashArray: isActive ? null : '8 7',
      }
    ).bindPopup(`<strong>${d.orderId}</strong><br/>${isActive ? 'Entrega em curso' : 'Disponível'}`);
    layer.addLayer(line);

    const pickup = leaflet.circleMarker([p.lat, p.lng], {
      radius: 7, fillColor: '#ff9800', color: '#fff', weight: 2, fillOpacity: 0.95,
    }).bindPopup(`Recolha · ${p.name}<br/><small>${d.orderId}</small>`);
    layer.addLayer(pickup);

    const dest = leaflet.circleMarker([dst.lat, dst.lng], {
      radius: 7, fillColor: isActive ? '#00e676' : '#2563eb', color: '#fff', weight: 2, fillOpacity: 0.95,
    }).bindPopup(`Entrega · ${dst.name}<br/><small>${d.orderId}</small>`);
    layer.addLayer(dest);
    points.push([p.lat, p.lng], [dst.lat, dst.lng]);
  }
  if (points.length > 1) {
    map.fitBounds(leaflet.latLngBounds(points), { padding: [20, 20], maxZoom: 13 });
  }
}
</script>

<style scoped>
.logo-mini {
  width: 32px; height: 32px;
  border-radius: 6px;
  object-fit: contain;
}
.filter-fab {
  margin-left: auto;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--ge-radius);
  background: var(--ge-page);
  color: var(--ge-text);
  position: relative;
}
.filter-dot {
  position: absolute; top: 6px; right: 6px;
  width: 8px; height: 8px;
  background: var(--ge-brand);
  border-radius: 50%;
  border: 2px solid var(--ge-surface);
}
.active-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 var(--ge-sp-base) var(--ge-sp-sm);
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--ge-brand), var(--ge-brand-hover));
  border-radius: var(--ge-radius-lg);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(27,138,74,0.3);
}
.ab-left { display: flex; flex-direction: column; gap: 2px; }
.ab-state { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; }
.ab-order { font-size: 14px; font-weight: 600; }
.ab-arrow { opacity: 0.7; }
.list-count {
  font-size: 12px;
  color: var(--ge-text-muted);
  margin: 0 0 12px;
  font-weight: 500;
}
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--ge-text-muted);
  font-size: 14px;
  line-height: 1.6;
}
.delivery-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mini-map-card {
  padding: 10px;
  margin-bottom: 12px;
}
.mini-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ge-text-secondary);
  margin: 2px 4px 8px;
}
.mini-map {
  height: 180px;
  border-radius: var(--ge-radius);
  overflow: hidden;
  background: var(--ge-page);
}
</style>
