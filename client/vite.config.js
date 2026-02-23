import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensures absolute paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevents chunk splitting issues
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  },
  // This ensures public files are copied to dist
  publicDir: 'public',
  
  // Add this to handle SPA routing during development
  server: {
    historyApiFallback: true,
  }
})

// Optional: Add this to verify _redirects is copied during build
// You can run this as a post-build script instead
