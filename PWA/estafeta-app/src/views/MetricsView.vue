<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Title bar -->
    <div class="title-bar">
      <h1>Registos e Métricas</h1>
    </div>

    <div class="page-body">
      <!-- Objetivo mensal -->
      <div class="metric-card">
        <h3>Objetivo mensal <span class="metric-pct-badge">{{ monthlyObjectivePct }}%</span></h3>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${monthlyObjectivePct}%` }"></div>
        </div>
        <p class="metric-desc">Atingiste {{ monthlyObjectivePct }}% de entregas mensais estipuladas.</p>
      </div>

      <!-- Taxa de Faturação -->
      <div class="metric-card">
        <h3>Taxa de Faturação</h3>
        <div class="ring-row">
          <div class="ring" :style="{ '--pct': billingGoalPct }">
            <div class="ring-inner">
              <small>Total</small>
              <strong>{{ billingGoalPct }}%</strong>
            </div>
          </div>
          <div class="ring-side">
            <div class="ring-main">{{ metrics.totalEarnings.toFixed(0) }}<small>/{{ billingGoalEuro }}</small></div>
            <p class="metric-desc">Atingiste {{ billingGoalPct }}% do teu objetivo de faturação semanal.</p>
          </div>
        </div>
      </div>

      <!-- Kilometros Semanais -->
      <div class="metric-card">
        <h3>Kilometros Semanais</h3>
        <div class="semi-wrap">
          <svg class="semi" viewBox="0 0 120 70" aria-hidden="true">
            <path d="M10 60 A50 50 0 0 1 110 60" class="semi-bg" />
            <path d="M10 60 A50 50 0 0 1 110 60" class="semi-fg" :style="{ '--km-pct': kmGoalPct }" />
          </svg>
          <div class="semi-center">
            <small>Total</small>
            <strong>{{ metrics.totalDistanceKm }}km</strong>
          </div>
        </div>
      </div>

      <!-- Avaliações -->
      <div class="metric-card">
        <h3>Avaliações <span class="rating-badge-sm">★</span></h3>
        <div class="rating-row">
          <div class="rating-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg>
          </div>
          <div class="rating-value">{{ metrics.avgRating }}/5</div>
          <div class="rating-stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= roundedRating }">★</span>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="metric-card">
        <h3>Mapa de Entregas</h3>
        <div ref="mapContainer" class="map-container"></div>
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
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { store, courierMetrics, fetchCompletedDeliveries } from '../stores/courierStore.js';

const mapContainer = ref(null);
let mapInstance = null;
let mapLayer = null;
let leafletLib = null;

const metrics = computed(() => courierMetrics.value);
const monthlyTargetDeliveries = 40;
const billingGoalEuro = 500;
const weeklyKmGoal = 200;

const monthlyObjectivePct = computed(() => {
  const p = Math.round((metrics.value.completedDeliveries / monthlyTargetDeliveries) * 100);
  return Math.max(0, Math.min(100, p));
});
const billingGoalPct = computed(() => {
  const p = Math.round((metrics.value.totalEarnings / billingGoalEuro) * 100);
  return Math.max(0, Math.min(100, p));
});
const kmGoalPct = computed(() => {
  const p = (metrics.value.totalDistanceKm / weeklyKmGoal) * 100;
  return Math.max(0, Math.min(100, p));
});
const roundedRating = computed(() => Math.max(1, Math.min(5, Math.round(metrics.value.avgRating || 0))));

const deliveriesForMap = computed(() => {
  const byId = new Map();
  for (const d of [...(store.completedDeliveries || []), ...store.deliveries]) byId.set(d.id, d);
  return [...byId.values()].filter((d) => !!d.pickup && !!d.destination);
});

const mapPoints = computed(() => {
  const points = [];
  for (const d of deliveriesForMap.value) {
    if (d.pickup?.lat != null) points.push({ lat: d.pickup.lat, lng: d.pickup.lng, name: d.pickup.name, type: 'pickup', orderId: d.orderId, state: d.state });
    if (d.destination?.lat != null) points.push({ lat: d.destination.lat, lng: d.destination.lng, name: d.destination.name, type: 'delivery', orderId: d.orderId, state: d.state });
  }
  return points;
});

onMounted(async () => {
  await fetchCompletedDeliveries();
  await nextTick();
  if (mapContainer.value && mapPoints.value.length) initMap();
});

watch(mapPoints, (pts) => {
  if (!pts.length) { if (mapLayer) mapLayer.clearLayers(); return; }
  if (mapContainer.value && !mapInstance) { initMap(); return; }
  if (mapInstance) renderMapPoints();
}, { deep: true });

onBeforeUnmount(() => { mapInstance?.remove(); mapInstance = null; mapLayer = null; leafletLib = null; });

async function initMap() {
  try {
    const L = await import('leaflet');
    leafletLib = L;
    await import('leaflet/dist/leaflet.css');
    const center = mapPoints.value.length ? [mapPoints.value[0].lat, mapPoints.value[0].lng] : [41.1579, -8.6291];
    mapInstance = L.map(mapContainer.value, { zoomControl: false, attributionControl: false }).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(mapInstance);
    mapLayer = L.layerGroup().addTo(mapInstance);
    renderMapPoints();
    setTimeout(() => mapInstance?.invalidateSize(), 200);
  } catch (err) { console.warn('Map init error:', err); }
}

function renderMapPoints() {
  if (!mapInstance || !mapLayer || !leafletLib) return;
  mapLayer.clearLayers();
  for (const d of deliveriesForMap.value) {
    const p = d.pickup; const dst = d.destination;
    if (!p?.lat || !dst?.lat) continue;
    const isCompleted = d.state === 'E-13';
    const routeColor = isCompleted ? '#22c55e' : '#2563eb';
    mapLayer.addLayer(leafletLib.polyline([[p.lat, p.lng], [dst.lat, dst.lng]], { color: routeColor, weight: 4, opacity: 0.9, dashArray: isCompleted ? null : '10 8' }));
  }
  for (const pt of mapPoints.value) {
    const color = pt.type === 'pickup' ? '#ff9800' : pt.state === 'E-13' ? '#22c55e' : '#2563eb';
    mapLayer.addLayer(leafletLib.circleMarker([pt.lat, pt.lng], { radius: 7, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.95 }));
  }
  if (mapPoints.value.length > 1) mapInstance.fitBounds(leafletLib.latLngBounds(mapPoints.value.map(p => [p.lat, p.lng])), { padding: [30, 30] });
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
.title-bar {
  padding: 8px 16px;
  background: #fff;
  border-top: 0.72px solid #e5e7eb;
}
.title-bar h1 {
  font-family: var(--ge-font-display);
  font-size: 16px; font-weight: 700;
  margin: 0; color: #111827;
}

/* Metric cards */
.metric-card {
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.metric-card h3 {
  margin: 0 0 12px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  color: #111827;
  display: flex; align-items: center; gap: 8px;
}
.metric-pct-badge {
  background: #eff6ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: var(--ge-radius-full);
  font-size: 11px; font-weight: 700;
}
.metric-desc {
  font-size: 12px; color: #6b7280;
  margin: 10px 0 0;
}

/* Progress bar */
.progress-track {
  height: 10px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.5s var(--ge-ease);
}

/* Ring */
.ring-row {
  display: flex; gap: 16px; align-items: center;
}
.ring {
  --pct: 0;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: conic-gradient(#14b8a6 calc(var(--pct) * 1%), #e5e7eb 0);
  padding: 8px;
  flex-shrink: 0;
}
.ring-inner {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: #fff;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
}
.ring-inner small { font-size: 10px; color: #9ca3af; }
.ring-inner strong { font-size: 24px; font-weight: 700; }
.ring-side { flex: 1; }
.ring-main {
  font-size: 32px; font-weight: 700; line-height: 1;
}
.ring-main small { font-size: 18px; color: #9ca3af; }
.ring-side p { margin: 8px 0 0; }

/* Semi-circle */
.semi-wrap {
  position: relative;
  width: 100%; max-width: 240px;
  margin: 0 auto;
}
.semi { width: 100%; display: block; }
.semi-bg {
  fill: none; stroke: #e5e7eb;
  stroke-width: 10; stroke-linecap: round;
}
.semi-fg {
  --km-pct: 0;
  fill: none; stroke: #8b5cf6;
  stroke-width: 10; stroke-linecap: round;
  stroke-dasharray: 157;
  stroke-dashoffset: calc(157 - (157 * var(--km-pct) / 100));
  transition: stroke-dashoffset 0.5s var(--ge-ease);
}
.semi-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transform: translateY(8px);
  text-align: center;
}
.semi-center small { color: #9ca3af; font-size: 10px; }
.semi-center strong {
  font-size: 28px; font-weight: 700;
  font-family: var(--ge-font-display);
}

/* Rating */
.rating-badge-sm {
  color: #f59e0b; font-size: 14px;
}
.rating-row {
  display: flex; align-items: center; gap: 12px;
}
.rating-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #fffbeb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rating-value {
  font-size: 28px; font-weight: 700;
  font-family: var(--ge-font-display);
}
.rating-stars {
  display: flex; gap: 2px; font-size: 20px;
}
.star { color: #e5e7eb; }
.star.on { color: #fbbf24; }

/* Map */
.map-container {
  width: 100%; height: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--ge-page);
}

/* Footer */
.app-footer {
  text-align: center; padding: 32px 28px;
}
.footer-brand {
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  margin-bottom: 8px;
}
.footer-g {
  width: 28px; height: 28px;
  background: #1b8a4a; color: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
}
.footer-name {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.footer-copy { font-size: 11px; color: #9ca3af; margin: 0; }
</style>
