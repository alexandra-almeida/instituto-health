import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Troca o service inteiro: aqui só interessam validação, formato dos erros e
// cookies. Nenhuma chamada chega ao Supabase.
const authServiceFalso = vi.hoisted(() => ({
  cadastrar: vi.fn(),
  confirmarEmail: vi.fn(),
  reenviarCodigo: vi.fn(),
}))
vi.mock('../src/modules/auth/auth.service.js', () => ({
  authService: authServiceFalso,
}))

const { default: app } = await import('../src/app.js')

beforeEach(() => {
  vi.resetAllMocks()
})

describe('POST /api/auth/cadastro', () => {
  const corpo = {
    perfil: 'profissional',
    nome: '  Maria  ',
    email: '  Maria@Exemplo.COM ',
    senha: 'senha-forte-1',
  }

  it('normaliza os dados e responde 201', async () => {
    authServiceFalso.cadastrar.mockResolvedValue({ mensagem: 'ok' })

    const resposta = await request(app).post('/api/auth/cadastro').send(corpo)

    expect(resposta.status).toBe(201)
    expect(authServiceFalso.cadastrar).toHaveBeenCalledWith({
      perfil: 'profissional',
      nome: 'Maria',
      email: 'maria@exemplo.com',
      senha: 'senha-forte-1',
    })
  })

  it('descarta status, tipo e is_admin enviados no corpo', async () => {
    authServiceFalso.cadastrar.mockResolvedValue({ mensagem: 'ok' })

    await request(app)
      .post('/api/auth/cadastro')
      .send({ ...corpo, status: 'aprovado', tipo: 'homecare', is_admin: true })

    const recebido = authServiceFalso.cadastrar.mock.calls[0]?.[0]
    expect(recebido).not.toHaveProperty('status')
    expect(recebido).not.toHaveProperty('tipo')
    expect(recebido).not.toHaveProperty('is_admin')
  })

  it.each([
    ['senha curta', { senha: '1234567' }, 'A senha deve ter pelo menos 8'],
    ['e-mail inválido', { email: 'sem-arroba' }, 'E-mail inválido.'],
    ['nome vazio', { nome: '   ' }, 'Informe o nome.'],
    ['perfil inválido', { perfil: 'admin' }, 'Escolha o tipo de perfil.'],
  ])('rejeita %s com 400 em português', async (_nome, troca, mensagem) => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...corpo, ...troca })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('dados_invalidos')
    expect(resposta.body.erro.mensagem).toContain(mensagem)
    expect(authServiceFalso.cadastrar).not.toHaveBeenCalled()
  })

  it('rejeita corpo vazio', async () => {
    const resposta = await request(app).post('/api/auth/cadastro')

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('dados_invalidos')
  })
})

describe('POST /api/auth/confirmar-email', () => {
  it('grava a sessão em cookies httpOnly, Secure e SameSite=Lax', async () => {
    authServiceFalso.confirmarEmail.mockResolvedValue({
      sessao: {
        accessToken: 'token-de-acesso',
        refreshToken: 'token-de-renovacao',
        expiresIn: 3600,
      },
      usuario: { id: 'u-1', email: 'maria@exemplo.com' },
      perfil: { nome: 'Maria', tipo: 'homecare', status: 'aprovado' },
    })

    const resposta = await request(app)
      .post('/api/auth/confirmar-email')
      .send({ email: 'maria@exemplo.com', codigo: '123456' })

    expect(resposta.status).toBe(200)
    const cookies = resposta.headers['set-cookie'] as unknown as string[]
    expect(cookies).toHaveLength(2)
    for (const cookie of cookies) {
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Secure')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain('Path=/')
    }
    // Os tokens ficam só nos cookies, nunca no corpo
    expect(JSON.stringify(resposta.body)).not.toContain('token-de')
    expect(resposta.body.perfil.status).toBe('aprovado')
  })

  it.each(['12345', '1234567', 'abcdef', '12 456'])(
    'rejeita o código "%s" sem chamar o service',
    async (codigo) => {
      const resposta = await request(app)
        .post('/api/auth/confirmar-email')
        .send({ email: 'maria@exemplo.com', codigo })

      expect(resposta.status).toBe(400)
      expect(authServiceFalso.confirmarEmail).not.toHaveBeenCalled()
    },
  )

  it('não grava cookie quando o código é recusado', async () => {
    const { ErroDeNegocio } = await import('../src/lib/erros.js')
    authServiceFalso.confirmarEmail.mockRejectedValue(
      new ErroDeNegocio('codigo_invalido', 'Código inválido ou vencido.'),
    )

    const resposta = await request(app)
      .post('/api/auth/confirmar-email')
      .send({ email: 'maria@exemplo.com', codigo: '000000' })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('codigo_invalido')
    expect(resposta.headers['set-cookie']).toBeUndefined()
  })
})

describe('POST /api/auth/reenviar-codigo', () => {
  it('valida o e-mail e responde 200', async () => {
    authServiceFalso.reenviarCodigo.mockResolvedValue({ mensagem: 'ok' })

    const resposta = await request(app)
      .post('/api/auth/reenviar-codigo')
      .send({ email: 'Maria@Exemplo.com' })

    expect(resposta.status).toBe(200)
    expect(authServiceFalso.reenviarCodigo).toHaveBeenCalledWith({
      email: 'maria@exemplo.com',
    })
  })

  it('rejeita e-mail inválido', async () => {
    const resposta = await request(app)
      .post('/api/auth/reenviar-codigo')
      .send({ email: 'x' })

    expect(resposta.status).toBe(400)
  })
})
