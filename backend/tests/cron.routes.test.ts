import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarAutenticarCron } from '../src/middlewares/autenticarCron.js'
import { tratarErros } from '../src/middlewares/tratarErros.js'

// Repository simulado: nenhuma chamada chega ao Supabase. O que importa aqui
// é que o cron só LÊ (verificarConexao) e nunca grava.
const perfisFalso = vi.hoisted(() => ({
  criar: vi.fn(),
  buscarPorId: vi.fn(),
  verificarConexao: vi.fn(),
}))
vi.mock('../src/repositories/perfis.repository.js', () => ({
  perfisRepository: perfisFalso,
}))

const { default: app } = await import('../src/app.js')

// Mesmo valor definido em vitest.config.ts
const SEGREDO = 'segredo-falso-de-teste-do-cron'

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/cron/manter-ativo', () => {
  it('com o cabeçalho certo: lê o banco e responde { ok: true }', async () => {
    perfisFalso.verificarConexao.mockResolvedValue(undefined)

    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ ok: true })
    expect(perfisFalso.verificarConexao).toHaveBeenCalledTimes(1)
  })

  it('não grava nada no banco', async () => {
    perfisFalso.verificarConexao.mockResolvedValue(undefined)

    await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(perfisFalso.criar).not.toHaveBeenCalled()
  })

  it('sem o cabeçalho: 401 no JSON padrão, sem tocar no banco', async () => {
    const resposta = await request(app).get('/api/cron/manter-ativo')

    expect(resposta.status).toBe(401)
    expect(resposta.body).toEqual({
      erro: { codigo: 'nao_autorizado', mensagem: 'Acesso negado.' },
    })
    expect(perfisFalso.verificarConexao).not.toHaveBeenCalled()
  })

  it.each([
    ['segredo errado', 'Bearer outro-segredo-qualquer-123'],
    ['segredo com o mesmo tamanho', `Bearer ${'x'.repeat(SEGREDO.length)}`],
    ['segredo curto', 'Bearer x'],
    ['Bearer vazio', 'Bearer '],
    ['esquema diferente', `Basic ${SEGREDO}`],
    ['sem esquema', SEGREDO],
    ['prefixo em minúsculas', `bearer ${SEGREDO}`],
    ['segredo com um caractere a mais', `Bearer ${SEGREDO}x`],
    ['segredo com um caractere a menos', `Bearer ${SEGREDO.slice(0, -1)}`],
  ])('%s: 401', async (_nome, cabecalho) => {
    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', cabecalho)

    expect(resposta.status).toBe(401)
    expect(perfisFalso.verificarConexao).not.toHaveBeenCalled()
  })

  it('a resposta nunca repete o segredo', async () => {
    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', 'Bearer eco-do-segredo-enviado-123')

    expect(JSON.stringify(resposta.body)).not.toContain('eco-do-segredo')
    expect(JSON.stringify(resposta.body)).not.toContain(SEGREDO)
  })

  it('banco fora do ar: 500 genérico, sem detalhe do erro', async () => {
    perfisFalso.verificarConexao.mockRejectedValue(
      new Error('Falha ao consultar perfis (PGRST205)'),
    )

    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(resposta.status).toBe(500)
    expect(resposta.body.erro.codigo).toBe('erro_interno')
    expect(JSON.stringify(resposta.body)).not.toContain('PGRST205')
  })
})

describe('autenticarCron sem CRON_SECRET configurada', () => {
  function criarApp(segredo: string | undefined) {
    const mini = express()
    mini.get('/x', criarAutenticarCron(segredo), (_req, res) => {
      res.json({ ok: true })
    })
    mini.use(tratarErros)
    return mini
  }

  it.each([undefined, ''])(
    'responde 401 mesmo com cabeçalho e registra aviso sem valores (%j)',
    async (segredo) => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const resposta = await request(criarApp(segredo))
        .get('/x')
        .set('Authorization', 'Bearer qualquer-coisa-que-seja-enviada')

      expect(resposta.status).toBe(401)
      expect(aviso).toHaveBeenCalledTimes(1)
      const texto = String(aviso.mock.calls[0]?.[0])
      expect(texto).toContain('CRON_SECRET')
      expect(texto).not.toContain('qualquer-coisa')
    },
  )

  it('um cabeçalho "Bearer " vazio também não abre a rota', async () => {
    const resposta = await request(criarApp(undefined))
      .get('/x')
      .set('Authorization', 'Bearer ')

    expect(resposta.status).toBe(401)
  })
})
