import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'

// Troca o service inteiro: aqui só interessam validação, cookies e formato das
// respostas. Nenhuma chamada chega ao Supabase.
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

const { default: app } = await import('../src/app.js')

const usuario = { id: 'u-1', email: 'maria@exemplo.com' }
const perfil = { nome: 'Maria', tipo: 'homecare', status: 'aprovado' }
const sessao = {
  accessToken: 'tok-acesso',
  refreshToken: 'tok-renov',
  expiresIn: 3600,
}

function cookiesDa(resposta: request.Response): string[] {
  return (
    (resposta.headers['set-cookie'] as unknown as string[] | undefined) ?? []
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('POST /api/auth/login', () => {
  const corpo = { email: '  Maria@Exemplo.COM ', senha: 'senha-forte-1' }

  it('abre a sessão em cookies httpOnly e não devolve tokens no corpo', async () => {
    authServiceFalso.entrar.mockResolvedValue({ sessao, usuario, perfil })

    const resposta = await request(app).post('/api/auth/login').send(corpo)

    expect(resposta.status).toBe(200)
    expect(authServiceFalso.entrar).toHaveBeenCalledWith({
      email: 'maria@exemplo.com',
      senha: 'senha-forte-1',
    })
    expect(resposta.body).toEqual({ usuario, perfil })
    expect(JSON.stringify(resposta.body)).not.toContain('tok-')
    const cookies = cookiesDa(resposta)
    expect(cookies).toHaveLength(2)
    for (const cookie of cookies) {
      expect(cookie).toMatch(/HttpOnly/i)
      expect(cookie).toMatch(/Secure/i)
      expect(cookie).toMatch(/SameSite=Lax/i)
    }
  })

  it('senha em branco: 400, sem chamar o service', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@exemplo.com', senha: '' })

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('dados_invalidos')
    expect(authServiceFalso.entrar).not.toHaveBeenCalled()
  })

  it('repassa o erro de credenciais do service', async () => {
    authServiceFalso.entrar.mockRejectedValue(
      new ErroDeNegocio(
        'credenciais_invalidas',
        'E-mail ou senha incorretos.',
        401,
      ),
    )

    const resposta = await request(app).post('/api/auth/login').send(corpo)

    expect(resposta.status).toBe(401)
    expect(resposta.body).toEqual({
      erro: {
        codigo: 'credenciais_invalidas',
        mensagem: 'E-mail ou senha incorretos.',
      },
    })
    expect(cookiesDa(resposta)).toHaveLength(0)
  })
})

describe('POST /api/auth/logout', () => {
  it('encerra a sessão do cookie e limpa os dois cookies', async () => {
    authServiceFalso.sair.mockResolvedValue(undefined)

    const resposta = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['ih_acesso=tok-acesso', 'ih_renovacao=tok-renov'])

    expect(resposta.status).toBe(204)
    expect(authServiceFalso.sair).toHaveBeenCalledWith('tok-acesso')
    const cookies = cookiesDa(resposta)
    expect(cookies.some((c) => c.startsWith('ih_acesso=;'))).toBe(true)
    expect(cookies.some((c) => c.startsWith('ih_renovacao=;'))).toBe(true)
  })

  it('sem sessão também responde 204 e limpa os cookies', async () => {
    authServiceFalso.sair.mockResolvedValue(undefined)

    const resposta = await request(app).post('/api/auth/logout')

    expect(resposta.status).toBe(204)
    expect(authServiceFalso.sair).toHaveBeenCalledWith(undefined)
    expect(cookiesDa(resposta)).toHaveLength(2)
  })
})

describe('GET /api/auth/eu', () => {
  it('sessão válida: devolve usuário e perfil, sem is_admin', async () => {
    authServiceFalso.autenticarSessao.mockResolvedValue({ usuario, perfil })

    const resposta = await request(app)
      .get('/api/auth/eu')
      .set('Cookie', ['ih_acesso=tok-acesso'])

    expect(resposta.status).toBe(200)
    expect(authServiceFalso.autenticarSessao).toHaveBeenCalledWith({
      accessToken: 'tok-acesso',
      refreshToken: undefined,
    })
    expect(resposta.body).toEqual({ usuario, perfil })
    expect(JSON.stringify(resposta.body)).not.toContain('is_admin')
    expect(cookiesDa(resposta)).toHaveLength(0)
  })

  it('sessão renovada: regrava os cookies', async () => {
    authServiceFalso.autenticarSessao.mockResolvedValue({
      usuario,
      perfil,
      sessaoRenovada: sessao,
    })

    const resposta = await request(app)
      .get('/api/auth/eu')
      .set('Cookie', ['ih_renovacao=antigo'])

    expect(resposta.status).toBe(200)
    expect(cookiesDa(resposta)).toHaveLength(2)
    expect(JSON.stringify(resposta.body)).not.toContain('tok-')
  })

  it('sem sessão: 401 no JSON padrão e cookies limpos', async () => {
    authServiceFalso.autenticarSessao.mockRejectedValue(
      new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
    )

    const resposta = await request(app).get('/api/auth/eu')

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro.codigo).toBe('nao_autenticado')
    expect(cookiesDa(resposta)).toHaveLength(2)
  })

  it('ignora cookie malformado em vez de quebrar', async () => {
    authServiceFalso.autenticarSessao.mockResolvedValue({ usuario, perfil })

    const resposta = await request(app)
      .get('/api/auth/eu')
      .set('Cookie', ['ih_acesso=%E0%A4%A; outro=1'])

    expect(resposta.status).toBe(200)
    expect(authServiceFalso.autenticarSessao).toHaveBeenCalledWith({
      accessToken: undefined,
      refreshToken: undefined,
    })
  })
})

describe('POST /api/auth/esqueci-senha', () => {
  it('normaliza o e-mail e responde 200', async () => {
    authServiceFalso.esqueciSenha.mockResolvedValue({ mensagem: 'ok' })

    const resposta = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: ' Maria@Exemplo.com ' })

    expect(resposta.status).toBe(200)
    expect(authServiceFalso.esqueciSenha).toHaveBeenCalledWith({
      email: 'maria@exemplo.com',
    })
  })

  it('e-mail inválido: 400', async () => {
    const resposta = await request(app)
      .post('/api/auth/esqueci-senha')
      .send({ email: 'isso-nao-e-email' })

    expect(resposta.status).toBe(400)
    expect(authServiceFalso.esqueciSenha).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/redefinir-senha', () => {
  const corpo = {
    email: 'maria@exemplo.com',
    codigo: '123456',
    novaSenha: 'nova-senha-1',
  }

  it('troca a senha e não abre sessão', async () => {
    authServiceFalso.redefinirSenha.mockResolvedValue({ mensagem: 'ok' })

    const resposta = await request(app)
      .post('/api/auth/redefinir-senha')
      .send(corpo)

    expect(resposta.status).toBe(200)
    expect(authServiceFalso.redefinirSenha).toHaveBeenCalledWith(corpo)
    expect(cookiesDa(resposta)).toHaveLength(0)
  })

  it.each([
    ['senha curta', { ...corpo, novaSenha: '1234567' }],
    ['código com letras', { ...corpo, codigo: '12ab56' }],
    ['sem nova senha', { email: corpo.email, codigo: corpo.codigo }],
  ])('rejeita %s com 400', async (_nome, enviado) => {
    const resposta = await request(app)
      .post('/api/auth/redefinir-senha')
      .send(enviado)

    expect(resposta.status).toBe(400)
    expect(authServiceFalso.redefinirSenha).not.toHaveBeenCalled()
  })

  it('código vencido vem do service como 400', async () => {
    authServiceFalso.redefinirSenha.mockRejectedValue(
      new ErroDeNegocio('codigo_invalido', 'Código inválido ou vencido.'),
    )

    const resposta = await request(app)
      .post('/api/auth/redefinir-senha')
      .send(corpo)

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('codigo_invalido')
  })
})

describe('proteção de origem em /api/auth (ambiente de teste)', () => {
  it('Origin de localhost passa; Origin de outro site é recusada', async () => {
    authServiceFalso.esqueciSenha.mockResolvedValue({ mensagem: 'ok' })

    const local = await request(app)
      .post('/api/auth/esqueci-senha')
      .set('Origin', 'http://localhost:5173')
      .send({ email: 'maria@exemplo.com' })
    expect(local.status).toBe(200)

    const estranha = await request(app)
      .post('/api/auth/esqueci-senha')
      .set('Origin', 'https://site-malicioso.example')
      .send({ email: 'maria@exemplo.com' })
    expect(estranha.status).toBe(403)
    expect(estranha.body.erro.codigo).toBe('origem_nao_permitida')
  })

  it('corpo que não é JSON: 415', async () => {
    const resposta = await request(app)
      .post('/api/auth/esqueci-senha')
      .set('Content-Type', 'text/plain')
      .send('email=maria@exemplo.com')

    expect(resposta.status).toBe(415)
    expect(resposta.body.erro.codigo).toBe('tipo_nao_suportado')
  })
})
