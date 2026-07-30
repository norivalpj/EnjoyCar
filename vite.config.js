import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
      },
      manifest: {
        name: 'EnjoyCar',
        short_name: 'EnjoyCar',
        description: 'App for vehicles and maintenance',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'https://base44.com/logo_v2.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'https://base44.com/logo_v2.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
});