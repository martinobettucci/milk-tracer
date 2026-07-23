import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // Recharts is ~545 kB min / ~154 kB gzip in its own chunk — expected for a
    // charting lib; raise the advisory threshold above it so builds stay clean.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split heavy vendors so no single chunk trips the size warning and
        // the app loads in parallel pieces.
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
          vendor: ['dexie', 'dexie-react-hooks', 'date-fns'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Prompt the user to update instead of silently reloading mid-feed-log.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Milk Tracer — Newborn Feeding Tracker',
        short_name: 'Milk Tracer',
        description: 'Track your newborn milk feeds, offline. No login.',
        theme_color: '#f97350',
        background_color: '#fdf7f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
