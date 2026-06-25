import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../triageai-backend/src/main/resources/static',
    emptyOutDir: true
  },
  server: { proxy: { '/api': 'http://localhost:8080', '/uploads': 'http://localhost:8080' } }
})
