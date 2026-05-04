import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Electron loads index.html directly from disk via loadFile().
  // Vite defaults to absolute asset paths (/assets/...) which work in a browser
  // but not when loading from the filesystem. Setting base to './' makes all
  // asset paths relative so Electron can resolve them correctly.
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx'],
          router: ['react-router-dom'],
        },
      },
    },
  },
})
