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
import {
  fetchDeliveryLegs,
  fetchStoreToDestLeg,
  fetchRouteThroughPoints,
  deliveryLegsStraightLine,
  straightLinePoints,
} from '@/utils/osrmRouting.js';
import { LEAFLET_LIGHT_TILE } from '@/utils/leafletBasemap.js';

const MAP_BASE = `${import.meta.env.BASE_URL}media/map/`;
import { isGpsPlausibleForRoute } from '@/utils/geo.js';

const props = defineProps({
  storeLat: { type: Number, required: true },
  storeLng: { type: Number, required: true },
  destLat: { type: Number, required: true },
  destLng: { type: Number, required: true },
  /** 0 = junto à loja, 100 = no destino (posição do estafeta na linha) — fallback quando não há GPS real */
  /** -1 = não mostrar estafeta fictício na linha; só GPS real */
  courierProgress: { type: Number, default: -1 },
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
/** Última posição usada para pedir OSRM estafeta→loja (evita refetch a cada GPS) */
let lastCourierLegAnchor = null;
let lastCourierLegFetchAt = 0;
const COURIER_LEG_MIN_INTERVAL_MS = 35_000;
const COURIER_LEG_MIN_MOVE_M = 280;
let storeIcon = null;
let customerIcon = null;
let courierIcon = null;
let storeMarker = null;
let destMarker = null;
let courierMarker = null;
let routePolylines = [];
let routeLeg1 = null;
let routeLeg2 = null;
let mapViewLocked = false;
let didInitialBoundsFit = false;

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
      iconUrl: `${MAP_BASE}continente-pin.png`,
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
      iconUrl: `${MAP_BASE}customer-house-pin.png`,
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
      iconUrl: `${MAP_BASE}courier-pin.png`,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -40],
      className: 'ge-map-marker-icon ge-map-marker-icon--courier',
    });
  }
  return courierIcon;
}

function courierPlausibleOnRoute() {
  return isGpsPlausibleForRoute(
    props.courierLat,
    props.courierLng,
    props.storeLat,
    props.storeLng,
    props.destLat,
    props.destLng,
  );
}

/** Remove só as linhas do mapa — não apagar dados da rota (leg1/leg2) */
function clearRoutePolylines() {
  for (const line of routePolylines) {
    layerGroup?.removeLayer(line);
  }
  routePolylines = [];
}

function hasCourierGps() {
  return Number.isFinite(props.courierLat)
    && Number.isFinite(props.courierLng)
    && !(props.courierLat === 0 && props.courierLng === 0);
}

function legLooksLikeStraightSegment(leg) {
  return !leg || leg.length <= 2;
}

function hasCachedRoadLeg2() {
  return routeLeg2?.length > 2;
}

function shouldRefreshCourierLeg() {
  if (!hasCourierGps()) return false;
  const pos = [props.courierLat, props.courierLng];
  if (legLooksLikeStraightSegment(routeLeg1)) return true;
  if (!lastCourierLegAnchor) return true;
  const elapsed = Date.now() - lastCourierLegFetchAt;
  if (elapsed < COURIER_LEG_MIN_INTERVAL_MS) return false;
  return haversineMeters(lastCourierLegAnchor, pos) >= COURIER_LEG_MIN_MOVE_M;
}

async function refreshCourierLegOnly(signal, keySnapshot) {
  if (!hasCourierGps() || !validCoords()) return;
  const store = [props.storeLat, props.storeLng];
  const courier = [props.courierLat, props.courierLng];
  try {
    const r1 = await fetchRouteThroughPoints([courier, store], signal);
    if (coordsKey() !== keySnapshot || signal?.aborted) return;
    routeLeg1 = r1?.coordinates?.length ? r1.coordinates : straightLinePoints(courier, store);
    lastCourierLegAnchor = courier;
    lastCourierLegFetchAt = Date.now();
    drawLayers({ refitBounds: false });
  } catch (e) {
    if (e.name === 'AbortError') return;
    routeLeg1 = straightLinePoints(courier, store);
    drawLayers({ refitBounds: false });
  }
}

function allPointsForBounds() {
  const pts = [[props.storeLat, props.storeLng], [props.destLat, props.destLng]];
  if (hasCourierGps()) {
    pts.push([props.courierLat, props.courierLng]);
  }
  if (routeLeg1?.length) routeLeg1.forEach((p) => pts.push(p));
  if (routeLeg2?.length) routeLeg2.forEach((p) => pts.push(p));
  if (routeLatLngs?.length) routeLatLngs.forEach((p) => pts.push(p));
  return pts;
}

async function scheduleRouteFetch({ full = true } = {}) {
  if (!map || !layerGroup || !validCoords()) return;

  const store = [props.storeLat, props.storeLng];
  const dest = [props.destLat, props.destLng];
  const courier = hasCourierGps() ? [props.courierLat, props.courierLng] : null;

  // Só atualizar perna estafeta→loja; não repor loja→destino em reta a cada GPS
  if (!full && courier && shouldRefreshCourierLeg()) {
    routeAbort?.abort();
    routeAbort = new AbortController();
    const keySnapshot = coordsKey();
    await refreshCourierLegOnly(routeAbort.signal, keySnapshot);
    return;
  }

  if (!full) return;

  routeAbort?.abort();
  routeAbort = new AbortController();
  const keySnapshot = coordsKey();
  const signal = routeAbort.signal;

  const keepLeg2 = hasCachedRoadLeg2();
  if (!keepLeg2) {
    routeLeg2 = straightLinePoints(store, dest);
    routeLeg1 = courier ? straightLinePoints(courier, store) : null;
    routeLatLngs = null;
    boundsKey = '';
    drawLayers({ refitBounds: !didInitialBoundsFit });
  } else if (courier && legLooksLikeStraightSegment(routeLeg1)) {
    routeLeg1 = straightLinePoints(courier, store);
    drawLayers({ refitBounds: false });
  }

  if (!props.roadRoute) return;

  try {
    if (!keepLeg2) {
      routeLeg2 = await fetchStoreToDestLeg(store, dest, signal);
    }
    if (courier && shouldRefreshCourierLeg()) {
      const legs = await fetchDeliveryLegs(courier, store, dest, signal);
      if (coordsKey() !== keySnapshot || signal.aborted) return;
      routeLeg1 = legs.leg1;
      if (!keepLeg2) routeLeg2 = legs.leg2;
      lastCourierLegAnchor = courier;
      lastCourierLegFetchAt = Date.now();
    } else if (!courier) {
      routeLeg1 = null;
    }
    if (coordsKey() !== keySnapshot || signal.aborted) return;
    drawLayers({ refitBounds: !mapViewLocked && !keepLeg2 });
  } catch (e) {
    if (e.name === 'AbortError') return;
    if (courier) {
      const fallback = deliveryLegsStraightLine(courier, store, dest);
      routeLeg1 = fallback.leg1;
      if (!keepLeg2) routeLeg2 = fallback.leg2;
      lastCourierLegAnchor = courier;
      lastCourierLegFetchAt = Date.now();
    }
    drawLayers({ refitBounds: !mapViewLocked && !keepLeg2 });
  }
}

function courierLatLng() {
  if (hasCourierGps()) return [props.courierLat, props.courierLng];
  if (props.courierProgress < 0) return null;
  const linePoints = polylinePointsForDraw();
  const p = Math.min(1, Math.max(0, props.courierProgress / 100));
  if (p > 0 && p < 1) return pointAlongPolyline(linePoints, p);
  return null;
}

function maybeFitBounds(linePoints, force = false) {
  if (!map || mapViewLocked) return;
  const key = `${coordsKey()}|${routeLatLngs ? 'r' : 's'}`;
  if (!force && key === boundsKey && didInitialBoundsFit) return;
  boundsKey = key;
  const bounds = L.latLngBounds(linePoints).pad(0.18);
  map.fitBounds(bounds, { animate: false });
  didInitialBoundsFit = true;
}

function updateCourierMarker() {
  if (!map || !layerGroup || !validCoords()) return;
  const pos = courierLatLng();
  if (!pos) {
    if (courierMarker) {
      layerGroup.removeLayer(courierMarker);
      courierMarker = null;
    }
    return;
  }
  if (courierMarker) {
    courierMarker.setLatLng(pos);
    return;
  }
  courierMarker = L.marker(pos, { icon: getCourierIcon() })
    .addTo(layerGroup)
    .bindTooltip('Estafeta (GPS)', { permanent: false, direction: 'right' });
}

function drawLayers({ refitBounds = false } = {}) {
  if (!map || !layerGroup || !validCoords()) return;

  clearRoutePolylines();
  if (storeMarker) {
    layerGroup.removeLayer(storeMarker);
    storeMarker = null;
  }
  if (destMarker) {
    layerGroup.removeLayer(destMarker);
    destMarker = null;
  }

  const storeLatLng = [props.storeLat, props.storeLng];
  const destLatLng = [props.destLat, props.destLng];

  if (routeLeg2?.length) {
    routePolylines = [];
    if (routeLeg1?.length) {
      const line1 = L.polyline(routeLeg1, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '12 10',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);
      routePolylines.push(line1);
    }
    const line2 = L.polyline(routeLeg2, {
      color: '#f97316',
      weight: 6,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layerGroup);
    routePolylines.push(line2);
  } else {
    const linePoints = polylinePointsForDraw();
    const line = L.polyline(linePoints, {
      color: '#10b981',
      weight: 5,
      opacity: 0.9,
      dashArray: routeLatLngs ? null : '10 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layerGroup);
    routePolylines = [line];
  }

  storeMarker = L.marker(storeLatLng, { icon: getStoreIcon() })
    .addTo(layerGroup)
    .bindTooltip('Loja', { permanent: false, direction: 'top' });

  destMarker = L.marker(destLatLng, { icon: getCustomerIcon() })
    .addTo(layerGroup)
    .bindTooltip('Destino', { permanent: false, direction: 'top' });

  updateCourierMarker();

  if (refitBounds) maybeFitBounds(allPointsForBounds(), true);
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

  L.tileLayer(LEAFLET_LIGHT_TILE.url, LEAFLET_LIGHT_TILE.options).addTo(map);

  map.attributionControl.addAttribution(
    'Rotas © <a href="https://project-osrm.org/" rel="noreferrer">OSRM</a>'
  );

  layerGroup = L.layerGroup().addTo(map);
  map.on('dragstart', () => { mapViewLocked = true; });
  map.on('zoomstart', (ev) => {
    if (ev?.originalEvent) mapViewLocked = true;
  });
  scheduleRouteFetch({ full: true });

  // Duplo invalidateSize: garante correção mesmo com CSS lento a calcular alturas
  setTimeout(() => map?.invalidateSize(), 50);
  setTimeout(() => map?.invalidateSize(), 300);
}

function destroyMap() {
  routeAbort?.abort();
  routeAbort = null;
  lastCourierLegAnchor = null;
  lastCourierLegFetchAt = 0;
  routeLatLngs = null;
  storeMarker = null;
  destMarker = null;
  courierMarker = null;
  routePolylines = [];
  mapViewLocked = false;
  didInitialBoundsFit = false;
  if (map) {
    map.remove();
    map = null;
    layerGroup = null;
    boundsKey = '';
  }
}

watch(
  () => [
    props.storeLat,
    props.storeLng,
    props.destLat,
    props.destLng,
    props.roadRoute,
    props.routeProfile,
  ],
  () => {
    if (map && layerGroup) scheduleRouteFetch({ full: true });
  },
);

watch(
  () => [props.courierProgress, props.courierLat, props.courierLng],
  () => {
    if (!map || !layerGroup) return;
    updateCourierMarker();
    if (hasCourierGps() && shouldRefreshCourierLeg()) {
      scheduleRouteFetch({ full: false });
    }
  },
);

watch(
  () => props.dimTiles,
  () => {
    if (map && layerGroup) updateCourierMarker();
  },
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

let _initObserver = null;

onMounted(() => {
  window.addEventListener('resize', onResize);

  // Aguarda o contentor ter dimensões reais antes de inicializar o Leaflet.
  // Necessário porque o componente aparece via v-if e pode estar sem altura no nextTick.
  nextTick(() => {
    const el = containerRef.value;
    if (!el) return;

    if (el.offsetHeight > 0) {
      // Já tem altura: inicializa de imediato
      initMap();
      return;
    }

    // Sem altura ainda — espera o ResizeObserver detetar o primeiro layout real
    _initObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect?.height ?? entry.target.offsetHeight;
        if (h > 0) {
          _initObserver?.disconnect();
          _initObserver = null;
          initMap();
          return;
        }
      }
    });
    _initObserver.observe(el);
  });
});

onBeforeUnmount(() => {
  _initObserver?.disconnect();
  _initObserver = null;
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
