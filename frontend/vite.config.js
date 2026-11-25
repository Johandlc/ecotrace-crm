import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// dev: /api → Spring Boot (8080). build: se publica en src/main/resources/static del backend.
// fs.allow '..' permite importar los datasets reales de src/main/resources/datos en modo local.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:8080' }, fs: { allow: ['..'] } },
  build: { outDir: '../src/main/resources/static', emptyOutDir: true, chunkSizeWarningLimit: 1500 },
})
