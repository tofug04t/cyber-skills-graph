import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the project site from /<repo>/
  base: '/cyber-skills-graph/',
  plugins: [react()],
})
