/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const auth = req.headers['authorization']
            if (auth) proxyReq.setHeader('Authorization', Array.isArray(auth) ? auth[0] : auth)
          })
        },
      },
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
      },
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const apiKey = req.headers['x-api-key']
            if (apiKey) proxyReq.setHeader('x-api-key', Array.isArray(apiKey) ? apiKey[0] : apiKey)
            const version = req.headers['anthropic-version']
            if (version) proxyReq.setHeader('anthropic-version', Array.isArray(version) ? version[0] : version)
          })
        },
      },
    },
  },
  resolve: {
    alias: {
      '@frontend': path.resolve(__dirname, 'src/frontend'),
      '@backend': path.resolve(__dirname, 'src/backend'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
