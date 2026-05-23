import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
    base: './',
    server: {
        host: true,
        port: 5175,
        https: true,
        proxy: {
            '/api': { target: 'http://127.0.0.1:1337', changeOrigin: true },
            '/uploads': { target: 'http://127.0.0.1:1337', changeOrigin: true },
            '/socket.io': { target: 'http://127.0.0.1:1337', ws: true, changeOrigin: true },
        },
    },
    plugins: [
        basicSsl(),
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            minify: false,
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            includeAssets: ['favicon.svg', 'icons/*.png', 'media/brand/*.svg', 'media/map/*.png'],
            manifest: {
                name: 'GoEverywhere Estafeta',
                short_name: 'GE Estafeta',
                description: 'Aplicação PWA para estafetas da GoEverywhere',
                start_url: './',
                scope: './',
                display: 'standalone',
                orientation: 'portrait-primary',
                background_color: '#f8fafa',
                theme_color: '#1b8a4a',
                icons: [
                    { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                    { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
                ],
            },
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
            },
        }),
    ],
});
