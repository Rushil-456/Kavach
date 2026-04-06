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
        description: 'A simple notes app',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'kavach-logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'kavach-logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
})
