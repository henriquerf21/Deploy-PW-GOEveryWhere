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

/** Estafeta válido se estiver na zona da entrega (perto da loja OU do destino — rotas longas) */
export function isGpsPlausibleForRoute(courierLat, courierLng, storeLat, storeLng, destLat, destLng, maxKm = 55) {
  if (!Number.isFinite(courierLat) || !Number.isFinite(courierLng)) return false;
  if (courierLat === 0 && courierLng === 0) return false;
  const kmStore = haversineKm(courierLat, courierLng, storeLat, storeLng);
  const kmDest = Number.isFinite(destLat) && Number.isFinite(destLng)
    ? haversineKm(courierLat, courierLng, destLat, destLng)
    : null;
  const nearStore = kmStore != null && kmStore <= maxKm;
  const nearDest = kmDest != null && kmDest <= maxKm;
  return nearStore || nearDest;
}
