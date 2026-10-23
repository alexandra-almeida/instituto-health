import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Valores falsos de propósito: os testes nunca falam com o Supabase de
    // verdade e não dependem do backend/.env
    env: {
      SUPABASE_URL: 'https://exemplo.supabase.co',
      SUPABASE_SECRET_KEY: 'chave-falsa-de-teste',
      CRON_SECRET: 'segredo-falso-de-teste-do-cron',
    },
  },
})
