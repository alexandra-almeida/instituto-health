import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarAutenticarCron } from '../src/middlewares/autenticarCron.js'
import { tratarErros } from '../src/middlewares/tratarErros.js'

// Repository simulado: nenhuma chamada chega ao Supabase. O cron grava a data
// do batimento (registrar) e depois a lê de volta (ler); o perfil não é tocado.
const batimentosFalso = vi.hoisted(() => ({
  registrar: vi.fn(),
  ler: vi.fn(),
}))
vi.mock('../src/repositories/batimentos.repository.js', () => ({
  batimentosRepository: batimentosFalso,
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
  it('com o cabeçalho certo: grava o batimento, lê de volta e responde { ok: true }', async () => {
    batimentosFalso.registrar.mockResolvedValue(undefined)
    batimentosFalso.ler.mockResolvedValue(new Date(Date.now() + 1000))

    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ ok: true })
    expect(batimentosFalso.registrar).toHaveBeenCalledTimes(1)
    expect(batimentosFalso.registrar.mock.calls[0]?.[0]).toBeInstanceOf(Date)
    expect(batimentosFalso.ler).toHaveBeenCalledTimes(1)
  })

  it('grava ANTES de ler', async () => {
    batimentosFalso.registrar.mockResolvedValue(undefined)
    batimentosFalso.ler.mockResolvedValue(new Date(Date.now() + 1000))

    await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(batimentosFalso.registrar.mock.invocationCallOrder[0]).toBeLessThan(
      batimentosFalso.ler.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('falha ao gravar: 500 genérico e nem tenta ler', async () => {
    batimentosFalso.registrar.mockRejectedValue(
      new Error('Falha ao registrar batimento (42P01)'),
    )

    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(resposta.status).toBe(500)
    expect(resposta.body.erro.codigo).toBe('erro_interno')
    expect(JSON.stringify(resposta.body)).not.toContain('42P01')
    expect(batimentosFalso.ler).not.toHaveBeenCalled()
  })

  it.each([
    ['a linha não existe', null],
    ['a data lida é mais antiga que a gravada', new Date(0)],
  ])('%s: 500, porque a gravação não foi confirmada', async (_nome, lido) => {
    batimentosFalso.registrar.mockResolvedValue(undefined)
    batimentosFalso.ler.mockResolvedValue(lido)

    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', `Bearer ${SEGREDO}`)

    expect(resposta.status).toBe(500)
    expect(resposta.body.erro.codigo).toBe('erro_interno')
  })

  it('sem o cabeçalho: 401 no JSON padrão, sem tocar no banco', async () => {
    const resposta = await request(app).get('/api/cron/manter-ativo')

    expect(resposta.status).toBe(401)
    expect(resposta.body).toEqual({
      erro: { codigo: 'nao_autorizado', mensagem: 'Acesso negado.' },
    })
    expect(batimentosFalso.registrar).not.toHaveBeenCalled()
    expect(batimentosFalso.ler).not.toHaveBeenCalled()
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
    expect(batimentosFalso.registrar).not.toHaveBeenCalled()
  })

  it('a resposta nunca repete o segredo', async () => {
    const resposta = await request(app)
      .get('/api/cron/manter-ativo')
      .set('Authorization', 'Bearer eco-do-segredo-enviado-123')

    expect(JSON.stringify(resposta.body)).not.toContain('eco-do-segredo')
    expect(JSON.stringify(resposta.body)).not.toContain(SEGREDO)
  })

  it('banco fora do ar: 500 genérico, sem detalhe do erro', async () => {
    batimentosFalso.registrar.mockRejectedValue(
      new Error('Falha ao registrar batimento (PGRST205)'),
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
