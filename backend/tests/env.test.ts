import { afterEach, describe, expect, it, vi } from 'vitest'

// env.ts lê process.env uma vez, ao ser importado; por isso cada caso limpa o
// cache de módulos e importa de novo com as variáveis desejadas.
async function carregarEnv() {
  vi.resetModules()
  return (await import('../src/config/env.js')).env
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CRON_SECRET', () => {
  it('ausente: a API sobe normal, até em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CRON_SECRET', undefined)

    const env = await carregarEnv()

    expect(env.CRON_SECRET).toBeUndefined()
  })

  it('vazia (como no .env.example): vale como ausente', async () => {
    vi.stubEnv('CRON_SECRET', '')

    const env = await carregarEnv()

    expect(env.CRON_SECRET).toBeUndefined()
  })

  it('definida com 16 caracteres ou mais: aceita', async () => {
    vi.stubEnv('CRON_SECRET', 'a'.repeat(16))

    const env = await carregarEnv()

    expect(env.CRON_SECRET).toBe('a'.repeat(16))
  })

  it('definida com menos de 16 caracteres: falha citando só o nome', async () => {
    vi.stubEnv('CRON_SECRET', 'curto-demais')

    const erro = await carregarEnv().catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).toContain('CRON_SECRET')
    expect((erro as Error).message).not.toContain('curto-demais')
  })
})
