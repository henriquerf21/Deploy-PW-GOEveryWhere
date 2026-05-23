import mapboxgl from 'mapbox-gl';

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
  || 'pk.eyJ1IjoibWVuZGVzcHJpdnZ2IiwiYSI6ImNtcGcxY243ODBrNnEycnM5cnF0ZGJ6NW4ifQ.oC2NHjD17DfQDxhpWmGrHg';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const MAP_STYLES = {
  overview: 'mapbox://styles/mapbox/streets-v12',
  navigation: 'mapbox://styles/mapbox/dark-v11',
};

/** URL absoluta — com base `./` rotas como /deliveries/:id quebram paths relativos */
export function publicAssetUrl(relativePath) {
  const clean = String(relativePath || '').replace(/^\//, '');
  const base = import.meta.env.BASE_URL || '/';
  if (base === './' || base === '.') {
    return `/${clean}`;
  }
  const prefix = base.startsWith('/') ? base : `/${base}`;
  return `${prefix.replace(/\/$/, '')}/${clean}`;
}

export const MAP_PINS = {
  store: publicAssetUrl('media/map/continente-pin.png'),
  home: publicAssetUrl('media/map/customer-house-pin.png'),
  courier: publicAssetUrl('media/map/courier-pin.png'),
};

/** Tamanho visual dos pins — visão geral (alinhado com Leaflet ~40–48px) */
export const MAP_PIN_DISPLAY_PX = { store: 40, home: 40, courier: 44 };

/** Tamanho visual — modo navegação (destinos maiores; seta azul destacada) */
export const MAP_PIN_NAV_DISPLAY_PX = { store: 34, home: 36, navArrow: 48 };

export function isValidCoord(point) {
  return point
    && Number.isFinite(point.lat)
    && Number.isFinite(point.lng)
    && !(point.lat === 0 && point.lng === 0);
}

export function toRouteFeature(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Feature') return geometry;
  const geom = geometry.type ? geometry : { type: 'LineString', coordinates: geometry };
  return { type: 'Feature', properties: {}, geometry: geom };
}

export function straightLineCoords(a, b) {
  return [[a.lng, a.lat], [b.lng, b.lat]];
}

const OSRM_DRIVING = 'https://router.project-osrm.org/route/v1/driving';

async function fetchOsrmRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  try {
    const res = await fetch(`${OSRM_DRIVING}/${coordStr}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry) return null;
    const r = data.routes[0];
    if (!hasRoutableGeometry(r.geometry)) return null;
    return {
      geometry: r.geometry,
      distance: r.distance,
      duration: r.duration,
      legs: [{ steps: [] }],
    };
  } catch (e) {
    console.warn('[OSRM] directions', e);
    return null;
  }
}

function geometryPointCount(geometry) {
  const coords = geometry?.coordinates || geometry?.geometry?.coordinates;
  return Array.isArray(coords) ? coords.length : 0;
}

/** Pelo menos 3 vértices — 2 pontos é só recta entre origem e destino */
export function hasRoutableGeometry(geometry) {
  return geometryPointCount(geometry) > 2;
}

/** Geocodificar morada (PT) quando faltam coordenadas do cliente */
export async function geocodeAddress(query, { proximityLngLat } = {}) {
  const q = String(query || '').trim();
  if (!q) return null;
  const prox = proximityLngLat?.lng != null && proximityLngLat?.lat != null
    ? `&proximity=${proximityLngLat.lng},${proximityLngLat.lat}`
    : '';
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=pt&limit=1&language=pt${prox}&access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const f = data.features?.[0];
    if (!f?.center) return null;
    return { lng: f.center[0], lat: f.center[1] };
  } catch (e) {
    console.warn('[Mapbox] geocode', e);
    return null;
  }
}

export async function fetchMapboxRoute(waypoints, { steps = false } = {}) {
  if (!waypoints || waypoints.length < 2) return null;
  const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const stepsParam = steps ? '&steps=true' : '';
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?geometries=geojson&overview=full&language=pt${stepsParam}&access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.length > 0 && hasRoutableGeometry(data.routes[0].geometry)) {
      return data.routes[0];
    }
    if (data.message) console.warn('[Mapbox]', data.message);
  } catch (e) {
    console.warn('[Mapbox] directions', e);
  }
  return fetchOsrmRoute(waypoints);
}

export function routeFeatureOrStraight(route, pointA, pointB) {
  if (route?.geometry && hasRoutableGeometry(route.geometry)) {
    return toRouteFeature(route.geometry);
  }
  console.warn('[Route] fallback recto — Mapbox e OSRM falharam');
  return toRouteFeature({ type: 'LineString', coordinates: straightLineCoords(pointA, pointB) });
}

/** Rotas estafeta→loja (leg1) e loja→cliente (leg2), como no mapa operacional */
export async function fetchDeliveryRouteLegs(courier, store, dest) {
  const [leg2Route, leg1Route] = await Promise.all([
    fetchMapboxRoute([store, dest]),
    courier && isValidCoord(courier) && isValidCoord(store)
      ? fetchMapboxRoute([courier, store])
      : Promise.resolve(null),
  ]);
  return {
    leg1: leg1Route
      ? routeFeatureOrStraight(leg1Route, courier || store, store)
      : null,
    leg2: routeFeatureOrStraight(leg2Route, store, dest),
    meta: leg2Route,
  };
}

export function createPinElement(iconUrl, className, extraClass = '', sizePx = MAP_PIN_DISPLAY_PX.store) {
  const w = typeof sizePx === 'number' ? sizePx : (sizePx?.w ?? 24);
  const h = typeof sizePx === 'number' ? Math.round(sizePx * 1.15) : (sizePx?.h ?? 26);
  const el = document.createElement('div');
  el.className = [className, extraClass].filter(Boolean).join(' ');
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.display = 'flex';
  el.style.alignItems = 'flex-end';
  el.style.justifyContent = 'center';
  el.style.pointerEvents = 'none';
  const img = document.createElement('img');
  img.src = iconUrl;
  img.alt = '';
  img.draggable = false;
  img.decoding = 'async';
  img.className = 'ge-map-marker-img';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.objectPosition = 'center bottom';
  img.style.display = 'block';
  img.style.pointerEvents = 'none';
  el.appendChild(img);
  return el;
}

/**
 * Pin courier-pin.png: gota vertical + mota desenhada para a direita.
 * Rodar o marcador inteiro deixa a gota torta — visão geral fica sempre vertical.
 */
export function courierMarkerRotation(_bearing) {
  return 0;
}

export function placeMapMarker(map, prev, iconUrl, className, point, extraClass = '', sizePx, bearing = 0) {
  if (!map || !isValidCoord(point)) return null;
  const isCourier = String(className).includes('courier');
  const rotation = isCourier ? courierMarkerRotation(bearing) : (bearing ?? 0);
  prev?.remove();
  return new mapboxgl.Marker({
    element: createPinElement(iconUrl, className, extraClass, sizePx),
    anchor: 'bottom',
    rotationAlignment: isCourier ? 'viewport' : 'map',
    pitchAlignment: 'map',
  })
    .setLngLat([point.lng, point.lat])
    .setRotation(rotation)
    .addTo(map);
}

/** fitBounds seguro (mapa já removido ou em teardown) */
export function safeFitBounds(mapInstance, bounds, options = {}) {
  if (!mapInstance) return false;
  try {
    if (mapInstance._removed) return false;
    if (typeof mapInstance.isStyleLoaded === 'function' && !mapInstance.isStyleLoaded()) {
      return false;
    }
    mapInstance.fitBounds(bounds, options);
    return true;
  } catch {
    return false;
  }
}

export function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const la1 = toRad(lat1);
  const la2 = toRad(lat2);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Pontos {lat,lng}[] a partir de geometria GeoJSON da rota */
export function coordsFromGeometry(geometry) {
  const geom = geometry?.geometry || geometry;
  const raw = geom?.coordinates;
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => ({ lng: c[0], lat: c[1] }));
}

function projectOnSegment(p, a, b) {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = p.lng;
  const py = p.lat;
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / ab2));
  return { lat: ay + aby * t, lng: ax + abx * t };
}

/** Cola GPS bruto ao percurso (Map Matching simplificado no cliente) */
export function snapToRoute(point, routeCoords) {
  if (!isValidCoord(point) || !routeCoords?.length) return point;
  if (routeCoords.length === 1) return { ...routeCoords[0] };

  let best = { lat: point.lat, lng: point.lng };
  let minD = Infinity;
  let segBearing = 0;

  for (let i = 0; i < routeCoords.length - 1; i += 1) {
    const a = routeCoords[i];
    const b = routeCoords[i + 1];
    const proj = projectOnSegment(point, a, b);
    const d = haversineM(point.lat, point.lng, proj.lat, proj.lng);
    if (d < minD) {
      minD = d;
      best = proj;
      segBearing = calculateBearing(a, b);
    }
  }
  return { ...best, bearing: segBearing };
}

export function getNavTarget(delivery) {
  if (!delivery) return null;
  const goingToStore = ['E-08', 'E-09', 'E-10'].includes(delivery.state);
  return goingToStore ? delivery.pickup : delivery.destination;
}

export function getNavPhaseLabel(delivery) {
  if (!delivery) return '';
  const goingToStore = ['E-08', 'E-09', 'E-10'].includes(delivery.state);
  return goingToStore ? 'A caminho da loja' : 'A caminho do cliente';
}

/** Passo Mapbox Directions mais próximo + distância até à manobra */
export function resolveNavStep(steps, position) {
  if (!steps?.length || !isValidCoord(position)) {
    return { step: null, distanceM: 0, stepIndex: 0 };
  }

  let stepIndex = 0;
  let minDist = Infinity;
  for (let i = 0; i < steps.length; i += 1) {
    const loc = steps[i]?.maneuver?.location;
    if (!loc || loc.length < 2) continue;
    const d = haversineM(position.lat, position.lng, loc[1], loc[0]);
    if (d < minDist) {
      minDist = d;
      stepIndex = i;
    }
  }

  const step = steps[stepIndex];
  const loc = step?.maneuver?.location;
  const distanceM = loc
    ? Math.round(haversineM(position.lat, position.lng, loc[1], loc[0]))
    : Math.round(step?.distance || 0);

  return { step, distanceM: Math.max(0, distanceM), stepIndex };
}

export async function mapMatchGps(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const eps = 0.00015;
  const coordStr = `${lng},${lat};${lng + eps},${lat + eps}`;
  const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordStr}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const coords = data.matchings?.[0]?.geometry?.coordinates;
    if (coords?.length) {
      const last = coords[coords.length - 1];
      return { lng: last[0], lat: last[1] };
    }
  } catch {
    /* fallback: snap local */
  }
  return { lat, lng };
}

export function calculateBearing(start, end) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);
  const dLng = toRad(end.lng - start.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export { mapboxgl };
