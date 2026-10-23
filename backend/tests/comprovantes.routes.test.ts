import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'

// Os dois services são trocados: aqui só interessam sessão, validação, origem
// e formato das respostas. Nenhuma chamada chega ao Supabase.
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

const comprovantesServiceFalso = vi.hoisted(() => ({
  gerarUrlDeEnvio: vi.fn(),
  confirmar: vi.fn(),
  listar: vi.fn(),
}))
vi.mock('../src/modules/comprovantes/comprovantes.service.js', () => ({
  comprovantesService: comprovantesServiceFalso,
}))

const { default: app } = await import('../src/app.js')

const ID = '11111111-1111-4111-8111-111111111111'
const usuario = { id: ID, email: 'maria@exemplo.com' }
const perfil = { nome: 'Maria', tipo: 'profissional', status: 'pendente' }
const COOKIE = ['ih_acesso=tok-acesso']

beforeEach(() => {
  vi.resetAllMocks()
  authServiceFalso.autenticarSessao.mockResolvedValue({ usuario, perfil })
})

describe('sessão obrigatória', () => {
  it.each([
    ['GET', '/api/comprovantes'],
    ['POST', '/api/comprovantes/url-de-envio'],
    ['POST', '/api/comprovantes/confirmar'],
  ])('%s %s sem sessão: 401', async (metodo, caminho) => {
    authServiceFalso.autenticarSessao.mockRejectedValue(
      new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
    )

    const resposta = await request(app)
      [metodo === 'GET' ? 'get' : 'post'](caminho)
      .send(metodo === 'GET' ? undefined : { tipo: 'image/png', tamanho: 1 })

    expect(resposta.status).toBe(401)
    expect(comprovantesServiceFalso.gerarUrlDeEnvio).not.toHaveBeenCalled()
    expect(comprovantesServiceFalso.confirmar).not.toHaveBeenCalled()
    expect(comprovantesServiceFalso.listar).not.toHaveBeenCalled()
  })
})

describe('POST /api/comprovantes/url-de-envio', () => {
  it('usa o perfil da SESSÃO e ignora id e caminho enviados no corpo', async () => {
    comprovantesServiceFalso.gerarUrlDeEnvio.mockResolvedValue({
      caminho: `${ID}/x.pdf`,
      urlDeEnvio: 'https://exemplo.supabase.co/envio?token=t',
    })

    const resposta = await request(app)
      .post('/api/comprovantes/url-de-envio')
      .set('Cookie', COOKIE)
      .send({
        tipo: 'application/pdf',
        tamanho: 1234,
        perfil_id: '99999999-9999-4999-8999-999999999999',
        perfilId: '99999999-9999-4999-8999-999999999999',
        caminho: '../outra-pessoa/arquivo.pdf',
        nome: 'diploma.pdf',
      })

    expect(resposta.status).toBe(200)
    expect(comprovantesServiceFalso.gerarUrlDeEnvio).toHaveBeenCalledWith(
      { id: ID, tipo: 'profissional', status: 'pendente' },
      { tipo: 'application/pdf', tamanho: 1234 },
    )
    expect(resposta.body).toEqual({
      caminho: `${ID}/x.pdf`,
      urlDeEnvio: 'https://exemplo.supabase.co/envio?token=t',
    })
    expect(resposta.headers['cache-control']).toBe('no-store')
  })

  it.each([
    ['tipo fora da lista', { tipo: 'text/html', tamanho: 10 }],
    ['sem tipo', { tamanho: 10 }],
    ['tamanho zero', { tipo: 'image/png', tamanho: 0 }],
    ['tamanho negativo', { tipo: 'image/png', tamanho: -5 }],
    ['acima de 10 MB', { tipo: 'image/png', tamanho: 10 * 1024 * 1024 + 1 }],
    ['tamanho quebrado', { tipo: 'image/png', tamanho: 1.5 }],
    ['tamanho em texto', { tipo: 'image/png', tamanho: '10' }],
    ['sem tamanho', { tipo: 'image/png' }],
  ])('rejeita %s com 400', async (_nome, corpo) => {
    const resposta = await request(app)
      .post('/api/comprovantes/url-de-envio')
      .set('Cookie', COOKIE)
      .send(corpo)

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('dados_invalidos')
    expect(comprovantesServiceFalso.gerarUrlDeEnvio).not.toHaveBeenCalled()
  })

  it('aceita exatamente 10 MB', async () => {
    comprovantesServiceFalso.gerarUrlDeEnvio.mockResolvedValue({
      caminho: 'c',
      urlDeEnvio: 'u',
    })

    const resposta = await request(app)
      .post('/api/comprovantes/url-de-envio')
      .set('Cookie', COOKIE)
      .send({ tipo: 'image/heic', tamanho: 10 * 1024 * 1024 })

    expect(resposta.status).toBe(200)
  })

  it('repassa o erro do service (homecare, 403) no JSON padrão', async () => {
    comprovantesServiceFalso.gerarUrlDeEnvio.mockRejectedValue(
      new ErroDeNegocio(
        'comprovante_nao_se_aplica',
        'O comprovante é só para contas de profissionais.',
        403,
      ),
    )

    const resposta = await request(app)
      .post('/api/comprovantes/url-de-envio')
      .set('Cookie', COOKIE)
      .send({ tipo: 'image/png', tamanho: 10 })

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('comprovante_nao_se_aplica')
  })
})

describe('POST /api/comprovantes/confirmar', () => {
  const caminho = `${ID}/33333333-3333-4333-8333-333333333333.pdf`

  it('registro novo: 201 com o comprovante, e o perfil vem da sessão', async () => {
    comprovantesServiceFalso.confirmar.mockResolvedValue({
      comprovante: { id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' },
      criado: true,
    })

    const resposta = await request(app)
      .post('/api/comprovantes/confirmar')
      .set('Cookie', COOKIE)
      .send({ caminho, perfil_id: 'outro' })

    expect(resposta.status).toBe(201)
    expect(resposta.body).toEqual({
      comprovante: { id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' },
    })
    expect(comprovantesServiceFalso.confirmar).toHaveBeenCalledWith(
      { id: ID, tipo: 'profissional', status: 'pendente' },
      { caminho },
    )
  })

  it('já confirmado antes: 200', async () => {
    comprovantesServiceFalso.confirmar.mockResolvedValue({
      comprovante: { id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' },
      criado: false,
    })

    const resposta = await request(app)
      .post('/api/comprovantes/confirmar')
      .set('Cookie', COOKIE)
      .send({ caminho })

    expect(resposta.status).toBe(200)
  })

  it.each([
    ['sem caminho', {}],
    ['caminho vazio', { caminho: '' }],
    ['caminho que não é texto', { caminho: 123 }],
    ['caminho enorme', { caminho: 'a'.repeat(201) }],
  ])('rejeita %s com 400', async (_nome, corpo) => {
    const resposta = await request(app)
      .post('/api/comprovantes/confirmar')
      .set('Cookie', COOKIE)
      .send(corpo)

    expect(resposta.status).toBe(400)
    expect(comprovantesServiceFalso.confirmar).not.toHaveBeenCalled()
  })

  it('arquivo inválido vem do service como 400 no JSON padrão', async () => {
    comprovantesServiceFalso.confirmar.mockRejectedValue(
      new ErroDeNegocio('arquivo_invalido', 'O arquivo enviado não é válido.'),
    )

    const resposta = await request(app)
      .post('/api/comprovantes/confirmar')
      .set('Cookie', COOKIE)
      .send({ caminho })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('arquivo_invalido')
  })
})

describe('GET /api/comprovantes', () => {
  it('lista só os do usuário da sessão', async () => {
    comprovantesServiceFalso.listar.mockResolvedValue({
      comprovantes: [{ id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' }],
    })

    const resposta = await request(app)
      .get('/api/comprovantes?perfil_id=99999999-9999-4999-8999-999999999999')
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(200)
    expect(comprovantesServiceFalso.listar).toHaveBeenCalledWith(ID)
    expect(resposta.body.comprovantes).toHaveLength(1)
  })
})

describe('proteção de origem', () => {
  it('POST com Origin de outro site: 403, sem chamar o service', async () => {
    const resposta = await request(app)
      .post('/api/comprovantes/url-de-envio')
      .set('Cookie', COOKIE)
      .set('Origin', 'https://site-malicioso.example')
      .send({ tipo: 'image/png', tamanho: 10 })

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('origem_nao_permitida')
    expect(comprovantesServiceFalso.gerarUrlDeEnvio).not.toHaveBeenCalled()
  })
})
