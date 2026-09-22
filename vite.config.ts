import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs work under a GitHub Pages repository path and custom domains.
  base: './',
  plugins: [preact(), VitePWA({
    // Activate new versions after closing the app, without interrupting play.
    registerType: 'prompt',
    injectRegister: 'script',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      id: './',
      name: 'Mała Kolej — Tablica odjazdów',
      short_name: 'Mała Kolej',
      description: 'Tablica odjazdów dla Waszej kolejki H0, także bez internetu.',
      lang: 'pl',
      start_url: './',
      scope: './',
      display: 'standalone',
      theme_color: '#14243c',
      background_color: '#f7f8f5',
      icons: [
        { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true,
    },
  })],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['src/styles'],
      },
    },
  },
})
