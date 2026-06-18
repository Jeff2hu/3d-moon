import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 綁定區域網路 IP，手機同 WiFi 即可連入
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
