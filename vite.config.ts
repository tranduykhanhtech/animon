import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'animon-logo.svg'],
      manifest: {
        name: 'Animon',
        short_name: 'Animon',
        description: 'Bắt và Huấn Luyện Thú Cưng Ngoài Đời Thực!',
        theme_color: '#f43f5e',
        background_color: '#FFF8F0',
        display: 'standalone',
        icons: [
          {
            src: 'animon-logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'animon-logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'animon-logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
})
