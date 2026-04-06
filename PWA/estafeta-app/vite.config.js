import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            minify: false,
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            includeAssets: ['favicon.svg', 'icons/*.png', 'media/brand/*.svg'],
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
