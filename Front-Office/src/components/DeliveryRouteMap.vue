<template>
  <div
    ref="containerRef"
    class="delivery-route-map"
    :class="{ 'is-dim': dimTiles }"
    :style="{ minHeight: height, height: height }"
    role="region"
    :aria-label="ariaLabel"
  />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  storeLat: { type: Number, required: true },
  storeLng: { type: Number, required: true },
  destLat: { type: Number, required: true },
  destLng: { type: Number, required: true },
  /** 0 = junto à loja, 100 = no destino (posição do estafeta na linha) — fallback quando não há GPS real */
  courierProgress: { type: Number, default: 0 },
  /** GPS real do estafeta (latitude). Se fornecido, sobrepõe courierProgress */
  courierLat: { type: Number, default: null },
  /** GPS real do estafeta (longitude). Se fornecido, sobrepõe courierProgress */
  courierLng: { type: Number, default: null },
  height: { type: String, default: '280px' },
  /** Classe CSS no body do mapa (ex.: in-transit) para filtro visual */
  dimTiles: { type: Boolean, default: false },
  ariaLabel: {
    type: String,
    default: 'Mapa com loja de recolha, destino e posição indicativa do estafeta',
  },
  /** false = só visualização; true = zoom com scroll também */
  scrollWheelZoom: { type: Boolean, default: false },
  /** Seguir estradas (OSRM); se false, linha reta entre pontos */
  roadRoute: { type: Boolean, default: true },
  /** Perfil OSRM: driving | cycling | walking */
  routeProfile: {
    type: String,
    default: 'driving',
    validator: (v) => ['driving', 'cycling', 'walking'].includes(v),
  },
});

const containerRef = ref(null);
let map = null;
let layerGroup = null;
let boundsKey = '';
/** @type {number[][] | null} Leaflet [lat, lng][] */
let routeLatLngs = null;
let routeAbort = null;
let storeIcon = null;
let customerIcon = null;
let courierIcon = null;

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

function validCoords() {
  const n = [props.storeLat, props.storeLng, props.destLat, props.destLng];
  return n.every((v) => typeof v === 'number' && !Number.isNaN(v) && v !== 0);
}

function coordsKey() {
  return `${props.storeLat},${props.storeLng},${props.destLat},${props.destLng}`;
}

function straightLineLatLngs() {
  return [
    [props.storeLat, props.storeLng],
    [props.destLat, props.destLng],
  ];
}

function haversineMeters(a, b) {
  const R = 6371000;
  const φ1 = (a[0] * Math.PI) / 180;
  const φ2 = (b[0] * Math.PI) / 180;
  const Δφ = ((b[0] - a[0]) * Math.PI) / 180;
  const Δλ = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Posição ao longo da polilinha, t ∈ [0,1] por distância percorrida */
function pointAlongPolyline(latLngs, t) {
  if (!latLngs || latLngs.length < 2) {
    t = Math.min(1, Math.max(0, t));
    return [
      props.storeLat + (props.destLat - props.storeLat) * t,
      props.storeLng + (props.destLng - props.storeLng) * t,
    ];
  }
  t = Math.min(1, Math.max(0, t));
  const dists = [];
  let total = 0;
  for (let i = 1; i < latLngs.length; i++) {
    const d = haversineMeters(latLngs[i - 1], latLngs[i]);
    dists.push(d);
    total += d;
  }
  if (total === 0) return latLngs[0];
  const target = t * total;
  let acc = 0;
  for (let i = 0; i < dists.length; i++) {
    if (acc + dists[i] >= target) {
      const segT = dists[i] > 0 ? (target - acc) / dists[i] : 0;
      const a = latLngs[i];
      const b = latLngs[i + 1];
      return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT];
    }
    acc += dists[i];
  }
  return latLngs[latLngs.length - 1];
}

function polylinePointsForDraw() {
  if (routeLatLngs && routeLatLngs.length >= 2) return routeLatLngs;
  return straightLineLatLngs();
}

function getStoreIcon() {
  if (!storeIcon) {
    storeIcon = L.icon({
      iconUrl: '/media/map/continente-pin.png',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
      className: 'ge-map-marker-icon ge-store-marker-icon',
    });
  }
  return storeIcon;
}

function getCustomerIcon() {
  if (!customerIcon) {
    customerIcon = L.icon({
      iconUrl: '/media/map/customer-house-pin.png',
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -40],
      className: 'ge-map-marker-icon',
    });
  }
  return customerIcon;
}

function getCourierIcon() {
  if (!courierIcon) {
    courierIcon = L.icon({
      iconUrl: '/media/map/courier-pin.png',
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -40],
      className: 'ge-map-marker-icon ge-map-marker-icon--courier',
    });
  }
  return courierIcon;
}

function scheduleRouteFetch() {
  if (!map || !layerGroup || !validCoords()) return;

  routeAbort?.abort();
  routeAbort = new AbortController();
  const keySnapshot = coordsKey();

  if (!props.roadRoute) {
    routeLatLngs = null;
    boundsKey = '';
    drawLayers();
    return;
  }

  routeLatLngs = null;
  boundsKey = '';
  drawLayers();

  const url = `${OSRM_BASE}/${props.routeProfile}/${props.storeLng},${props.storeLat};${props.destLng},${props.destLat}?overview=full&geometries=geojson`;

  fetch(url, { signal: routeAbort.signal })
    .then((r) => r.json())
    .then((data) => {
      if (coordsKey() !== keySnapshot) return;
      if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
        routeLatLngs = null;
      } else {
        routeLatLngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      }
      boundsKey = '';
      drawLayers();
    })
    .catch((e) => {
      if (e.name === 'AbortError') return;
      if (coordsKey() !== keySnapshot) return;
      routeLatLngs = null;
      boundsKey = '';
      drawLayers();
    });
}

function drawLayers() {
  if (!map || !layerGroup || !validCoords()) return;

  layerGroup.clearLayers();

  const storeLatLng = [props.storeLat, props.storeLng];
  const destLatLng = [props.destLat, props.destLng];
  const linePoints = polylinePointsForDraw();

  L.polyline(linePoints, {
    color: '#10b981',
    weight: 4,
    opacity: 0.75,
    dashArray: '10 8',
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(layerGroup);

  L.marker(storeLatLng, { icon: getStoreIcon() })
    .addTo(layerGroup)
    .bindTooltip('Loja', { permanent: false, direction: 'top' });

  L.marker(destLatLng, { icon: getCustomerIcon() })
    .addTo(layerGroup)
    .bindTooltip('Destino', { permanent: false, direction: 'top' });

  // GPS real do estafeta (prioridade) ou fallback por progresso
  const hasRealGps = props.courierLat != null && props.courierLng != null
    && Number.isFinite(props.courierLat) && Number.isFinite(props.courierLng)
    && props.courierLat !== 0 && props.courierLng !== 0;

  if (hasRealGps) {
    L.marker([props.courierLat, props.courierLng], { icon: getCourierIcon() })
      .addTo(layerGroup)
      .bindTooltip('Estafeta (GPS real)', { permanent: false, direction: 'right' });
  } else {
    const p = Math.min(1, Math.max(0, props.courierProgress / 100));
    if (p > 0 && p < 1) {
      const [clat, clng] = pointAlongPolyline(linePoints, p);
      L.marker([clat, clng], { icon: getCourierIcon() })
        .addTo(layerGroup)
        .bindTooltip('Estafeta (indicativo)', { permanent: false, direction: 'right' });
    }
  }

  const key = `${coordsKey()}|${routeLatLngs ? 'r' : 's'}`;
  const bounds = L.latLngBounds(linePoints).pad(0.18);
  if (key !== boundsKey) {
    boundsKey = key;
    map.fitBounds(bounds, { animate: false });
  }
}

function initMap() {
  if (!containerRef.value) return;

  map = L.map(containerRef.value, {
    scrollWheelZoom: props.scrollWheelZoom,
    zoomControl: true,
    attributionControl: true,
  });

  if (!validCoords()) {
    map.setView([41.15, -8.63], 10);
  }

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a>',
  }).addTo(map);

  map.attributionControl.addAttribution(
    'Rotas © <a href="https://project-osrm.org/" rel="noreferrer">OSRM</a>'
  );

  layerGroup = L.layerGroup().addTo(map);
  scheduleRouteFetch();

  setTimeout(() => map?.invalidateSize(), 100);
}

function destroyMap() {
  routeAbort?.abort();
  routeAbort = null;
  routeLatLngs = null;
  if (map) {
    map.remove();
    map = null;
    layerGroup = null;
    boundsKey = '';
  }
}

watch(
  () => [props.storeLat, props.storeLng, props.destLat, props.destLng, props.roadRoute, props.routeProfile],
  () => {
    if (map && layerGroup) scheduleRouteFetch();
  }
);

watch(
  () => [props.courierProgress, props.courierLat, props.courierLng, props.dimTiles],
  () => {
    if (map && layerGroup) drawLayers();
  }
);

watch(
  () => props.height,
  () => {
    nextTick(() => map?.invalidateSize());
  }
);

function onResize() {
  map?.invalidateSize();
}

onMounted(() => {
  nextTick(() => initMap());
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  destroyMap();
});
</script>

<style scoped>
.delivery-route-map {
  width: 100%;
  border-radius: var(--cf-radius, 12px);
  overflow: hidden;
  z-index: 0;
  background: #e2e8f0;
}

.delivery-route-map :deep(.leaflet-control-attribution) {
  font-size: 10px;
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-dim :deep(.leaflet-tile-pane) {
  filter: saturate(0.92) brightness(1.02);
}

.delivery-route-map :deep(.ge-map-marker-icon) {
  background: transparent !important;
  border: none !important;
  filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.3));
}
</style>
