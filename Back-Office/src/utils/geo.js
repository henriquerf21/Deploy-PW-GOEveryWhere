export function haversineKm(lat1, lng1, lat2, lng2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return null;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Coordenada finita e não (0,0) — evita rotas para o Golfo da Guiné */
export function isValidMapGps(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (Math.abs(la) < 0.0001 && Math.abs(ln) < 0.0001) return false;
  return true;
}

export function isGpsPlausibleForRoute(courierLat, courierLng, storeLat, storeLng, destLat, destLng, maxKm = 55) {
  if (!isValidMapGps(courierLat, courierLng)) return false;
  const kmStore = haversineKm(courierLat, courierLng, storeLat, storeLng);
  const kmDest = Number.isFinite(destLat) && Number.isFinite(destLng)
    ? haversineKm(courierLat, courierLng, destLat, destLng)
    : null;
  const nearStore = kmStore != null && kmStore <= maxKm;
  const nearDest = kmDest != null && kmDest <= maxKm;
  return nearStore || nearDest;
}
