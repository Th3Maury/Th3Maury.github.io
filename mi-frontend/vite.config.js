import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://proyecto-especialidad.onrender.com' // <-- Cambia aquí al puerto del backend
    }
  }
})
