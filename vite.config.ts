import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves the site from https://ashcub.github.io/Amity/
  base: command === 'build' || isPreview ? '/Amity/' : '/',
  plugins: [react()],
}))
