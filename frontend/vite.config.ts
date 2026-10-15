import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // O site chama sempre caminhos relativos /api/...; em desenvolvimento eles
    // vão para o backend local (backend/, porta 3333). Em produção o mesmo
    // caminho é resolvido pelo rewrite do vercel.json.
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
})
