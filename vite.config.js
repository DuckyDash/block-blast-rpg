import { defineConfig } from 'vite'

export default defineConfig({
  base: './',        // penting buat Capacitor (relative paths)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
})
