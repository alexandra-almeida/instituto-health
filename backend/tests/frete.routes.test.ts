import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'

// O service do frete (que fala com o banco e o Melhor Envio) é trocado por um
// simulado; a validação, a proteção de origem e o formato da resposta rodam de
// verdade. A lógica da cotação tem os próprios testes (frete.service.test.ts).
const freteFalso = vi.hoisted(() => ({
  cotar: vi.fn(),
  cotarServicoEscolhido: vi.fn(),
}))
vi.mock('../src/modules/frete/frete.service.js', () => ({
  freteService: freteFalso,
  criarFreteService: vi.fn(),
  comoCotadorDeFrete: vi.fn(),
}))

// O limite de tentativas por IP (banco) é trocado por um simulado que nunca
// bloqueia; o comportamento dele tem teste próprio (limitarTentativas.test.ts)
vi.mock('../src/repositories/limites.repository.js', () => ({
  limitesRepository: {
    // funções simples (não vi.fn): o resetAllMocks dos testes não as desfaz
    registrar: async () => ({ excedeu: false, esperaSegundos: 1 }),
    limparVencidos: async () => 0,
  },
}))

const { default: app } = await import('../src/app.js')

const ROTA = '/api/frete/cotacao'
const COTACAO = {
  soRetirada: false,
  motivoSoRetirada: null,
  opcoes: [
    {
      servicoId: 1,
      servico: 'PAC',
      transportadora: 'Correios',
      preco: 39.5,
      prazoMinDias: 10,
      prazoMaxDias: 11,
      volumes: 1,
    },
  ],
  retirada: {
    disponivel: true,
    rotulo: 'Retirar na clínica (Rincão, SP)',
    endereco: 'Rua 15 de Novembro, 464, Centro, Rincão, SP, CEP 14830-021',
  },
  freteIndisponivel: false,
  semServicoParaOCep: false,
}
const corpo = (extra: Record<string, unknown> = {}) => ({
  cep: '13500-000',
  itens: [{ sku: 'niacine-7', quantidade: 2 }],
  ...extra,
})

beforeEach(() => {
  vi.resetAllMocks()
  freteFalso.cotar.mockResolvedValue(COTACAO)
})

describe('POST /api/frete/cotacao', () => {
  it('é pública (sem login), sem cache, e entrega a cotação do servidor', async () => {
    const r = await request(app).post(ROTA).send(corpo())
    expect(r.status).toBe(200)
    expect(r.headers['cache-control']).toBe('no-store')
    expect(r.body).toEqual(COTACAO)
  })

  it('limpa o CEP (só dígitos) e manda os itens ao service', async () => {
    await request(app).post(ROTA).send(corpo())
    expect(freteFalso.cotar).toHaveBeenCalledWith('13500000', [
      { sku: 'niacine-7', quantidade: 2 },
    ])
  })

  it('o navegador não influencia o preço: campos de frete, preço e total enviados são descartados', async () => {
    await request(app)
      .post(ROTA)
      .send(corpo({ frete: 0, preco: 1, total: 1, servicoId: 1, desconto: 99 }))
    expect(freteFalso.cotar).toHaveBeenCalledTimes(1)
    expect(freteFalso.cotar.mock.calls[0]).toEqual([
      '13500000',
      [{ sku: 'niacine-7', quantidade: 2 }],
    ])
  })

  it.each([
    ['sem CEP', { cep: undefined }],
    ['CEP curto', { cep: '1350' }],
    ['CEP com letras', { cep: 'abcdefgh' }],
    ['sem itens', { itens: [] }],
    ['sku inválido', { itens: [{ sku: 'Niacine 7', quantidade: 1 }] }],
    ['quantidade zero', { itens: [{ sku: 'niacine-7', quantidade: 0 }] }],
    ['quantidade 100', { itens: [{ sku: 'niacine-7', quantidade: 100 }] }],
  ])('%s: 400 e o service não é chamado', async (_nome, extra) => {
    const r = await request(app).post(ROTA).send(corpo(extra))
    expect(r.status).toBe(400)
    expect(r.body.erro.codigo).toBe('dados_invalidos')
    expect(freteFalso.cotar).not.toHaveBeenCalled()
  })

  it('mais de 50 produtos diferentes: 400', async () => {
    const itens = Array.from({ length: 51 }, (_, i) => ({
      sku: `produto-${i}`,
      quantidade: 1,
    }))
    expect((await request(app).post(ROTA).send(corpo({ itens }))).status).toBe(
      400,
    )
  })

  it('erro de negócio do service (produto sem peso, CEP inválido) vira a resposta com o código', async () => {
    freteFalso.cotar.mockRejectedValue(
      new ErroDeNegocio(
        'cep_invalido',
        'Não foi possível calcular o frete para este CEP.',
        422,
      ),
    )
    const r = await request(app).post(ROTA).send(corpo())
    expect(r.status).toBe(422)
    expect(r.body.erro.codigo).toBe('cep_invalido')
  })

  it('falha inesperada: 500 genérico, sem vazar nada', async () => {
    freteFalso.cotar.mockRejectedValue(
      new Error('Falha ao buscar a logística (42P01) com token Bearer abc'),
    )
    const r = await request(app).post(ROTA).send(corpo())
    expect(r.status).toBe(500)
    expect(JSON.stringify(r.body)).not.toMatch(/42P01|Bearer|logística/)
  })

  it('só aceita POST', async () => {
    expect((await request(app).get(ROTA)).status).toBe(404)
  })
})
