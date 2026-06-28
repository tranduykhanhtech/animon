import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.ico', 'animon-logo.png'],
      manifest: {
        name: 'Animon',
        short_name: 'Animon',
        description: 'Bắt và Huấn Luyện Thú Cưng Ngoài Đời Thực!',
        theme_color: '#f43f5e',
        background_color: '#FFF8F0',
        display: 'standalone',
        icons: [
          {
            src: 'animon-logo.png',
            sizes: '1024x1024',
            type: 'image/png'
          },
          {
            src: 'animon-logo.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
