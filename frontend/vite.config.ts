// ...existing code...
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: dirname(fileURLToPath(import.meta.url)) + '/node_modules/react',
      'react-dom': dirname(fileURLToPath(import.meta.url)) + '/node_modules/react-dom',
      'react-dom/client': dirname(fileURLToPath(import.meta.url)) + '/node_modules/react-dom/client',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '^/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
// ...existing code...