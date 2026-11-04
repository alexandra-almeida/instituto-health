import { defineConfig } from 'vitest/config'

// Config própria (e não dentro do vite.config.ts) para os testes não carregarem
// os plugins do React e do Tailwind. Por ora só testam lógica pura em src/lib
// (api.ts e destino.ts), sem navegador.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Sem o cache de módulos em disco: o Vitest 5 guarda o resultado de cada
    // arquivo e não percebe quando uma FOTO nova entra em src/assets/descartaveis/
    // (o import.meta.glob de data/descartaveis.ts ficaria com a lista velha e os
    // testes de fotos falhariam ou passariam por engano).
    fsModuleCache: false,
  },
})
