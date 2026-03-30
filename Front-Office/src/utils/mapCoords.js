/**
 * Coordenadas para mapas até existir geocoding / API de moradas.
 * Com GPS do cliente usa posição real; caso contrário estima perto da loja.
 */
export function getDestinationLatLng(delivery, storeLat, storeLng) {
  if (
    delivery?.gpsLat != null &&
    delivery?.gpsLng != null &&
    !Number.isNaN(Number(delivery.gpsLat)) &&
    !Number.isNaN(Number(delivery.gpsLng))
  ) {
    return { lat: Number(delivery.gpsLat), lng: Number(delivery.gpsLng) };
  }

  const km = Math.max(0.5, Number(delivery?.estimatedDistance) || 3);
  const latRad = (storeLat * Math.PI) / 180;
  const dLat = (km / 111) * 0.55;
  const dLng = (km / (111 * Math.cos(latRad))) * 0.45;
  return {
    lat: storeLat + dLat,
    lng: storeLng + dLng,
  };
}
