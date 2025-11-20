import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages with a custom domain, assets should be served from root
  // If you later use project pages (no custom domain), set this to `/<repo>/`
  base: '/',
})
