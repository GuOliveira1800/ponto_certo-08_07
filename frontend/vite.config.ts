import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths' // adicione esse import
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(), // adicione aqui
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sistema de Ponto',
        short_name: 'Ponto',
        description: 'Sistema de marcação de ponto',
        theme_color: '#3458c4',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})