const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337';

export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');
export const API_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
/** Botões de simulação de rota (dev/teste) */
export const ENABLE_COURIER_SIM = import.meta.env.VITE_ENABLE_COURIER_SIM !== 'false';
