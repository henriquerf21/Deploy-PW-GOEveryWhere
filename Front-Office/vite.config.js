import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const noCacheHeaders = { 'Cache-Control': 'no-store, must-revalidate' };

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    headers: noCacheHeaders,
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: noCacheHeaders,
  },
});
