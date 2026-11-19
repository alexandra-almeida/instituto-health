import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// O limite está ligado às duas rotas públicas com os números aprovados (20 e 5
// a cada 10 minutos), e o 429 sai ANTES de qualquer trabalho (validação,
// produtos, Melhor Envio, banco de pedidos).
const limitesFalso = vi.hoisted(() => ({
  registrar: vi.fn(),
  limparVencidos: vi.fn(),
}))
vi.mock('../src/repositories/limites.repository.js', () => ({
  limitesRepository: limitesFalso,
}))
const produtosFalso = vi.hoisted(() => ({
  buscarParaPedido: vi.fn(),
  buscarPrecosPorSkus: vi.fn(),
}))
vi.mock('../src/repositories/produtos.repository.js', () => ({
  produtosRepository: produtosFalso,
}))
const pedidosFalso = vi.hoisted(() => ({
  criar: vi.fn(),
  buscarPorId: vi.fn(),
  listarDoPerfil: vi.fn(),
}))
vi.mock('../src/repositories/pedidos.repository.js', () => ({
  pedidosRepository: pedidosFalso,
}))

const { default: app } = await import('../src/app.js')

const corpoDaCotacao = {
  cep: '13500000',
  itens: [{ sku: 'niacine-7', quantidade: 1 }],
}
const corpoDoPedido = {
  itens: [{ sku: 'niacine-7', quantidade: 1 }],
  contato: { nome: 'Maria', email: 'm@e.com', telefone: '19999998888' },
  entrega: { tipo: 'retirada' },
  formaPagamento: 'pix',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('limite de tentativas nas rotas públicas', () => {
  it('cotação de frete: 20 por 10 minutos; estourou, 429 antes de tudo', async () => {
    limitesFalso.registrar.mockResolvedValue({
      excedeu: true,
      esperaSegundos: 123,
    })
    const r = await request(app)
      .post('/api/frete/cotacao')
      .set('X-Forwarded-For', '203.0.113.9')
      .send(corpoDaCotacao)
    expect(r.status).toBe(429)
    expect(r.body.erro.codigo).toBe('muitas_tentativas')
    expect(r.headers['retry-after']).toBe('123')
    expect(limitesFalso.registrar).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f]{40}$/),
      20,
      600,
    )
    expect(produtosFalso.buscarParaPedido).not.toHaveBeenCalled()
  })

  it('criar pedido: 5 por 10 minutos; estourou, 429 e nada é lido nem criado', async () => {
    limitesFalso.registrar.mockResolvedValue({
      excedeu: true,
      esperaSegundos: 45,
    })
    const r = await request(app)
      .post('/api/pedidos')
      .set('X-Forwarded-For', '203.0.113.9')
      .send(corpoDoPedido)
    expect(r.status).toBe(429)
    expect(r.headers['retry-after']).toBe('45')
    expect(limitesFalso.registrar).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f]{40}$/),
      5,
      600,
    )
    expect(produtosFalso.buscarParaPedido).not.toHaveBeenCalled()
    expect(pedidosFalso.criar).not.toHaveBeenCalled()
  })

  it('as duas rotas usam contadores diferentes para o mesmo IP', async () => {
    limitesFalso.registrar.mockResolvedValue({
      excedeu: true,
      esperaSegundos: 1,
    })
    await request(app)
      .post('/api/frete/cotacao')
      .set('X-Forwarded-For', '203.0.113.9')
      .send(corpoDaCotacao)
    await request(app)
      .post('/api/pedidos')
      .set('X-Forwarded-For', '203.0.113.9')
      .send(corpoDoPedido)
    const [chaveDaCotacao, chaveDoPedido] =
      limitesFalso.registrar.mock.calls.map((c) => c[0])
    expect(chaveDaCotacao).not.toBe(chaveDoPedido)
  })

  it('o limite não bloqueia a leitura de pedidos (só quem cria)', async () => {
    limitesFalso.registrar.mockResolvedValue({
      excedeu: true,
      esperaSegundos: 1,
    })
    const r = await request(app).get('/api/pedidos')
    expect(r.status).toBe(401)
    expect(limitesFalso.registrar).not.toHaveBeenCalled()
  })

  it('banco do limite fora do ar: a cotação segue (falha aberta) e chega à validação', async () => {
    limitesFalso.registrar.mockRejectedValue(new Error('fora do ar'))
    const r = await request(app)
      .post('/api/frete/cotacao')
      .send({ cep: 'x', itens: [] })
    expect(r.status).toBe(400)
  })
})
