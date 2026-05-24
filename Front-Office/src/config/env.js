function resolveBackendUrl() {
  const fromEnv = import.meta.env.VITE_BACKEND_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:1337';
}

const RAW_BACKEND_URL = resolveBackendUrl();

/** Base para uploads, socket.io e URLs absolutas */
export const BACKEND_URL = RAW_BACKEND_URL;

/** Em dev usa caminho relativo → proxy Vite (/api → Strapi) */
export const API_URL = import.meta.env.DEV ? '/api' : `${RAW_BACKEND_URL}/api`;

export const COURIER_PWA_URL = import.meta.env.VITE_COURIER_PWA_URL || 'https://localhost:5175';
