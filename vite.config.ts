import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['dark-views-camp.loca.lt'], // Allow the local tunnel host
    host: true, // Allow external access
  }
})
