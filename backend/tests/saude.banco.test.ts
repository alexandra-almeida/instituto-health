import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Repository simulado: nenhuma chamada chega ao Supabase. A rota só pode LER
// (ler) e nunca gravar (registrar); devolve só o status e a data do último
// batimento, e nunca detalhe de erro.
const batimentosFalso = vi.hoisted(() => ({
  registrar: vi.fn(),
  ler: vi.fn(),
}))
vi.mock('../src/repositories/batimentos.repository.js', () => ({
  batimentosRepository: batimentosFalso,
}))

const { default: app } = await import('../src/app.js')

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/saude/banco', () => {
  it('banco respondendo: 200 com o status e a data ISO do último batimento, sem cabeçalho de acesso', async () => {
    batimentosFalso.ler.mockResolvedValue(new Date('2026-10-31T12:00:00Z'))

    const resposta = await request(app).get('/api/saude/banco')

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({
      status: 'ok',
      ultimo: '2026-10-31T12:00:00.000Z',
    })
    expect(batimentosFalso.ler).toHaveBeenCalledTimes(1)
  })

  it('só lê: nunca grava', async () => {
    batimentosFalso.ler.mockResolvedValue(null)

    await request(app).get('/api/saude/banco')

    expect(batimentosFalso.registrar).not.toHaveBeenCalled()
  })

  it('não expõe nenhum outro dado além de status e ultimo', async () => {
    batimentosFalso.ler.mockResolvedValue(new Date('2026-10-31T12:00:00Z'))

    const resposta = await request(app).get('/api/saude/banco')

    expect(Object.keys(resposta.body).sort()).toEqual(['status', 'ultimo'])
  })

  it('linha ainda ausente (antes do primeiro cron): 200 com ultimo null, o banco respondeu', async () => {
    batimentosFalso.ler.mockResolvedValue(null)

    const resposta = await request(app).get('/api/saude/banco')

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'ok', ultimo: null })
  })

  it('banco fora do ar: 503 no JSON padrão, sem detalhe do erro, e registra no log', async () => {
    batimentosFalso.ler.mockRejectedValue(
      new Error('Falha ao ler batimento (PGRST205)'),
    )

    const resposta = await request(app).get('/api/saude/banco')

    expect(resposta.status).toBe(503)
    expect(resposta.body).toEqual({
      erro: {
        codigo: 'banco_indisponivel',
        mensagem: 'O banco de dados não respondeu.',
      },
    })
    expect(JSON.stringify(resposta.body)).not.toContain('PGRST205')
    expect(resposta.body).not.toHaveProperty('ultimo')
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['sucesso', () => batimentosFalso.ler.mockResolvedValue(null)],
    [
      'falha',
      () => batimentosFalso.ler.mockRejectedValue(new Error('falha qualquer')),
    ],
  ])('%s: a resposta nunca fica em cache', async (_nome, preparar) => {
    preparar()

    const resposta = await request(app).get('/api/saude/banco')

    expect(resposta.headers['cache-control']).toBe('no-store')
  })

  it('só aceita GET: POST dá 404 e não toca no banco', async () => {
    const resposta = await request(app).post('/api/saude/banco')

    expect(resposta.status).toBe(404)
    expect(batimentosFalso.ler).not.toHaveBeenCalled()
  })

  it('a rota /api/saude de antes continua sem tocar no banco', async () => {
    const resposta = await request(app).get('/api/saude')

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'ok' })
    expect(batimentosFalso.ler).not.toHaveBeenCalled()
  })
})
