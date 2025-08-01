import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './client', // Point to new client directory
  server: {
    host: '0.0.0.0', // Allow external network access
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    outDir: '../client/dist', // Build output directory
    emptyOutDir: true,
  },
})