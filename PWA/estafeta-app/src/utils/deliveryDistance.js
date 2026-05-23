import { haversineKm, isValidGpsPoint } from './geo.js';
import { fetchMapboxRoute, isValidCoord } from './mapbox.js';

const MIN_TRACK_SEGMENT_KM = 0.008;
const MIN_TRACK_TOTAL_KM = 0.15;

/** Soma distância entre amostras GPS consecutivas (km percorridos reais na sessão). */
export function accumulateGpsOnDelivery(delivery, lat, lng) {
  if (!delivery || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const next = { lat, lng };
  const prev = delivery._gpsTrackLast;
  if (prev && isValidGpsPoint(prev)) {
    const seg = haversineKm(prev.lat, prev.lng, next.lat, next.lng);
    if (seg != null && seg >= MIN_TRACK_SEGMENT_KM) {
      delivery.gpsTrackDistanceKm = (delivery.gpsTrackDistanceKm || 0) + seg;
    }
  }
  delivery._gpsTrackLast = next;
}

/** Distância rodoviária loja → cliente (OSRM/Mapbox), com fallback haversine. */
export async function fetchStoreToDestRouteKm(pickup, destination) {
  const store = { lat: pickup.lat, lng: pickup.lng };
  const dest = { lat: destination.lat, lng: destination.lng };
  if (!isValidCoord(store) || !isValidCoord(dest)) return 0;

  const route = await fetchMapboxRoute([store, dest]);
  if (route?.distance > 0) {
    return parseFloat((route.distance / 1000).toFixed(2));
  }

  const straight = haversineKm(store.lat, store.lng, dest.lat, dest.lng);
  return straight != null ? parseFloat(straight.toFixed(2)) : 0;
}

/**
 * Km da entrega: GPS acumulado na sessão (se suficiente) senão rota OSRM loja→cliente.
 */
export async function resolveDeliveryDistanceKm(delivery) {
  if (!delivery?.pickup || !delivery?.destination) return 0;
  if (Number.isFinite(delivery.routeDistanceKm) && delivery.routeDistanceKm > 0) {
    return delivery.routeDistanceKm;
  }

  const track = delivery.gpsTrackDistanceKm;
  if (Number.isFinite(track) && track >= MIN_TRACK_TOTAL_KM) {
    delivery.routeDistanceKm = parseFloat(track.toFixed(2));
    return delivery.routeDistanceKm;
  }

  const km = await fetchStoreToDestRouteKm(delivery.pickup, delivery.destination);
  delivery.routeDistanceKm = km;
  return km;
}

/** Preenche routeDistanceKm em entregas concluídas (histórico/métricas). */
export async function enrichDeliveriesRouteKm(deliveries, { concurrency = 4 } = {}) {
  const list = deliveries.filter((d) => !d.routeDistanceKm);
  if (!list.length) return;

  let index = 0;
  async function worker() {
    while (index < list.length) {
      const i = index++;
      await resolveDeliveryDistanceKm(list[i]);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, list.length) }, () => worker());
  await Promise.all(workers);
}

export function deliveryCompletedAtIso(delivery) {
  return delivery?.timestamps?.['E-13']
    || delivery?.timestamps?.['E-14']
    || null;
}

export function isDeliveryOnDate(iso, refDate = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  const r = refDate instanceof Date ? refDate : new Date(refDate);
  return d.getFullYear() === r.getFullYear()
    && d.getMonth() === r.getMonth()
    && d.getDate() === r.getDate();
}

export function isDeliveryInLastDays(iso, days = 7, refDate = new Date()) {
  if (!iso) return false;
  const end = refDate instanceof Date ? refDate : new Date(refDate);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return new Date(iso) >= start;
}

export function isDeliveryThisMonth(iso, refDate = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  const r = refDate instanceof Date ? refDate : new Date(refDate);
  return d.getFullYear() === r.getFullYear() && d.getMonth() === r.getMonth();
}
