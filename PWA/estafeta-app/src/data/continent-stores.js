/** Coordenadas das lojas Continente (subset do seed do backend). */
export const CONTINENTE_STORES = [
  { name: 'Continente Modelo Leça do Balio', lat: 41.2088, lng: -8.6892 },
  { name: 'Continente Antas', lat: 41.163563, lng: -8.584454 },
  { name: 'Continente (Gaia Jardim)', lat: 41.137423, lng: -8.638161 },
  { name: 'Continente Braga', lat: 41.541195, lng: -8.400127 },
  { name: 'Continente Braga Nova Arcada', lat: 41.579146, lng: -8.428886 },
];

export function resolveStoreCoords(storeName) {
  const key = String(storeName || '').trim().toLowerCase();
  if (!key) return null;
  const hit = CONTINENTE_STORES.find((s) => {
    const n = s.name.toLowerCase();
    return key === n || key.includes(n) || n.includes(key);
  });
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}
