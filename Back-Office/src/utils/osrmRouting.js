/**
 * Rotas rodoviárias via OSRM público (OpenStreetMap).
 * Percurso: estafeta → loja → destino (duas pernas para estilos diferentes no mapa).
 */
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * @param {Array<[number, number]>} points — [lat, lng][]
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ coordinates: [number,number][], distance: number, duration: number } | null>}
 */
export async function fetchRouteThroughPoints(points, signal) {
  if (!points || points.length < 2) return null;
  const coordStr = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null;
    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return {
      coordinates: coords,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };
  } catch {
    return null;
  }
}

/** Linha reta fallback [lat,lng][] */
export function straightLinePoints(a, b) {
  return [
    [a[0], a[1]],
    [b[0], b[1]],
  ];
}

/** Mesma forma que fetchDeliveryLegs, sem rede (CORS offline, abort, etc.) */
export function deliveryLegsStraightLine(courier, store, dest) {
  return {
    leg1: straightLinePoints(courier, store),
    leg2: straightLinePoints(store, dest),
    fromApi: false,
    distanceM: 0,
    durationS: 0,
  };
}

/**
 * @param {[number,number]} courier — [lat,lng]
 * @param {[number,number]} store
 * @param {[number,number]} dest
 */
export async function fetchStoreToDestLeg(store, dest, signal) {
  const r = await fetchRouteThroughPoints([store, dest], signal);
  return r?.coordinates?.length ? r.coordinates : straightLinePoints(store, dest);
}

export async function fetchDeliveryLegs(courier, store, dest, signal) {
  try {
    const [r1, r2] = await Promise.all([
      fetchRouteThroughPoints([courier, store], signal),
      fetchRouteThroughPoints([store, dest], signal),
    ]);
    const leg1 = r1?.coordinates?.length
      ? r1
      : { coordinates: straightLinePoints(courier, store), distance: 0, duration: 0 };
    const leg2 = r2?.coordinates?.length
      ? r2
      : { coordinates: straightLinePoints(store, dest), distance: 0, duration: 0 };
    return {
      leg1: leg1.coordinates,
      leg2: leg2.coordinates,
      fromApi: !!(r1?.coordinates?.length && r2?.coordinates?.length),
      distanceM: (r1?.distance || 0) + (r2?.distance || 0),
      durationS: (r1?.duration || 0) + (r2?.duration || 0),
    };
  } catch (e) {
    if (signal?.aborted) throw e;
    return deliveryLegsStraightLine(courier, store, dest);
  }
}
