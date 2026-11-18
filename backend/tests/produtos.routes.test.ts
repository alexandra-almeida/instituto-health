import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'

// Só o Supabase é trocado por simulados (sessão e dois repositórios): o
// middleware exigirProfissionalAprovado, a validação e o service rodam de
// verdade.
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

const produtosFalso = vi.hoisted(() => ({ buscarPrecosPorSkus: vi.fn() }))
vi.mock('../src/repositories/produtos.repository.js', () => ({
  produtosRepository: produtosFalso,
}))

const { default: app } = await import('../src/app.js')

const USUARIO = { id: '11111111-1111-4111-8111-111111111111', email: 'a@b.com' }
const COOKIE = ['ih_acesso=tok-acesso']
const ROTA = '/api/produtos/precos-profissionais'

function sessaoValida(
  tipoNaSessao = 'profissional',
  statusNaSessao = 'aprovado',
) {
  authServiceFalso.autenticarSessao.mockResolvedValue({
    usuario: USUARIO,
    perfil: {
      nome: 'Maria',
      tipo: tipoNaSessao,
      status: statusNaSessao,
      ehAdmin: false,
    },
  })
}

// O que o BANCO diz do perfil (é ele que decide)
function perfilNoBanco(tipo: string, status: string, is_admin = false) {
  perfisFalso.buscarPorId.mockResolvedValue({
    id: USUARIO.id,
    nome: 'Maria',
    tipo,
    status,
    is_admin,
  })
}

const chamar = (consulta = '?skus=niacine-7') =>
  request(app).get(`${ROTA}${consulta}`).set('Cookie', COOKIE)

beforeEach(() => {
  vi.resetAllMocks()
  produtosFalso.buscarPrecosPorSkus.mockResolvedValue([])
})

describe('GET /api/produtos/precos-profissionais: proteção', () => {
  it('sem sessão: 401 e nada é lido do catálogo', async () => {
    authServiceFalso.autenticarSessao.mockRejectedValue(
      new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
    )
    const r = await chamar()
    expect(r.status).toBe(401)
    expect(produtosFalso.buscarPrecosPorSkus).not.toHaveBeenCalled()
  })

  it.each([
    ['Home Care', 'homecare', 'aprovado'],
    ['profissional pendente', 'profissional', 'pendente'],
    ['profissional recusado', 'profissional', 'recusado'],
  ])('%s: 403 e nenhum preço é lido', async (_nome, tipo, status) => {
    sessaoValida()
    perfilNoBanco(tipo, status)
    const r = await chamar()
    expect(r.status).toBe(403)
    expect(r.body.erro.codigo).toBe('profissional_nao_aprovado')
    expect(produtosFalso.buscarPrecosPorSkus).not.toHaveBeenCalled()
  })

  it('quem decide é o BANCO: a sessão diz aprovado, o banco diz pendente: 403', async () => {
    sessaoValida('profissional', 'aprovado')
    perfilNoBanco('profissional', 'pendente')
    const r = await chamar()
    expect(r.status).toBe(403)
    expect(produtosFalso.buscarPrecosPorSkus).not.toHaveBeenCalled()
  })

  it('perfil que não existe mais no banco: 403', async () => {
    sessaoValida()
    perfisFalso.buscarPorId.mockResolvedValue(null)
    expect((await chamar()).status).toBe(403)
  })

  it('admin que NÃO é profissional aprovado também não passa', async () => {
    sessaoValida('homecare', 'aprovado')
    perfilNoBanco('homecare', 'aprovado', true)
    expect((await chamar()).status).toBe(403)
  })

  it('a resposta é privada e nunca vai para cache', async () => {
    sessaoValida()
    perfilNoBanco('profissional', 'aprovado')
    const ok = await chamar()
    expect(ok.headers['cache-control']).toBe('private, no-store')

    perfilNoBanco('homecare', 'aprovado')
    const negado = await chamar()
    expect(negado.headers['cache-control']).toBe('private, no-store')
  })
})

describe('GET /api/produtos/precos-profissionais: validação', () => {
  beforeEach(() => {
    sessaoValida()
    perfilNoBanco('profissional', 'aprovado')
  })

  it.each([
    ['sem skus', ''],
    ['skus vazio', '?skus='],
    ['só vírgulas', '?skus=,,'],
    ['sku fora do padrão', '?skus=Niacine_7'],
    ['sku com caractere perigoso', "?skus=a-1,'%20or%201=1--"],
  ])('%s: 400 e nada é lido', async (_nome, consulta) => {
    const r = await chamar(consulta)
    expect(r.status).toBe(400)
    expect(r.body.erro.codigo).toBe('dados_invalidos')
    expect(produtosFalso.buscarPrecosPorSkus).not.toHaveBeenCalled()
  })

  it('mais de 100 produtos: 400', async () => {
    const muitos = Array.from({ length: 101 }, (_, i) => `produto-${i}`).join(
      ',',
    )
    const r = await chamar(`?skus=${muitos}`)
    expect(r.status).toBe(400)
    expect(r.body.erro.mensagem).toMatch(/No máximo 100/)
  })

  it('100 produtos é aceito e repetidos são juntados', async () => {
    const cem = Array.from({ length: 100 }, (_, i) => `produto-${i}`)
    await chamar(`?skus=${[...cem, ...cem].join(',')}`)
    expect(produtosFalso.buscarPrecosPorSkus).toHaveBeenCalledWith(cem)
  })
})

describe('GET /api/produtos/precos-profissionais: preços', () => {
  beforeEach(() => {
    sessaoValida()
    perfilNoBanco('profissional', 'aprovado')
  })

  it('devolve o preço cheio e o preço com 30% (Niacine+ 149,00 e Resilience 139,00)', async () => {
    produtosFalso.buscarPrecosPorSkus.mockResolvedValue([
      { sku: 'niacine-7', preco: '149.00', preco_cheio: null, ativo: true },
      { sku: 'resilience-19', preco: 139, preco_cheio: null, ativo: true },
    ])
    const r = await chamar('?skus=niacine-7,resilience-19')
    expect(r.status).toBe(200)
    expect(r.body).toEqual({
      itens: [
        { sku: 'niacine-7', precoCheio: 149, precoComDesconto: 104.3 },
        { sku: 'resilience-19', precoCheio: 139, precoComDesconto: 97.3 },
      ],
      semPreco: [],
    })
  })

  it('exclusivo usa o preço cheio confidencial', async () => {
    produtosFalso.buscarPrecosPorSkus.mockResolvedValue([
      { sku: 'exclusivo-9', preco: null, preco_cheio: '200.00', ativo: true },
    ])
    const r = await chamar('?skus=exclusivo-9')
    expect(r.body.itens).toEqual([
      { sku: 'exclusivo-9', precoCheio: 200, precoComDesconto: 140 },
    ])
  })

  it('descartável (desc-) volta SEM desconto', async () => {
    produtosFalso.buscarPrecosPorSkus.mockResolvedValue([
      {
        sku: 'desc-cloro-gel-5-l-32',
        preco: '36.79',
        preco_cheio: null,
        ativo: true,
      },
    ])
    const r = await chamar('?skus=desc-cloro-gel-5-l-32')
    expect(r.body.itens).toEqual([
      {
        sku: 'desc-cloro-gel-5-l-32',
        precoCheio: 36.79,
        precoComDesconto: 36.79,
      },
    ])
  })

  it('sku desconhecido, produto inativo e produto sem preço vão para semPreco (nunca outro valor)', async () => {
    produtosFalso.buscarPrecosPorSkus.mockResolvedValue([
      { sku: 'inativo-1', preco: '10.00', preco_cheio: null, ativo: false },
      { sku: 'sem-preco-2', preco: null, preco_cheio: null, ativo: true },
      { sku: 'bom-3', preco: '10.00', preco_cheio: null, ativo: true },
    ])
    const r = await chamar('?skus=inativo-1,sem-preco-2,desconhecido-4,bom-3')
    expect(r.body.itens).toEqual([
      { sku: 'bom-3', precoCheio: 10, precoComDesconto: 7 },
    ])
    expect(r.body.semPreco).toEqual([
      'inativo-1',
      'sem-preco-2',
      'desconhecido-4',
    ])
  })

  it('mantém a ordem pedida e consulta só os skus pedidos', async () => {
    produtosFalso.buscarPrecosPorSkus.mockResolvedValue([
      { sku: 'b-2', preco: '20.00', preco_cheio: null, ativo: true },
      { sku: 'a-1', preco: '10.00', preco_cheio: null, ativo: true },
    ])
    const r = await chamar('?skus=a-1,b-2')
    expect(r.body.itens.map((i: { sku: string }) => i.sku)).toEqual([
      'a-1',
      'b-2',
    ])
    expect(produtosFalso.buscarPrecosPorSkus).toHaveBeenCalledWith([
      'a-1',
      'b-2',
    ])
  })

  it('o navegador não influencia o preço: parâmetros de preço e desconto são ignorados', async () => {
    produtosFalso.buscarPrecosPorSkus.mockResolvedValue([
      { sku: 'a-1', preco: '100.00', preco_cheio: null, ativo: true },
    ])
    const r = await chamar('?skus=a-1&preco=1&desconto=99&precoCheio=1')
    expect(r.body.itens).toEqual([
      { sku: 'a-1', precoCheio: 100, precoComDesconto: 70 },
    ])
  })
})
