/** Resolve coordenadas da loja pelo nome (catálogo BO ou lista estática) */
export function resolveStoreCoords(storeName, catalog = []) {
  const key = String(storeName || '').trim().toLowerCase();
  if (!key) return null;

  const list = Array.isArray(catalog) ? catalog : [];
  for (const s of list) {
    const n = String(s.name || '').toLowerCase();
    if (!n) continue;
    if (key === n || key.includes(n) || n.includes(key)) {
      const lat = Number(s.lat);
      const lng = Number(s.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  const tokens = key.split(/\s+/).filter((t) => t.length > 3);
  for (const s of list) {
    const n = String(s.name || '').toLowerCase();
    if (tokens.some((t) => n.includes(t))) {
      const lat = Number(s.lat);
      const lng = Number(s.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  return null;
}
