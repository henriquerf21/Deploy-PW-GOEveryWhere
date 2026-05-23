/**
 * Em dev com `npm run dev` (HTTPS + proxy), omitir VITE_BACKEND_URL no .env.local
 * para o telemóvel usar o mesmo origin — GPS e API sem mixed content.
 */
function resolveBackendUrl() {
  const fromEnv = import.meta.env.VITE_BACKEND_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:1337';
}

export const BACKEND_URL = resolveBackendUrl();
export const API_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export function isApiMixedContentRisk() {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext && BACKEND_URL.startsWith('http://');
}

/** Botões de simulação de rota (dev/teste) */
export const ENABLE_COURIER_SIM = import.meta.env.VITE_ENABLE_COURIER_SIM !== 'false';
