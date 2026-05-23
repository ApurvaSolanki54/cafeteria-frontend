import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 4173,
    // Handles client-side routing on preview server
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // your Spring Boot backend
        changeOrigin: true,               // hide that request came from React
      }
    }
  }
})
