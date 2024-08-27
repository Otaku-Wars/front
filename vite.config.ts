import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@memeclashtv/types/activity']
  },
  build: {
    commonjsOptions: {
      include: [/@memeclashtv\/types\/activity/, /node_modules/]
    }
  }
})