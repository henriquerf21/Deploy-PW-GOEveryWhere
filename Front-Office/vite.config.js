import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath, URL } from 'node:url';

const noCacheHeaders = { 'Cache-Control': 'no-store, must-revalidate' };

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    basicSsl(),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GoEverywhere - GoGummies',
        short_name: 'GoGummies',
        description: 'A tua aplicação de entrega rápida de gomas de proteína.',
        theme_color: '#00c853',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    headers: noCacheHeaders,
    https: true,
    proxy: {
        '/api': { target: 'http://127.0.0.1:1337', changeOrigin: true },
        '/uploads': { target: 'http://127.0.0.1:1337', changeOrigin: true },
        '/socket.io': { target: 'http://127.0.0.1:1337', ws: true, changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: noCacheHeaders,
  },
});
