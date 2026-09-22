import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs work under a GitHub Pages repository path and custom domains.
  base: './',
  plugins: [preact()],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['src/styles'],
      },
    },
  },
})
