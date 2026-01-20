import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5201',
        changeOrigin: true,
        secure: false,
      },
      '/community-api': {
        target: 'http://localhost:5201',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/community-api/, '/api'),
      },
      '/uploads': {
        target: 'http://localhost:5201',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5201',
        changeOrigin: true,
        ws: true,
        secure: false,
      }
    }
  }
})
