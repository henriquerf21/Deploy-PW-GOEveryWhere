const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337';

export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');
export const API_URL = `${BACKEND_URL}/api`;
export const COURIER_PWA_URL = import.meta.env.VITE_COURIER_PWA_URL || 'http://localhost:5175';
