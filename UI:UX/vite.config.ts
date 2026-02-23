import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/gateway': {
        target: 'http://localhost:4000',
        rewrite: (p) => p.replace(/^\/api\/gateway/, ''),
      },
      '/api/workspace': {
        target: 'http://localhost:3001',
        rewrite: (p) => p.replace(/^\/api\/workspace/, ''),
      },
      '/api/whatsapp': {
        target: 'http://localhost:3006',
        rewrite: (p) => p.replace(/^\/api\/whatsapp/, ''),
      },
      '/api/kitz': {
        target: 'http://localhost:3012',
      },
    },
  },
})
