import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // En GitHub Pages la app vive en una subruta (VITE_BASE=/repo/app/).
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  server: {
    port: 5174,
  },
})
