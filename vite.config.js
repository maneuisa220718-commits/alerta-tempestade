import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      srcDir: 'public',
      filename: 'sw-custom.js',
      strategies: 'injectManifest',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'App de Alerta Mobile',
        short_name: 'App Alerta',
        description: 'Aplicativo de alertas manuais e emergência em tempo real com sala de espera',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
