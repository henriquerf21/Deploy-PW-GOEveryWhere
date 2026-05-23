const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

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

export function straightLinePoints(a, b) {
  return [[a[0], a[1]], [b[0], b[1]]];
}

export function deliveryLegsStraightLine(courier, store, dest) {
  return {
    leg1: straightLinePoints(courier, store),
    leg2: straightLinePoints(store, dest),
    fromApi: false,
  };
}

export async function fetchStoreToDestLeg(store, dest, signal) {
  const r = await fetchRouteThroughPoints([store, dest], signal);
  return r?.coordinates?.length ? r.coordinates : straightLinePoints(store, dest);
}

export async function fetchDeliveryLegs(courier, store, dest, signal) {
  const hasCourier = courier
    && Number.isFinite(courier[0]) && Number.isFinite(courier[1]);
  try {
    const leg2Promise = fetchRouteThroughPoints([store, dest], signal);
    const leg1Promise = hasCourier
      ? fetchRouteThroughPoints([courier, store], signal)
      : Promise.resolve(null);
    const [r1, r2] = await Promise.all([leg1Promise, leg2Promise]);
    const leg2 = r2?.coordinates?.length ? r2.coordinates : straightLinePoints(store, dest);
    const leg1 = hasCourier
      ? (r1?.coordinates?.length ? r1.coordinates : straightLinePoints(courier, store))
      : null;
    return { leg1, leg2, fromApi: !!(r2?.coordinates?.length) };
  } catch (e) {
    if (signal?.aborted) throw e;
    return {
      leg1: hasCourier ? straightLinePoints(courier, store) : null,
      leg2: straightLinePoints(store, dest),
      fromApi: false,
    };
  }
}
