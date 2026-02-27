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
        // SSE: don't buffer event-stream responses
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const ct = proxyRes.headers['content-type'] || ''
            if (ct.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache'
              proxyRes.headers['x-accel-buffering'] = 'no'
            }
          })
        },
      },
      '/api/kitz': {
        target: 'http://localhost:3012',
        timeout: 120_000, // AI semantic router can take 30-60s
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Extend socket timeout for long-running AI calls
            proxyReq.socket.setTimeout(120_000)
          })
        },
      },
      '/api/comms': {
        target: 'http://localhost:3013',
        rewrite: (p) => p.replace(/^\/api\/comms/, ''),
      },
      '/api/logs': {
        target: 'http://localhost:3014',
        rewrite: (p) => p.replace(/^\/api\/logs/, ''),
      },
    },
  },
})
