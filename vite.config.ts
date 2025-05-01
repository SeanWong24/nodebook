import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'es2022'
  },
  server: {
    allowedHosts: true,
    host: true
  }
})
