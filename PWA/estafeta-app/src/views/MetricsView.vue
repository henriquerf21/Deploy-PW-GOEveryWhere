<template>
  <div class="page">
    <div class="page-header">
      <h1>Registos e Métricas</h1>
    </div>

    <div class="page-body">
      <div class="card block">
        <h3>Objetivo mensal</h3>
        <div class="goal-pct">{{ monthlyObjectivePct }}%</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${monthlyObjectivePct}%` }"></div>
        </div>
        <p class="subtle">Atingiste {{ monthlyObjectivePct }}% de entregas mensais estipuladas.</p>
      </div>

      <div class="card block">
        <h3>Taxa de faturação</h3>
        <div class="ring-row">
          <div class="ring" :style="{ '--pct': billingGoalPct }">
            <div class="ring-inner">
              <small>Total</small>
              <strong>{{ billingGoalPct }}%</strong>
            </div>
          </div>
          <div class="ring-side">
            <div class="ring-main">{{ metrics.totalEarnings.toFixed(0) }}<small>/{{ billingGoalEuro }}</small></div>
            <p>Atingiste {{ billingGoalPct }}% do teu objetivo de faturação semanal.</p>
          </div>
        </div>
      </div>

      <div class="card block">
        <h3>Kilómetros semanais</h3>
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

      <div class="card block">
        <h3>Avaliações</h3>
        <div class="rating-row">
          <div class="rating-badge"><span v-html="SVG.star"></span></div>
          <div class="rating-main">{{ metrics.avgRating }}/5</div>
          <div class="rating-stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= roundedRating }">★</span>
          </div>
        </div>
      </div>

      <div class="map-section card">
        <div class="chart-title">Mapa de Entregas (ativas e concluídas)</div>
        <div ref="mapContainer" class="map-container"></div>
        <p v-if="!mapPoints.length" class="empty-text">Sem localizações de entrega disponíveis.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { store, courierMetrics } from '../stores/courierStore.js';
import { SVG } from '../constants.js';

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
  for (const d of [...store.completedDeliveries, ...store.deliveries]) byId.set(d.id, d);
  return [...byId.values()].filter((d) => !!d.pickup && !!d.destination);
});

// Map points from all deliveries (pending/active/completed)
const mapPoints = computed(() => {
  const points = [];
  for (const d of deliveriesForMap.value) {
    if (d.pickup?.lat != null && d.pickup?.lng != null) {
      points.push({ lat: d.pickup.lat, lng: d.pickup.lng, name: d.pickup.name, type: 'pickup', orderId: d.orderId, state: d.state });
    }
    if (d.destination?.lat != null && d.destination?.lng != null) {
      points.push({ lat: d.destination.lat, lng: d.destination.lng, name: d.destination.name, type: 'delivery', orderId: d.orderId, state: d.state });
    }
  }
  return points;
});

// Map initialization
onMounted(async () => {
  await nextTick();
  if (mapContainer.value && mapPoints.value.length) {
    initMap();
  }
});

watch(
  mapPoints,
  (pts) => {
    if (!pts.length) {
      if (mapLayer) mapLayer.clearLayers();
      return;
    }
    if (mapContainer.value && !mapInstance) {
      initMap();
      return;
    }
    if (mapInstance) renderMapPoints();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    mapLayer = null;
    leafletLib = null;
  }
});

async function initMap() {
  try {
    const L = await import('leaflet');
    leafletLib = L;
    await import('leaflet/dist/leaflet.css');

    const center = mapPoints.value.length
      ? [mapPoints.value[0].lat, mapPoints.value[0].lng]
      : [41.1579, -8.6291]; // Porto default

    mapInstance = L.map(mapContainer.value).setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(mapInstance);

    mapLayer = L.layerGroup().addTo(mapInstance);
    renderMapPoints();

    // Fix map rendering in hidden containers
    setTimeout(() => { mapInstance.invalidateSize(); }, 200);
  } catch (err) {
    console.warn('Map init error:', err);
  }
}

function renderMapPoints() {
  if (!mapInstance || !mapLayer || !leafletLib) return;
  mapLayer.clearLayers();

  // Draw pickup -> delivery legs with style by state
  for (const d of deliveriesForMap.value) {
    const p = d.pickup;
    const dst = d.destination;
    if (p?.lat == null || p?.lng == null || dst?.lat == null || dst?.lng == null) continue;
    const isCompleted = d.state === 'E-13';
    const isFailed = d.state === 'E-14';
    const line = leafletLib.polyline(
      [[p.lat, p.lng], [dst.lat, dst.lng]],
      {
        color: isCompleted ? '#00c853' : isFailed ? '#ef4444' : '#1d4ed8',
        weight: isCompleted ? 4 : 3.5,
        opacity: 0.9,
        dashArray: isCompleted ? null : isFailed ? '4 8' : '10 8',
      }
    );
    const stateLabel = isCompleted ? 'Concluída' : isFailed ? 'Falhada' : 'Em curso';
    line.bindPopup(`<strong>${d.orderId}</strong><br/>Rota ${stateLabel}`);
    mapLayer.addLayer(line);
  }

  for (const pt of mapPoints.value) {
    const color = pt.type === 'pickup' ? '#ff9100' : pt.state === 'E-13' ? '#00c853' : pt.state === 'E-14' ? '#ef4444' : '#1d4ed8';
    const marker = leafletLib.circleMarker([pt.lat, pt.lng], {
      radius: 8,
      fillColor: color,
      color: '#ffffff',
      weight: 2.5,
      fillOpacity: 0.95,
    }).bindPopup(`<strong>${pt.type === 'pickup' ? 'Recolha' : 'Entrega'}</strong><br>${pt.name}<br><small>${pt.orderId}</small>`);
    mapLayer.addLayer(marker);
  }

  if (mapPoints.value.length > 1) {
    const bounds = leafletLib.latLngBounds(mapPoints.value.map((p) => [p.lat, p.lng]));
    mapInstance.fitBounds(bounds, { padding: [30, 30] });
  }
}
</script>

<style scoped>
.block,
.map-section {
  padding: 16px;
  margin-bottom: 12px;
}
.block h3 {
  margin: 0 0 10px;
  font-size: 17px;
  font-family: var(--ge-font-display);
}
.goal-pct {
  font-size: 50px;
  line-height: 1;
  font-weight: 700;
  margin-bottom: 14px;
}
.progress-track {
  height: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2954ef, #3b82f6);
}
.subtle {
  font-size: 12px;
  color: var(--ge-text-secondary);
  margin: 12px 0 0;
}

.ring-row {
  display: flex;
  gap: 14px;
  align-items: center;
}
.ring {
  --pct: 0;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background:
    conic-gradient(#14b8a6 calc(var(--pct) * 1%), #d9e2ee 0);
  padding: 9px;
  flex-shrink: 0;
}
.ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  text-align: center;
}
.ring-inner small {
  font-size: 12px;
  color: var(--ge-text-muted);
}
.ring-inner strong {
  font-size: 42px;
  line-height: 1;
}
.ring-side .ring-main {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
}
.ring-side .ring-main small {
  font-size: 26px;
  color: var(--ge-text-muted);
}
.ring-side p {
  margin: 10px 0 0;
  color: var(--ge-text-secondary);
}

.semi-wrap {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}
.semi {
  width: 100%;
  display: block;
}
.semi-bg {
  fill: none;
  stroke: #d9e2ee;
  stroke-width: 10;
  stroke-linecap: round;
}
.semi-fg {
  --km-pct: 0;
  fill: none;
  stroke: #7c3aed;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 157;
  stroke-dashoffset: calc(157 - (157 * var(--km-pct) / 100));
}
.semi-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform: translateY(12px);
  text-align: center;
}
.semi-center small {
  color: var(--ge-text-muted);
}
.semi-center strong {
  font-size: 48px;
  line-height: 1;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.rating-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff9e6;
  color: #f59e0b;
}
.rating-badge :deep(svg) {
  width: 28px;
  height: 28px;
  fill: currentColor;
  stroke: currentColor;
}
.rating-main {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}
.rating-stars {
  display: flex;
  gap: 4px;
  font-size: 28px;
}
.rating-stars .star {
  color: #cbd5e1;
}
.rating-stars .star.on {
  color: #fbbf24;
}

.chart-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ge-text-secondary);
  margin-bottom: 12px;
}

/* Map */
.map-container {
  width: 100%;
  height: 240px;
  border-radius: var(--ge-radius);
  overflow: hidden;
  background: var(--ge-page);
}

.empty-text {
  font-size: 13px;
  color: var(--ge-text-muted);
  text-align: center;
  margin: 8px 0 0;
}

@media (max-width: 420px) {
  .goal-pct { font-size: 42px; }
  .ring-side .ring-main { font-size: 36px; }
  .ring-side .ring-main small { font-size: 20px; }
  .semi-center strong { font-size: 38px; }
  .rating-main { font-size: 32px; }
  .rating-stars { font-size: 22px; }
}
</style>
