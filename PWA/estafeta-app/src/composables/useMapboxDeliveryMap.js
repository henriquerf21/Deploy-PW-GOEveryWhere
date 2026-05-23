import { ref, computed } from 'vue';
import {
  mapboxgl,
  MAP_STYLES,
  isValidCoord,
  toRouteFeature,
  fetchMapboxRoute,
  fetchDeliveryRouteLegs,
  routeFeatureOrStraight,
  hasRoutableGeometry,
  safeFitBounds,
  calculateBearing,
  straightLineCoords,
  coordsFromGeometry,
  snapToRoute,
  getNavTarget,
  getNavPhaseLabel,
  resolveNavStep,
  mapMatchGps,
  haversineM,
} from '../utils/mapbox.js';
import { sumRemainingFromSteps } from '../utils/navManeuver.js';
import { setDeliveryMapPins, clearDeliveryMapPins, waitForMapReady, updateCourierPinOnMap } from '../utils/mapPinLayers.js';
import { isSimulatingRoute, store as courierStore } from '../stores/courierStore.js';

const ROUTE_LAYER_IDS = ['route-leg1', 'route-leg2', 'route-line', 'route-nav'];
const ROUTE_SOURCE_IDS = ['route-leg1', 'route-leg2', 'route-line', 'route-nav'];

/** Cores alinhadas com a legenda e mapas Leaflet (FO/BO) */
const ROUTE_LEG1_STYLE = { color: '#38bdf8', width: 5, dash: [2, 1.5] };
const ROUTE_LEG2_STYLE = { color: '#22c55e', width: 6, dash: null };

/**
 * Mapa Mapbox: visão geral + modo navegação (rota, GPS na estrada, instruções).
 */
export function useMapboxDeliveryMap({
  getDelivery,
  getCourierGps,
  getRawGps,
  isNavigating,
}) {
  let map = null;
  let lastPinCourier = null;
  let mapViewLocked = false;
  let didInitialFit = false;
  let lastBoundsKey = '';
  let routeFetchToken = 0;
  let renderSeq = 0;
  let previousGps = null;
  let lastBearing = 0;
  let lastRouteAnchor = null;
  let routeRefreshTimer = null;
  let navHudTimer = null;
  let styleTransitionToken = 0;
  let renderScheduled = false;
  let lastOverviewKey = '';
  let leg1FetchSeq = 0;
  let leg2FetchSeq = 0;
  let leg2RoadReady = false;

  let routeLeg1 = null;
  let routeLeg2 = null;
  let routeLatLngs = null;

  const navInstruction = ref(null);
  const navDistanceM = ref(0);
  const navEtaTime = ref('--:--');
  const navRemainingMin = ref(0);
  const navRemainingKm = ref('0');
  const navDisplayGps = ref(null);
  const navPhaseLabel = computed(() => getNavPhaseLabel(getDelivery()));
  const navSteps = ref([]);
  const navRouteCoords = ref([]);

  function clearRouteLayers() {
    if (!map) return;
    leg2RoadReady = false;
    for (const id of ROUTE_LAYER_IDS) {
      try {
        if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
      } catch { /* */ }
    }
    for (const id of ROUTE_SOURCE_IDS) {
      try {
        if (map.getSource(id)) map.removeSource(id);
      } catch { /* */ }
    }
  }

  function setRouteLayer(sourceId, feature, color, { width = 5, dash = null, opacity = 0.95 } = {}) {
    if (!map || map._removed || !feature?.geometry) return;
    const layerId = `${sourceId}-line`;
    const paint = {
      'line-color': color,
      'line-width': width,
      'line-opacity': opacity,
    };
    if (dash?.length) paint['line-dasharray'] = dash;

    const apply = () => {
      if (!map?.isStyleLoaded()) return false;
      try {
        if (map.getSource(sourceId)) {
          map.getSource(sourceId).setData(feature);
          map.setPaintProperty(layerId, 'line-color', color);
          map.setPaintProperty(layerId, 'line-width', width);
          map.setPaintProperty(layerId, 'line-opacity', opacity);
          if (dash?.length) map.setPaintProperty(layerId, 'line-dasharray', dash);
          else map.setPaintProperty(layerId, 'line-dasharray', [1, 0]);
        } else {
          map.addSource(sourceId, { type: 'geojson', data: feature });
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint,
          });
        }
        return true;
      } catch (e) {
        console.warn('[Mapbox] setRouteLayer', sourceId, e);
        return false;
      }
    };

    if (!apply() && map) {
      map.once('idle', () => apply());
    }
  }

  function removeMarkers() {
    clearDeliveryMapPins(map);
    lastPinCourier = null;
  }

  function pinMapMode() {
    return isNavigating?.value ? 'navigation' : 'overview';
  }

  function straightFeature(a, b) {
    if (!isValidCoord(a) || !isValidCoord(b)) return null;
    return toRouteFeature({ type: 'LineString', coordinates: straightLineCoords(a, b) });
  }

  async function syncDeliveryPins(courier, bearing) {
    if (!map || map._removed) return;
    const d = getDelivery();
    if (!d) return;
    const c = isValidCoord(courier) ? courier : null;
    lastPinCourier = c;
    const nav = isNavigating?.value;
    await setDeliveryMapPins(map, {
      store: d.pickup,
      home: d.destination,
      courier: c,
      courierBearing: nav ? 0 : (bearing ?? lastBearing),
      mode: pinMapMode(),
    });
  }

  function fitToDelivery(courier, { force = false } = {}) {
    if (!map || mapViewLocked) return;
    const d = getDelivery();
    if (!d) return;
    const key = `${d.pickup?.lat}|${d.destination?.lat}|${d.state}|${courier?.lat ?? ''}`;
    if (!force && didInitialFit && key === lastBoundsKey) return;
    const pts = [];
    if (isValidCoord(d.pickup)) pts.push(d.pickup);
    if (isValidCoord(d.destination)) pts.push(d.destination);
    if (isValidCoord(courier)) pts.push(courier);
    if (!pts.length) return;
    const lngs = pts.map((p) => p.lng);
    const lats = pts.map((p) => p.lat);
    if (safeFitBounds(
      map,
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 56, maxZoom: 15, duration: force ? 400 : 0 },
    )) {
      didInitialFit = true;
      lastBoundsKey = key;
    }
  }

  function resolveCourierBearing(bearing) {
    if (bearing != null && Number.isFinite(bearing)) return bearing;
    if (isSimulatingRoute.value && Number.isFinite(courierStore.gpsHeading)) {
      return courierStore.gpsHeading;
    }
    return lastBearing;
  }

  async function updateCourierMarker(courier, bearing) {
    if (!map || map._removed) return;
    const d = getDelivery();
    if (!d) return;
    if (!isValidCoord(courier)) {
      await setDeliveryMapPins(map, { store: d.pickup, home: d.destination, mode: pinMapMode() });
      lastPinCourier = null;
      return;
    }
    const nav = isNavigating?.value;
    const rot = nav ? 0 : resolveCourierBearing(bearing);
    lastBearing = rot;

    const movedPin = updateCourierPinOnMap(map, courier, rot, pinMapMode());
    if (!movedPin) {
      await setDeliveryMapPins(map, {
        store: d.pickup,
        home: d.destination,
        courier,
        courierBearing: rot,
        mode: pinMapMode(),
      });
    }
    lastPinCourier = courier;
  }

  function raiseRouteLayers() {
    if (!map) return;
    for (const layerId of ['route-leg1-line', 'route-leg2-line', 'route-line-line', 'route-nav-line']) {
      try {
        if (map.getLayer(layerId)) map.moveLayer(layerId);
      } catch { /* */ }
    }
  }

  function isRoadGeometry(feature) {
    return hasRoutableGeometry(feature?.geometry);
  }

  function applyLeg1Feature(feature) {
    if (!feature) {
      clearCourierToStoreRoute();
      return;
    }
    routeLeg1 = feature;
    setRouteLayer('route-leg1', routeLeg1, ROUTE_LEG1_STYLE.color, {
      width: ROUTE_LEG1_STYLE.width,
      dash: ROUTE_LEG1_STYLE.dash,
    });
    raiseRouteLayers();
  }

  function applyLeg2Feature(feature) {
    if (!feature) return;
    routeLeg2 = feature;
    leg2RoadReady = isRoadGeometry(feature);
    setRouteLayer('route-leg2', routeLeg2, ROUTE_LEG2_STYLE.color, {
      width: ROUTE_LEG2_STYLE.width,
      dash: ROUTE_LEG2_STYLE.dash,
    });
    raiseRouteLayers();
  }

  async function paintStoreToDestRoute(p, dest) {
    const fetchId = ++leg2FetchSeq;
    const route = await fetchMapboxRoute([p, dest]);
    if (fetchId !== leg2FetchSeq || !map?.isStyleLoaded()) return;
    applyLeg2Feature(routeFeatureOrStraight(route, p, dest));
  }

  async function paintCourierToStoreRoute(courier, p) {
    const fetchId = ++leg1FetchSeq;
    const route = await fetchMapboxRoute([courier, p]);
    if (fetchId !== leg1FetchSeq || !map?.isStyleLoaded()) return;
    applyLeg1Feature(routeFeatureOrStraight(route, courier, p));
  }

  function clearCourierToStoreRoute() {
    routeLeg1 = null;
    try {
      if (map?.getLayer('route-leg1-line')) map.removeLayer('route-leg1-line');
      if (map?.getSource('route-leg1')) map.removeSource('route-leg1');
    } catch { /* */ }
  }

  async function paintOverviewRoutes(courier) {
    const d = getDelivery();
    if (!map?.isStyleLoaded() || !d) return;
    const p = d.pickup;
    const dest = d.destination;
    if (!isValidCoord(p) || !isValidCoord(dest)) return;

    await paintStoreToDestRoute(p, dest);
    if (isValidCoord(courier)) {
      await paintCourierToStoreRoute(courier, p);
    } else {
      clearCourierToStoreRoute();
    }
  }

  async function refreshOverviewRoutesOnly() {
    if (!map || isNavigating?.value) return;
    const courier = getCourierGps();
    const d = getDelivery();
    const p = d?.pickup;
    if (!isValidCoord(p) || !isValidCoord(courier)) return;
    await paintCourierToStoreRoute(courier, p);
  }

  async function loadNavigationRoute() {
    const d = getDelivery();
    if (!d || !map?.isStyleLoaded()) return;
    const courier = getRawGps?.() || getCourierGps();
    const target = getNavTarget(d);
    if (!isValidCoord(target)) return;

    const origin = isValidCoord(courier) ? courier : (['E-08', 'E-09', 'E-10'].includes(d.state) ? d.pickup : d.pickup);
    const waypoints = isValidCoord(courier) ? [courier, target] : [origin, target];

    const route = await fetchMapboxRoute(waypoints, { steps: true });
    if (!route) return;

    navSteps.value = route.legs?.[0]?.steps || [];
    navRouteCoords.value = coordsFromGeometry(route.geometry);

    const feature = toRouteFeature(route.geometry);
    setRouteLayer('route-nav', feature, '#2563eb', { width: 10, opacity: 0.95 });

    navRemainingMin.value = Math.max(1, Math.round(route.duration / 60));
    navRemainingKm.value = (route.distance / 1000).toFixed(1);
    const arrival = new Date(Date.now() + route.duration * 1000);
    navEtaTime.value = arrival.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const legs = await fetchDeliveryRouteLegs(
      isValidCoord(courier) ? courier : null,
      d.pickup,
      d.destination,
    );
    if (legs.leg1) setRouteLayer('route-leg1', legs.leg1, '#38bdf8', { width: 4, dash: [2, 1.5], opacity: 0.45 });
    if (legs.leg2) setRouteLayer('route-leg2', legs.leg2, '#f97316', { width: 5, opacity: 0.45 });
  }

  function updateNavHudFromPosition(position) {
    const { step, distanceM, stepIndex } = resolveNavStep(navSteps.value, position);
    if (step) {
      navInstruction.value = step;
      navDistanceM.value = distanceM;
      const { distanceM: remDist, durationSec } = sumRemainingFromSteps(
        navSteps.value,
        stepIndex,
        distanceM,
      );
      navRemainingKm.value = (remDist / 1000).toFixed(1);
      navRemainingMin.value = Math.max(1, Math.ceil(durationSec / 60));
      const arrival = new Date(Date.now() + durationSec * 1000);
      navEtaTime.value = arrival.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }
  }

  async function processNavGps(raw) {
    if (!isValidCoord(raw)) return null;

    let matched = snapToRoute(raw, navRouteCoords.value);
    if (navRouteCoords.value.length < 2) {
      const mm = await mapMatchGps(raw.lat, raw.lng);
      if (mm) matched = { ...mm, bearing: lastBearing };
    }

    if (previousGps) {
      lastBearing = calculateBearing(previousGps, matched);
    } else if (matched.bearing != null) {
      lastBearing = matched.bearing;
    }

    navDisplayGps.value = { lat: matched.lat, lng: matched.lng };
    previousGps = { lat: matched.lat, lng: matched.lng };
    updateCourierMarker(matched, lastBearing);
    updateNavHudFromPosition(matched);

    const offRoute = navRouteCoords.value.length > 2
      && haversineM(raw.lat, raw.lng, matched.lat, matched.lng) > 80;
    if (offRoute) {
      clearTimeout(routeRefreshTimer);
      routeRefreshTimer = setTimeout(() => loadNavigationRoute(), 1500);
    }

    return matched;
  }

  function followCourier(courier) {
    if (!map || !isValidCoord(courier)) return;
    map.easeTo({
      center: [courier.lng, courier.lat],
      bearing: lastBearing,
      pitch: 62,
      zoom: 17.5,
      padding: { top: 120, bottom: Math.min(280, window.innerHeight * 0.38), left: 28, right: 28 },
      duration: 450,
    });
  }

  async function renderMap() {
    const d = getDelivery();
    if (!d || !map || map._removed) return;
    const seq = ++renderSeq;

    const ready = await waitForMapReady(map);
    if (!ready || seq !== renderSeq || !map || map._removed) return;

    const p = d.pickup;
    const dest = d.destination;
    if (!isValidCoord(p) || !isValidCoord(dest)) return;

    const courier = isNavigating?.value
      ? (navDisplayGps.value || getRawGps?.() || getCourierGps())
      : getCourierGps();
    const state = d.state;

    if (isNavigating?.value) {
      await syncDeliveryPins(courier, lastBearing);
      if (seq !== renderSeq || !map) return;
      await loadNavigationRoute();
      if (seq !== renderSeq || !map) return;
      await syncDeliveryPins(courier, lastBearing);
      if (seq !== renderSeq || !map) return;
      const raw = getRawGps?.();
      if (isValidCoord(raw)) await processNavGps(raw);
      else if (isValidCoord(courier)) followCourier(courier);
    } else {
      const overviewKey = `${p.lat},${p.lng},${dest.lat},${dest.lng},${state}`;
      const resetRoutes = overviewKey !== lastOverviewKey;
      if (resetRoutes) {
        clearRouteLayers();
        routeLeg1 = null;
        routeLeg2 = null;
        leg2RoadReady = false;
        lastOverviewKey = overviewKey;
      }
      await syncDeliveryPins(courier, resolveCourierBearing(lastBearing));
      if (seq !== renderSeq || !map) return;
      if (resetRoutes || !leg2RoadReady) {
        fitToDelivery(courier, { force: !didInitialFit });
        if (seq !== renderSeq) return;
        await Promise.all([
          paintStoreToDestRoute(p, dest),
          isValidCoord(courier)
            ? paintCourierToStoreRoute(courier, p)
            : Promise.resolve(clearCourierToStoreRoute()),
        ]);
      } else if (isValidCoord(courier)) {
        await paintCourierToStoreRoute(courier, p);
        fitToDelivery(courier, { force: false });
      }
    }
  }

  function scheduleRender() {
    if (renderScheduled || !map) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      void renderMap();
    });
  }

  function initMap(container, centerLngLat) {
    if (!container || map) return map;
    map = new mapboxgl.Map({
      container,
      style: MAP_STYLES.overview,
      center: centerLngLat,
      zoom: 14,
      attributionControl: false,
    });
    map.on('load', () => scheduleRender());
    map.on('dragstart', () => { mapViewLocked = true; });
    map.on('zoomstart', (ev) => { if (ev?.originalEvent) mapViewLocked = true; });
    setTimeout(() => map?.resize(), 160);
    return map;
  }

  function destroyMap() {
    renderSeq += 1;
    routeFetchToken += 1;
    clearTimeout(routeRefreshTimer);
    clearTimeout(navHudTimer);
    removeMarkers();
    clearRouteLayers();
    map?.remove();
    map = null;
    mapViewLocked = false;
    didInitialFit = false;
    lastBoundsKey = '';
    lastOverviewKey = '';
    leg1FetchSeq += 1;
    leg2FetchSeq += 1;
    leg2RoadReady = false;
    navDisplayGps.value = null;
    navSteps.value = [];
    navRouteCoords.value = [];
  }

  function zoomIn() { map?.zoomTo(map.getZoom() + 1); }
  function zoomOut() { map?.zoomTo(map.getZoom() - 1); }
  function resize() { map?.resize(); }

  async function startNavigation() {
    if (!map) return;
    const token = ++styleTransitionToken;
    routeFetchToken += 1;
    renderSeq += 1;
    mapViewLocked = false;
    didInitialFit = false;
    map.setStyle(MAP_STYLES.navigation);
    const ready = await waitForMapReady(map);
    if (token !== styleTransitionToken || !ready || !map) return;
    map.setPitch(62);
    map.setZoom(17);
    await renderMap();
    if (token !== styleTransitionToken || !map) return;
    const raw = getRawGps?.();
    if (isValidCoord(raw)) {
      const m = await processNavGps(raw);
      if (m) followCourier(m);
    }
    resize();
  }

  async function stopNavigation() {
    if (!map) return;
    const token = ++styleTransitionToken;
    routeFetchToken += 1;
    renderSeq += 1;
    navDisplayGps.value = null;
    navSteps.value = [];
    navRouteCoords.value = [];
    navInstruction.value = null;
    clearTimeout(routeRefreshTimer);
    map.setStyle(MAP_STYLES.overview);
    const ready = await waitForMapReady(map);
    if (token !== styleTransitionToken || !ready || !map) return;
    map.setPitch(0);
    map.setBearing(0);
    mapViewLocked = false;
    didInitialFit = false;
    lastBoundsKey = '';
    await renderMap();
    if (token !== styleTransitionToken || !map) return;
    resize();
  }

  function onGpsTick(raw) {
    if (!map || !isValidCoord(raw)) return;

    if (isNavigating?.value) {
      void processNavGps(raw).then((matched) => {
        if (matched && !mapViewLocked) followCourier(matched);
      });
      return;
    }

    const courier = getCourierGps();
    if (!isValidCoord(courier)) return;
    if (previousGps) lastBearing = calculateBearing(previousGps, courier);
    previousGps = { lat: courier.lat, lng: courier.lng };
    updateCourierMarker(courier, lastBearing);

    const moved = !lastRouteAnchor || haversineM(courier, lastRouteAnchor) > 20;
    if (moved) {
      lastRouteAnchor = { lat: courier.lat, lng: courier.lng };
      clearTimeout(routeRefreshTimer);
      const delay = isSimulatingRoute.value ? 800 : 2000;
      routeRefreshTimer = setTimeout(() => refreshOverviewRoutesOnly(), delay);
    }
  }

  function centerOnCourier() {
    mapViewLocked = false;
    const c = navDisplayGps.value || getRawGps?.() || getCourierGps();
    if (isValidCoord(c)) followCourier(c);
  }

  function resetViewLock() {
    mapViewLocked = false;
    didInitialFit = false;
  }

  return {
    initMap,
    destroyMap,
    renderMap,
    scheduleRender,
    zoomIn,
    zoomOut,
    resize,
    startNavigation,
    stopNavigation,
    onGpsTick,
    centerOnCourier,
    resetViewLock,
    navInstruction,
    navDistanceM,
    navEtaTime,
    navRemainingMin,
    navRemainingKm,
    navDisplayGps,
    navPhaseLabel,
  };
}
