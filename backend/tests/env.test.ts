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

describe('RESEND_API_KEY', () => {
  it('ausente: a API sobe normal, até em produção (só não envia e-mails)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('RESEND_API_KEY', undefined)

    const env = await carregarEnv()

    expect(env.RESEND_API_KEY).toBeUndefined()
  })

  it('vazia: vale como ausente', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const env = await carregarEnv()

    expect(env.RESEND_API_KEY).toBeUndefined()
  })

  it('definida: é lida', async () => {
    vi.stubEnv('RESEND_API_KEY', 'chave-falsa-de-teste')

    const env = await carregarEnv()

    expect(env.RESEND_API_KEY).toBe('chave-falsa-de-teste')
  })
})

describe('MELHOR_ENVIO_TOKEN e MELHOR_ENVIO_AMBIENTE', () => {
  it('sem as variáveis: a API sobe, sem token e no sandbox (mesmo em produção)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('MELHOR_ENVIO_TOKEN', undefined)
    vi.stubEnv('MELHOR_ENVIO_AMBIENTE', undefined)

    const env = await carregarEnv()

    expect(env.MELHOR_ENVIO_TOKEN).toBeUndefined()
    expect(env.MELHOR_ENVIO_AMBIENTE).toBe('sandbox')
  })

  it('vazias (como no .env.example): valem como ausentes', async () => {
    vi.stubEnv('MELHOR_ENVIO_TOKEN', '')
    vi.stubEnv('MELHOR_ENVIO_AMBIENTE', '')

    const env = await carregarEnv()

    expect(env.MELHOR_ENVIO_TOKEN).toBeUndefined()
    expect(env.MELHOR_ENVIO_AMBIENTE).toBe('sandbox')
  })

  it('em produção aceita o ambiente producao e o token', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('MELHOR_ENVIO_AMBIENTE', 'producao')
    vi.stubEnv('MELHOR_ENVIO_TOKEN', 'token-de-teste')

    const env = await carregarEnv()

    expect(env.MELHOR_ENVIO_AMBIENTE).toBe('producao')
    expect(env.MELHOR_ENVIO_TOKEN).toBe('token-de-teste')
  })

  it.each(['development', 'test'])(
    'producao fora de produção (%s) faz a API se recusar a subir, citando só o nome',
    async (nodeEnv) => {
      vi.stubEnv('NODE_ENV', nodeEnv)
      vi.stubEnv('MELHOR_ENVIO_AMBIENTE', 'producao')
      vi.stubEnv('MELHOR_ENVIO_TOKEN', 'token-secreto-123')

      const erro = await carregarEnv().catch((e: unknown) => e)

      expect(erro).toBeInstanceOf(Error)
      expect((erro as Error).message).toContain('MELHOR_ENVIO_AMBIENTE')
      expect((erro as Error).message).not.toContain('token-secreto-123')
    },
  )

  it('ambiente desconhecido: falha citando só o nome', async () => {
    vi.stubEnv('MELHOR_ENVIO_AMBIENTE', 'homologacao')

    const erro = await carregarEnv().catch((e: unknown) => e)

    expect((erro as Error).message).toContain('MELHOR_ENVIO_AMBIENTE')
    expect((erro as Error).message).not.toContain('homologacao')
  })
})
