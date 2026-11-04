import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-icons')) {
              return 'vendor-react-icons';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react-router-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('recharts') || id.includes('/d3-') || id.includes('/d3/')) {
              return 'vendor-charts';
            }
            if (id.includes('@aws-amplify') || id.includes('aws-amplify')) {
              return 'vendor-aws';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }
            return 'vendor-core';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
