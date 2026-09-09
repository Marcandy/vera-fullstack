import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser sees ONE origin in development: the page and /api both come
    // from localhost:5173, so there is no cross origin request and no
    // preflight. That keeps CORS a production concern, configured deliberately
    // for the deployed front end, rather than something switched off locally
    // and discovered on the day of the deploy.
    //
    // Inert until a service starts calling /api. Nothing does yet.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
