import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'

// Só o Supabase é trocado por simulados (sessão e três repositórios): a
// validação, o middleware de sessão opcional, a precificação e o service rodam
// de verdade.
const authServiceFalso = vi.hoisted(() => ({
  cadastrar: vi.fn(),
  confirmarEmail: vi.fn(),
  reenviarCodigo: vi.fn(),
  entrar: vi.fn(),
  sair: vi.fn(),
  autenticarSessao: vi.fn(),
  esqueciSenha: vi.fn(),
  redefinirSenha: vi.fn(),
}))
vi.mock('../src/modules/auth/auth.service.js', () => ({
  authService: authServiceFalso,
}))

const perfisFalso = vi.hoisted(() => ({
  criar: vi.fn(),
  buscarPorId: vi.fn(),
  buscarContato: vi.fn(),
  listar: vi.fn(),
  contarPorStatus: vi.fn(),
  avaliar: vi.fn(),
  reabrir: vi.fn(),
}))
vi.mock('../src/repositories/perfis.repository.js', () => ({
  perfisRepository: perfisFalso,
}))

const produtosFalso = vi.hoisted(() => ({
  buscarPrecosPorSkus: vi.fn(),
  buscarParaPedido: vi.fn(),
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

const USUARIO = { id: '11111111-1111-4111-8111-111111111111', email: 'a@b.com' }
const OUTRO = '22222222-2222-4222-8222-222222222222'
const PEDIDO_ID = '33333333-3333-4333-8333-333333333333'
const COOKIE = ['ih_acesso=tok-acesso']

const base = { tamanho: '50ml', ativo: true, exclusivo_profissional: false }
const NIACINE = {
  ...base,
  sku: 'niacine-7',
  nome: 'Niacine+ Sérum',
  preco: '149.00',
  preco_cheio: null,
}
const RESILIENCE = {
  ...base,
  sku: 'resilience-19',
  nome: 'Resilience Sérum',
  preco: '139.00',
  preco_cheio: null,
}
const EXCLUSIVO = {
  ...base,
  sku: 'exclusivo-9',
  nome: 'Máscara Exclusiva',
  preco: null,
  preco_cheio: '200.00',
  exclusivo_profissional: true,
}
const DESCARTAVEL = {
  ...base,
  sku: 'desc-cloro-gel-5-l-32',
  nome: 'Cloro Gel 5 L',
  preco: '36.79',
  preco_cheio: null,
}
const CATALOGO = [NIACINE, RESILIENCE, EXCLUSIVO, DESCARTAVEL]

const CONTATO = {
  nome: 'Maria Souza',
  email: 'Maria@Exemplo.com',
  telefone: '(19) 99999-8888',
}
const ENDERECO = {
  cep: '13500-000',
  rua: 'Rua A',
  numero: '10',
  complemento: '',
  bairro: 'Centro',
  cidade: 'Rio Claro',
  estado: 'sp',
}

function corpo(extra: Record<string, unknown> = {}) {
  return {
    itens: [{ sku: 'niacine-7', quantidade: 1 }],
    contato: CONTATO,
    entrega: { tipo: 'retirada' },
    formaPagamento: 'pix',
    ...extra,
  }
}

const enviar = (c: unknown, comSessao = false) => {
  const r = request(app).post('/api/pedidos')
  if (comSessao) r.set('Cookie', COOKIE)
  return r.send(c as object)
}

// visitante: a sessão não vale (401 do serviço) e o middleware opcional segue
function comoVisitante() {
  authServiceFalso.autenticarSessao.mockRejectedValue(
    new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
  )
}
function comSessao() {
  authServiceFalso.autenticarSessao.mockResolvedValue({
    usuario: USUARIO,
    // o que a sessão diz NÃO decide nada
    perfil: {
      nome: 'Maria',
      tipo: 'profissional',
      status: 'aprovado',
      ehAdmin: true,
    },
  })
}
function perfilNoBanco(tipo: string, status: string, is_admin = false) {
  perfisFalso.buscarPorId.mockResolvedValue({
    id: USUARIO.id,
    nome: 'Maria',
    tipo,
    status,
    is_admin,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  comoVisitante()
  produtosFalso.buscarParaPedido.mockResolvedValue(CATALOGO)
  pedidosFalso.criar.mockResolvedValue({ id: PEDIDO_ID, numero: 1001 })
})

describe('POST /api/pedidos: visitante (compra sem cadastro)', () => {
  it('cria pedido de retirada com o preço público, frete zero e total do servidor', async () => {
    const r = await enviar(
      corpo({
        itens: [
          { sku: 'niacine-7', quantidade: 2 },
          { sku: 'resilience-19', quantidade: 1 },
        ],
      }),
    )
    expect(r.status).toBe(201)
    expect(r.headers['cache-control']).toBe('no-store')
    expect(r.body.pedido).toMatchObject({
      id: PEDIDO_ID,
      numero: 1001,
      status: 'aguardando_pagamento',
      subtotal: 437,
      frete: 0,
      total: 437,
      entrega: { tipo: 'retirada', servico: 'Retirada na clínica' },
    })
    const [pedido, itens] = pedidosFalso.criar.mock.calls[0]!
    expect(pedido).toMatchObject({
      perfil_id: null,
      email: 'maria@exemplo.com',
      tabela_de_precos: 'publico',
      forma_pagamento: 'pix',
      subtotal: '437.00',
      frete: '0.00',
      total: '437.00',
      frete_servico: 'Retirada na clínica',
      frete_servico_id: null,
      entrega_tipo: 'retirada',
      entrega_nome: 'Maria Souza',
      entrega_telefone: '19999998888',
      entrega_cep: null,
      entrega_rua: null,
    })
    expect(itens).toEqual([
      {
        sku: 'niacine-7',
        nome: 'Niacine+ Sérum',
        variacao: null,
        quantidade: 2,
        preco_unitario: '149.00',
      },
      {
        sku: 'resilience-19',
        nome: 'Resilience Sérum',
        variacao: null,
        quantidade: 1,
        preco_unitario: '139.00',
      },
    ])
  })

  it('exclusivo de profissional é recusado para visitante (nada é criado)', async () => {
    const r = await enviar(
      corpo({ itens: [{ sku: 'exclusivo-9', quantidade: 1 }] }),
    )
    expect(r.status).toBe(422)
    expect(r.body.erro.codigo).toBe('produto_exclusivo')
    expect(pedidosFalso.criar).not.toHaveBeenCalled()
  })

  it('o navegador não influencia nenhum valor: preço, desconto, frete e total enviados são ignorados', async () => {
    const r = await enviar(
      corpo({
        precoUnitario: 1,
        desconto: 99,
        frete: 0,
        total: 1,
        subtotal: 1,
        tabelaDePrecos: 'profissional',
        itens: [
          { sku: 'niacine-7', quantidade: 1, preco: 1, precoUnitario: 1 },
        ],
      }),
    )
    expect(r.status).toBe(201)
    expect(r.body.pedido.total).toBe(149)
    expect(pedidosFalso.criar.mock.calls[0]![0]).toMatchObject({
      tabela_de_precos: 'publico',
      total: '149.00',
    })
  })

  it('junta o mesmo produto repetido numa linha só', async () => {
    const r = await enviar(
      corpo({
        itens: [
          { sku: 'niacine-7', quantidade: 2 },
          { sku: 'niacine-7', quantidade: 3 },
        ],
      }),
    )
    expect(r.status).toBe(201)
    expect(pedidosFalso.criar.mock.calls[0]![1]).toHaveLength(1)
    expect(pedidosFalso.criar.mock.calls[0]![1][0]).toMatchObject({
      quantidade: 5,
    })
  })
})

describe('POST /api/pedidos: com conta', () => {
  it('profissional aprovado (confirmado no BANCO): 30% sobre o cheio, exclusivo liberado, pedido ligado à conta', async () => {
    comSessao()
    perfilNoBanco('profissional', 'aprovado')
    const r = await enviar(
      corpo({
        itens: [
          { sku: 'niacine-7', quantidade: 1 },
          { sku: 'resilience-19', quantidade: 1 },
          { sku: 'exclusivo-9', quantidade: 1 },
          { sku: 'desc-cloro-gel-5-l-32', quantidade: 1 },
        ],
      }),
      true,
    )
    expect(r.status).toBe(201)
    // 104,30 + 97,30 + 140,00 + 36,79 (descartável sem desconto)
    expect(r.body.pedido.subtotal).toBe(378.39)
    expect(r.body.pedido.frete).toBe(0)
    expect(r.body.pedido.total).toBe(378.39)
    expect(pedidosFalso.criar.mock.calls[0]![0]).toMatchObject({
      perfil_id: USUARIO.id,
      tabela_de_precos: 'profissional',
      subtotal: '378.39',
    })
  })

  it.each([
    ['Home Care', 'homecare', 'aprovado'],
    ['profissional pendente', 'profissional', 'pendente'],
    ['profissional recusado', 'profissional', 'recusado'],
  ])(
    '%s paga o preço público e não compra exclusivo',
    async (_nome, tipo, status) => {
      comSessao()
      perfilNoBanco(tipo, status)
      const ok = await enviar(corpo(), true)
      expect(ok.status).toBe(201)
      expect(ok.body.pedido.total).toBe(149)
      expect(pedidosFalso.criar.mock.calls[0]![0]).toMatchObject({
        perfil_id: USUARIO.id,
        tabela_de_precos: 'publico',
      })
      pedidosFalso.criar.mockClear()
      const exclusivo = await enviar(
        corpo({ itens: [{ sku: 'exclusivo-9', quantidade: 1 }] }),
        true,
      )
      expect(exclusivo.status).toBe(422)
      expect(pedidosFalso.criar).not.toHaveBeenCalled()
    },
  )

  it('a sessão diz profissional aprovado, mas o banco diz pendente: vale o banco (preço público)', async () => {
    comSessao()
    perfilNoBanco('profissional', 'pendente')
    const r = await enviar(corpo(), true)
    expect(r.body.pedido.total).toBe(149)
  })

  it('sessão vencida cai para visitante, sem erro', async () => {
    const r = await enviar(corpo(), true)
    expect(r.status).toBe(201)
    expect(pedidosFalso.criar.mock.calls[0]![0].perfil_id).toBeNull()
  })
})

describe('POST /api/pedidos: entrega', () => {
  it('envio ainda não existe (módulo de frete): 503 e nada é criado', async () => {
    const r = await enviar(
      corpo({ entrega: { tipo: 'envio', servicoId: 1, endereco: ENDERECO } }),
    )
    expect(r.status).toBe(503)
    expect(r.body.erro.codigo).toBe('frete_indisponivel')
    expect(pedidosFalso.criar).not.toHaveBeenCalled()
  })

  it('envio exige o endereço completo', async () => {
    const r = await enviar(corpo({ entrega: { tipo: 'envio', servicoId: 1 } }))
    expect(r.status).toBe(400)
  })

  it('entrega desconhecida: 400', async () => {
    expect((await enviar(corpo({ entrega: { tipo: 'moto' } }))).status).toBe(
      400,
    )
    expect((await enviar(corpo({ entrega: undefined }))).status).toBe(400)
  })
})

describe('POST /api/pedidos: validação e produtos', () => {
  it.each([
    ['carrinho vazio', { itens: [] }],
    ['sku inválido', { itens: [{ sku: 'Niacine 7', quantidade: 1 }] }],
    ['quantidade zero', { itens: [{ sku: 'niacine-7', quantidade: 0 }] }],
    ['quantidade 100', { itens: [{ sku: 'niacine-7', quantidade: 100 }] }],
    ['quantidade decimal', { itens: [{ sku: 'niacine-7', quantidade: 1.5 }] }],
    ['e-mail inválido', { contato: { ...CONTATO, email: 'sem-arroba' } }],
    ['telefone curto', { contato: { ...CONTATO, telefone: '123' } }],
    ['nome vazio', { contato: { ...CONTATO, nome: '  ' } }],
    ['pagamento desconhecido', { formaPagamento: 'boleto' }],
    ['sem pagamento', { formaPagamento: undefined }],
  ])('%s: 400 e nada é lido nem criado', async (_nome, extra) => {
    const r = await enviar(corpo(extra))
    expect(r.status).toBe(400)
    expect(r.body.erro.codigo).toBe('dados_invalidos')
    expect(produtosFalso.buscarParaPedido).not.toHaveBeenCalled()
    expect(pedidosFalso.criar).not.toHaveBeenCalled()
  })

  it('mais de 50 produtos diferentes: 400', async () => {
    const itens = Array.from({ length: 51 }, (_, i) => ({
      sku: `produto-${i}`,
      quantidade: 1,
    }))
    expect((await enviar(corpo({ itens }))).status).toBe(400)
  })

  it('produto desconhecido, inativo ou sem preço: 422 e nada é criado', async () => {
    produtosFalso.buscarParaPedido.mockResolvedValue([
      ...CATALOGO,
      { ...NIACINE, sku: 'inativo-1', nome: 'Inativo', ativo: false },
      {
        ...EXCLUSIVO,
        sku: 'sem-preco-2',
        nome: 'Sem Preço',
        preco_cheio: null,
      },
    ])
    for (const sku of ['nao-existe-1', 'inativo-1']) {
      const r = await enviar(corpo({ itens: [{ sku, quantidade: 1 }] }))
      expect(r.status).toBe(422)
      expect(r.body.erro.codigo).toBe('produto_indisponivel')
    }
    comSessao()
    perfilNoBanco('profissional', 'aprovado')
    const semPreco = await enviar(
      corpo({ itens: [{ sku: 'sem-preco-2', quantidade: 1 }] }),
      true,
    )
    expect(semPreco.body.erro.codigo).toBe('produto_sem_preco')
    expect(pedidosFalso.criar).not.toHaveBeenCalled()
  })

  it('falha do banco ao criar: 500 genérico, sem vazar detalhes', async () => {
    pedidosFalso.criar.mockRejectedValue(
      new Error('Falha ao criar o pedido (23514)'),
    )
    const r = await enviar(corpo())
    expect(r.status).toBe(500)
    expect(JSON.stringify(r.body)).not.toMatch(/23514|Falha ao criar/)
  })
})

describe('GET /api/pedidos e /api/pedidos/:id', () => {
  const PEDIDO = {
    id: PEDIDO_ID,
    numero: 1001,
    perfil_id: USUARIO.id,
    status: 'aguardando_pagamento',
    forma_pagamento: 'pix',
    tabela_de_precos: 'publico',
    subtotal: '149.00',
    frete: '0.00',
    total: '149.00',
    frete_servico: 'Retirada na clínica',
    codigo_rastreio: null,
    entrega_tipo: 'retirada',
    created_at: '2026-11-18T12:00:00Z',
    itens_pedido: [
      {
        sku: 'niacine-7',
        nome: 'Niacine+ Sérum',
        variacao: null,
        quantidade: 1,
        preco_unitario: '149.00',
      },
    ],
  }

  it('sem sessão: 401', async () => {
    expect((await request(app).get('/api/pedidos')).status).toBe(401)
    expect((await request(app).get(`/api/pedidos/${PEDIDO_ID}`)).status).toBe(
      401,
    )
    expect(pedidosFalso.buscarPorId).not.toHaveBeenCalled()
  })

  it('o dono vê o pedido com os itens e os valores em reais', async () => {
    comSessao()
    pedidosFalso.buscarPorId.mockResolvedValue(PEDIDO)
    const r = await request(app)
      .get(`/api/pedidos/${PEDIDO_ID}`)
      .set('Cookie', COOKIE)
    expect(r.status).toBe(200)
    expect(r.headers['cache-control']).toBe('no-store')
    expect(r.body.pedido).toMatchObject({ numero: 1001, total: 149, frete: 0 })
    expect(r.body.pedido.itens).toEqual([
      {
        sku: 'niacine-7',
        nome: 'Niacine+ Sérum',
        variacao: null,
        quantidade: 1,
        precoUnitario: 149,
      },
    ])
    expect(perfisFalso.buscarPorId).not.toHaveBeenCalled()
  })

  it('outra pessoa e pedido de visitante: 404 igual ao de pedido inexistente', async () => {
    comSessao()
    perfilNoBanco('homecare', 'aprovado', false)
    pedidosFalso.buscarPorId.mockResolvedValue({ ...PEDIDO, perfil_id: OUTRO })
    const alheio = await request(app)
      .get(`/api/pedidos/${PEDIDO_ID}`)
      .set('Cookie', COOKIE)
    pedidosFalso.buscarPorId.mockResolvedValue({ ...PEDIDO, perfil_id: null })
    const visitante = await request(app)
      .get(`/api/pedidos/${PEDIDO_ID}`)
      .set('Cookie', COOKIE)
    pedidosFalso.buscarPorId.mockResolvedValue(null)
    const inexistente = await request(app)
      .get(`/api/pedidos/${PEDIDO_ID}`)
      .set('Cookie', COOKIE)
    for (const r of [alheio, visitante, inexistente]) {
      expect(r.status).toBe(404)
      expect(r.body.erro.codigo).toBe('pedido_nao_encontrado')
    }
  })

  it('admin (conferido no banco) vê pedido de outra pessoa', async () => {
    comSessao()
    perfilNoBanco('profissional', 'aprovado', true)
    pedidosFalso.buscarPorId.mockResolvedValue({ ...PEDIDO, perfil_id: OUTRO })
    const r = await request(app)
      .get(`/api/pedidos/${PEDIDO_ID}`)
      .set('Cookie', COOKIE)
    expect(r.status).toBe(200)
  })

  it('id que não é uuid: 400', async () => {
    comSessao()
    expect(
      (await request(app).get('/api/pedidos/abc').set('Cookie', COOKIE)).status,
    ).toBe(400)
  })

  it('lista só os pedidos da própria conta', async () => {
    comSessao()
    const resumo = { ...PEDIDO, itens_pedido: undefined }
    pedidosFalso.listarDoPerfil.mockResolvedValue([resumo])
    const r = await request(app).get('/api/pedidos').set('Cookie', COOKIE)
    expect(r.status).toBe(200)
    expect(pedidosFalso.listarDoPerfil).toHaveBeenCalledWith(USUARIO.id)
    expect(r.body.pedidos).toHaveLength(1)
    expect(r.body.pedidos[0]).toMatchObject({ numero: 1001, total: 149 })
    expect(r.body.pedidos[0].itens).toBeUndefined()
  })
})
