/** Distância Haversine em km entre dois pontos { lat, lng } */
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

export function isValidGpsPoint(point) {
  return point
    && Number.isFinite(point.lat)
    && Number.isFinite(point.lng)
    && !(point.lat === 0 && point.lng === 0);
}

/** GPS na zona da entrega: perto da loja OU do destino */
export function isGpsNearDelivery(gps, delivery, maxKm = 55) {
  if (!isValidGpsPoint(gps) || !delivery?.pickup) return false;
  const kmPickup = haversineKm(gps.lat, gps.lng, delivery.pickup.lat, delivery.pickup.lng);
  const dest = delivery.destination;
  const kmDest = isValidGpsPoint(dest)
    ? haversineKm(gps.lat, gps.lng, dest.lat, dest.lng)
    : null;
  const nearStore = kmPickup != null && kmPickup <= maxKm;
  const nearDest = kmDest != null && kmDest <= maxKm;
  return nearStore || nearDest;
}
