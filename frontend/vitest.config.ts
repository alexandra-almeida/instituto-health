import { defineConfig } from 'vitest/config'

// Config própria (e não dentro do vite.config.ts) para os testes não carregarem
// os plugins do React e do Tailwind. Por ora só testam lógica pura em src/lib
// (api.ts e destino.ts), sem navegador.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
