import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sites } from '@openai/sites-vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sites()],
  server: {
    host: '127.0.0.1',
    port: 5183,
    strictPort: true,
  },
})
