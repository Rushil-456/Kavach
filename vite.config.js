import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Kavach/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'My Notes',
        short_name: 'Notes',
        description: 'Kavach PWA (stealth shell): anti-stalking signal forensics — unlock from Notes.',
        theme_color: '#0b0f1a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'notes-icon.png', sizes: '192x192', type: 'image/png' },
          { src: 'notes-icon.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
})
