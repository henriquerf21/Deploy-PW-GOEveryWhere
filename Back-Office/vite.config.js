import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

const noCacheHeaders = { 'Cache-Control': 'no-store, must-revalidate' };

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    headers: noCacheHeaders,
  },
  preview: {
    port: 4174,
    strictPort: true,
    headers: noCacheHeaders,
  },
  base: './',
});
