/** Ícone e textos do HUD de navegação (manobras Mapbox Directions) */

export function getManeuverKey(maneuver) {
  if (!maneuver) return 'straight';
  const type = (maneuver.type || '').toLowerCase();
  const mod = (maneuver.modifier || '').toLowerCase();

  if (type === 'arrive') return 'arrive';
  if (type === 'roundabout' || type === 'rotary') return 'roundabout';
  if (type === 'depart') return 'depart';
  if (mod.includes('uturn')) return 'uturn';
  if (mod.includes('sharp left') || mod === 'left') return 'turn-left';
  if (mod.includes('sharp right') || mod === 'right') return 'turn-right';
  if (mod.includes('slight left')) return 'slight-left';
  if (mod.includes('slight right')) return 'slight-right';
  if (mod === 'straight' || type === 'continue' || type === 'merge') return 'straight';
  if (type === 'fork' && mod.includes('left')) return 'fork-left';
  if (type === 'fork' && mod.includes('right')) return 'fork-right';
  if (type === 'off ramp' && mod.includes('left')) return 'ramp-left';
  if (type === 'off ramp' && mod.includes('right')) return 'ramp-right';
  return 'straight';
}

export function formatNavDistance(meters) {
  const m = Number(meters);
  if (!Number.isFinite(m) || m < 0) return '—';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

/** minutes total → "1h 25" ou "38 min" */
export function formatNavDuration(totalMinutes) {
  const min = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r > 0 ? `${h}h ${r} min` : `${h}h`;
}

/** Nome da rua: step.name ou extraído da instrução PT */
export function getNavStreetName(step) {
  if (!step) return 'Segue o percurso';
  if (step.name) return step.name;
  const text = step.maneuver?.instruction || '';
  const m = text.match(/(?:na|em|para|sobre|pela|pelo|à|ao)\s+(.+)$/i);
  if (m?.[1]) return m[1].replace(/\.$/, '').trim();
  return text || 'Segue o percurso';
}

/** Soma duração/distância dos passos restantes a partir do índice atual */
export function sumRemainingFromSteps(steps, fromIndex, extraDistanceM = 0) {
  if (!steps?.length) {
    return { distanceM: extraDistanceM, durationSec: 0 };
  }
  let distanceM = Math.max(0, extraDistanceM);
  let durationSec = 0;
  const start = Math.max(0, fromIndex);
  for (let i = start; i < steps.length; i += 1) {
    distanceM += steps[i].distance || 0;
    durationSec += steps[i].duration || 0;
  }
  return { distanceM, durationSec };
}
