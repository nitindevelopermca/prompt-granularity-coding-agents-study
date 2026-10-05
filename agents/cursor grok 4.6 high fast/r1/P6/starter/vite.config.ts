import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    port: 8080,
    strictPort: true,
    host: 'localhost',
  },
  preview: {
    port: 8080,
    strictPort: true,
    host: 'localhost',
  },
})
