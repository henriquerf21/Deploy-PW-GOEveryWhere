/**
 * Pins Mapbox (HTML): mesmos PNG do Leaflet; seta azul em navegação.
 * Marcadores registados por instância de mapa (evita conflito lista ↔ detalhe).
 */
import {
  mapboxgl,
  MAP_PINS,
  MAP_PIN_DISPLAY_PX,
  MAP_PIN_NAV_DISPLAY_PX,
  isValidCoord,
  placeMapMarker,
  courierMarkerRotation,
} from './mapbox.js';

/** @type {WeakMap<import('mapbox-gl').Map, { store, home, courier }>} */
const markersByMap = new WeakMap();

function getMarkerBucket(map) {
  if (!markersByMap.has(map)) {
    markersByMap.set(map, { store: null, home: null, courier: null });
  }
  return markersByMap.get(map);
}

function displayTargets(mode) {
  return mode === 'navigation' ? MAP_PIN_NAV_DISPLAY_PX : MAP_PIN_DISPLAY_PX;
}

function createNavArrowHtmlElement(sizePx) {
  const el = document.createElement('div');
  el.className = 'ge-nav-arrow-marker';
  const s = sizePx || MAP_PIN_NAV_DISPLAY_PX.navArrow;
  el.style.width = `${s}px`;
  el.style.height = `${s}px`;
  el.innerHTML = `
    <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <filter id="ge-nav-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(37,99,235,0.45)"/>
        </filter>
      </defs>
      <path
        filter="url(#ge-nav-shadow)"
        d="M16 4 L8 26 L16 20 L24 26 Z"
        fill="#2563eb"
        stroke="#ffffff"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  `;
  return el;
}

function clearHtmlMarkersForMap(map) {
  const bucket = getMarkerBucket(map);
  for (const key of Object.keys(bucket)) {
    bucket[key]?.remove();
    bucket[key] = null;
  }
}

function setHtmlMarkers(map, pins, mode) {
  if (!map) return;
  const bucket = getMarkerBucket(map);
  for (const key of Object.keys(bucket)) {
    bucket[key]?.remove();
    bucket[key] = null;
  }

  const targets = displayTargets(mode);
  const nav = mode === 'navigation';

  if (isValidCoord(pins.store)) {
    bucket.store = placeMapMarker(
      map,
      null,
      MAP_PINS.store,
      'ge-map-marker-icon ge-map-marker-icon--store',
      pins.store,
      '',
      { w: targets.store, h: Math.round(targets.store * 1.12) },
    );
  }
  if (isValidCoord(pins.home)) {
    bucket.home = placeMapMarker(
      map,
      null,
      MAP_PINS.home,
      'ge-map-marker-icon ge-map-marker-icon--home',
      pins.home,
      '',
      { w: targets.home, h: Math.round(targets.home * 1.12) },
    );
  }
  if (isValidCoord(pins.courier)) {
    if (nav) {
      bucket.courier = new mapboxgl.Marker({
        element: createNavArrowHtmlElement(targets.navArrow),
        anchor: 'center',
        rotationAlignment: 'viewport',
        pitchAlignment: 'viewport',
      })
        .setLngLat([pins.courier.lng, pins.courier.lat])
        .addTo(map);
    } else {
      bucket.courier = placeMapMarker(
        map,
        null,
        MAP_PINS.courier,
        'ge-map-marker-icon ge-map-marker-icon--courier',
        pins.courier,
        '',
        { w: targets.courier, h: Math.round(targets.courier * 1.12) },
        pins.courierBearing,
      );
    }
  }
}

/** Atualiza só o pin do estafeta (evita recriar loja/cliente a cada GPS) */
export function updateCourierPinOnMap(map, courier, bearing, mode = 'overview') {
  if (!map || !isValidCoord(courier)) return false;
  const bucket = markersByMap.get(map);
  if (!bucket?.courier) return false;
  bucket.courier.setLngLat([courier.lng, courier.lat]);
  if (mode !== 'navigation') bucket.courier.setRotation(courierMarkerRotation(bearing));
  return true;
}

export function waitForMapReady(map, { timeoutMs = 12000 } = {}) {
  if (!map) return Promise.resolve(false);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    const run = () => {
      if (map._removed) return finish(false);
      if (!map.isStyleLoaded()) {
        map.once('style.load', run);
        return;
      }
      if (map.loaded()) return finish(true);
      map.once('idle', () => finish(true));
    };
    run();
  });
}

/** @deprecated */
export async function ensureMapPinImages() {
  return true;
}

export function clearDeliveryMapPins(map) {
  if (!map) return;
  clearHtmlMarkersForMap(map);
  try {
    if (map.getLayer('ge-delivery-markers-layer')) map.removeLayer('ge-delivery-markers-layer');
    if (map.getSource('ge-delivery-markers')) map.removeSource('ge-delivery-markers');
  } catch { /* legado */ }
  markersByMap.delete(map);
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ store?, home?, courier?, courierBearing?, mode?: 'overview'|'navigation' }} pins
 */
export async function setDeliveryMapPins(map, pins = {}) {
  if (!map || map._removed) return;
  const mode = pins.mode === 'navigation' ? 'navigation' : 'overview';

  if (!map.isStyleLoaded()) {
    const ready = await waitForMapReady(map);
    if (!ready || map._removed) return;
  }

  setHtmlMarkers(map, pins, mode);
}
