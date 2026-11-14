import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'

// Só o Supabase é trocado por simulados (sessão e três repositórios): o
// middleware exigirAdmin e o service do admin rodam de verdade.
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

const comprovantesFalso = vi.hoisted(() => ({
  listarPorPerfis: vi.fn(),
  buscarPorId: vi.fn(),
  criarUrlDeLeitura: vi.fn(),
}))
vi.mock('../src/repositories/comprovantes.repository.js', () => ({
  comprovantesRepository: comprovantesFalso,
}))

// O envio de e-mail é trocado: nenhum teste fala com o Resend de verdade
const emailFalso = vi.hoisted(() => ({ enviarEmail: vi.fn() }))
vi.mock('../src/lib/email.js', () => ({
  enviarEmail: emailFalso.enviarEmail,
  REMETENTE: 'Instituto Health <naoresponda@healthinstituto.com.br>',
}))

const avaliacoesFalso = vi.hoisted(() => ({ ultimasPorPerfis: vi.fn() }))
vi.mock('../src/repositories/avaliacoes.repository.js', () => ({
  avaliacoesRepository: avaliacoesFalso,
}))

const { default: app } = await import('../src/app.js')

const ADMIN_ID = '11111111-1111-4111-8111-111111111111'
const ALVO = '22222222-2222-4222-8222-222222222222'
const COMPROVANTE = '33333333-3333-4333-8333-333333333333'
const usuario = { id: ADMIN_ID, email: 'bia@exemplo.com' }
const perfilDaSessao = {
  nome: 'Bia',
  tipo: 'profissional',
  status: 'aprovado',
  ehAdmin: true,
}
const COOKIE = ['ih_acesso=tok-acesso']

type Rota = { metodo: 'get' | 'post'; caminho: string; corpo?: object }
const ROTAS: Rota[] = [
  { metodo: 'get', caminho: '/api/admin/resumo' },
  { metodo: 'get', caminho: '/api/admin/profissionais' },
  { metodo: 'get', caminho: '/api/admin/homecare' },
  { metodo: 'get', caminho: `/api/admin/comprovantes/${COMPROVANTE}/url` },
  { metodo: 'post', caminho: `/api/admin/profissionais/${ALVO}/aprovar` },
  {
    metodo: 'post',
    caminho: `/api/admin/profissionais/${ALVO}/recusar`,
    corpo: { motivo: 'Comprovante ilegível' },
  },
]

const chamar = (rota: Rota) =>
  request(app)[rota.metodo](rota.caminho).set('Cookie', COOKIE).send(rota.corpo)

function comoAdmin() {
  authServiceFalso.autenticarSessao.mockResolvedValue({
    usuario,
    perfil: perfilDaSessao,
  })
  perfisFalso.buscarPorId.mockImplementation((id: string) =>
    Promise.resolve(
      id === ADMIN_ID
        ? {
            id,
            nome: 'Bia',
            tipo: 'profissional',
            status: 'aprovado',
            is_admin: true,
          }
        : {
            id,
            nome: 'Maria',
            tipo: 'profissional',
            status: 'pendente',
            is_admin: false,
          },
    ),
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  comprovantesFalso.listarPorPerfis.mockResolvedValue(new Map())
  avaliacoesFalso.ultimasPorPerfis.mockResolvedValue(new Map())
})

function nenhumaAcaoDeAdminFoiExecutada() {
  expect(perfisFalso.listar).not.toHaveBeenCalled()
  expect(perfisFalso.contarPorStatus).not.toHaveBeenCalled()
  expect(perfisFalso.avaliar).not.toHaveBeenCalled()
  expect(comprovantesFalso.criarUrlDeLeitura).not.toHaveBeenCalled()
  expect(comprovantesFalso.buscarPorId).not.toHaveBeenCalled()
}

describe('proteção: só admin', () => {
  it.each(ROTAS)('$metodo $caminho sem sessão: 401', async (rota) => {
    authServiceFalso.autenticarSessao.mockRejectedValue(
      new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
    )

    const resposta = await chamar(rota)

    expect(resposta.status).toBe(401)
    nenhumaAcaoDeAdminFoiExecutada()
  })

  it.each(ROTAS)(
    '$metodo $caminho logado, mas não admin: 403',
    async (rota) => {
      authServiceFalso.autenticarSessao.mockResolvedValue({
        usuario: { id: ALVO, email: 'maria@exemplo.com' },
        // Mesmo que a sessão dissesse ehAdmin: true, só o banco decide
        perfil: { ...perfilDaSessao, ehAdmin: true },
      })
      perfisFalso.buscarPorId.mockResolvedValue({
        id: ALVO,
        nome: 'Maria',
        tipo: 'profissional',
        status: 'aprovado',
        is_admin: false,
      })

      const resposta = await chamar(rota)

      expect(resposta.status).toBe(403)
      expect(resposta.body.erro).toMatchObject({ codigo: 'acesso_negado' })
      nenhumaAcaoDeAdminFoiExecutada()
    },
  )

  it.each(ROTAS)(
    '$metodo $caminho perfil sumiu do banco: 403',
    async (rota) => {
      authServiceFalso.autenticarSessao.mockResolvedValue({
        usuario,
        perfil: perfilDaSessao,
      })
      perfisFalso.buscarPorId.mockResolvedValue(null)

      const resposta = await chamar(rota)

      expect(resposta.status).toBe(403)
      nenhumaAcaoDeAdminFoiExecutada()
    },
  )
})

describe('GET /api/admin/resumo', () => {
  it('devolve as contagens, sem cache', async () => {
    comoAdmin()
    perfisFalso.contarPorStatus.mockResolvedValue({
      profissionais: { pendente: 3, aprovado: 10, recusado: 1 },
      homecare: 12,
    })

    const resposta = await chamar(ROTAS[0] as Rota)

    expect(resposta.status).toBe(200)
    expect(resposta.headers['cache-control']).toBe('no-store')
    expect(resposta.body).toEqual({
      profissionais: { pendente: 3, aprovado: 10, recusado: 1 },
      homecare: 12,
    })
  })
})

describe('GET /api/admin/profissionais', () => {
  const linha = {
    id: ALVO,
    nome: 'Maria',
    email: 'maria@exemplo.com',
    telefone: null,
    registroProfissional: null,
    status: 'pendente',
    criadoEm: '2026-11-10T10:00:00Z',
  }

  it('padrão: pendentes, página 1, 20 por página, só os campos necessários', async () => {
    comoAdmin()
    perfisFalso.listar.mockResolvedValue({ itens: [linha], total: 41 })
    comprovantesFalso.listarPorPerfis.mockResolvedValue(
      new Map([
        [
          ALVO,
          [
            { id: 'c-2', enviadoEm: '2026-11-12T10:00:00Z' },
            { id: 'c-1', enviadoEm: '2026-11-10T10:05:00Z' },
          ],
        ],
      ]),
    )

    const resposta = await request(app)
      .get('/api/admin/profissionais')
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(200)
    expect(perfisFalso.listar).toHaveBeenCalledWith({
      tipo: 'profissional',
      status: 'pendente',
      busca: undefined,
      pagina: 1,
      porPagina: 20,
    })
    expect(resposta.body).toMatchObject({
      total: 41,
      pagina: 1,
      porPagina: 20,
      totalDePaginas: 3,
    })
    const item = resposta.body.itens[0]
    expect(item.ultimoComprovanteEm).toBe('2026-11-12T10:00:00Z')
    expect(item.comprovantes).toHaveLength(2)
    // LGPD: nada além do necessário (sem senha, token, endereço ou pagamento)
    expect(Object.keys(item).sort()).toEqual(
      [
        'avaliacao',
        'comprovantes',
        'criadoEm',
        'email',
        'id',
        'nome',
        'registroProfissional',
        'status',
        'telefone',
        'ultimoComprovanteEm',
      ].sort(),
    )
    expect(JSON.stringify(resposta.body)).not.toMatch(
      /storage_path|caminho|senha|token|is_admin/i,
    )
  })

  it('repassa status, página e busca já limpa', async () => {
    comoAdmin()
    perfisFalso.listar.mockResolvedValue({ itens: [], total: 0 })

    await request(app)
      .get(
        '/api/admin/profissionais?status=recusado&pagina=2&busca=%20%20ana%20',
      )
      .set('Cookie', COOKIE)

    expect(perfisFalso.listar).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'recusado', pagina: 2, busca: 'ana' }),
    )
  })

  it('corta a busca em 100 caracteres', async () => {
    comoAdmin()
    perfisFalso.listar.mockResolvedValue({ itens: [], total: 0 })

    await request(app)
      .get(`/api/admin/profissionais?busca=${'a'.repeat(250)}`)
      .set('Cookie', COOKIE)

    const consulta = perfisFalso.listar.mock.calls[0]?.[0] as { busca: string }
    expect(consulta.busca).toHaveLength(100)
  })

  it.each([
    'status=aprovada',
    'status=todos',
    'pagina=0',
    'pagina=abc',
    'pagina=-1',
  ])('consulta inválida (%s): 400, sem consultar o banco', async (consulta) => {
    comoAdmin()

    const resposta = await request(app)
      .get(`/api/admin/profissionais?${consulta}`)
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(400)
    expect(perfisFalso.listar).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/homecare', () => {
  it('só consulta: nome, e-mail, telefone e data (nada de status nem registro)', async () => {
    comoAdmin()
    perfisFalso.listar.mockResolvedValue({
      itens: [
        {
          id: ALVO,
          nome: 'Joana',
          email: 'joana@exemplo.com',
          telefone: '16999990000',
          registroProfissional: 'segredo-que-nao-sai',
          status: 'aprovado',
          criadoEm: '2026-11-09T10:00:00Z',
        },
      ],
      total: 12,
    })

    const resposta = await request(app)
      .get('/api/admin/homecare')
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(200)
    expect(perfisFalso.listar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'homecare', pagina: 1, porPagina: 20 }),
    )
    expect(resposta.body.total).toBe(12)
    expect(resposta.body.itens[0]).toEqual({
      id: ALVO,
      nome: 'Joana',
      email: 'joana@exemplo.com',
      telefone: '16999990000',
      criadoEm: '2026-11-09T10:00:00Z',
    })
  })
})

describe('POST /api/admin/profissionais/:id/aprovar', () => {
  it('aprova, grava quem decidiu (da sessão) e devolve o novo status', async () => {
    comoAdmin()
    perfisFalso.avaliar.mockResolvedValue(true)

    const resposta = await request(app)
      .post(`/api/admin/profissionais/${ALVO}/aprovar`)
      .set('Cookie', COOKIE)
      // Quem decide vem da sessão: o que vier no corpo é ignorado
      .send({ avaliadorId: ALVO, status: 'aprovado' })

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'aprovado' })
    expect(perfisFalso.avaliar).toHaveBeenCalledWith({
      perfilId: ALVO,
      decisao: 'aprovado',
      motivo: null,
      avaliadorId: ADMIN_ID,
    })
  })

  it('já avaliado: 409 e nada muda', async () => {
    comoAdmin()
    perfisFalso.avaliar.mockResolvedValue(false)

    const resposta = await request(app)
      .post(`/api/admin/profissionais/${ALVO}/aprovar`)
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toMatchObject({
      codigo: 'cadastro_ja_avaliado',
    })
  })

  it('perfil que não existe ou não é profissional: 404', async () => {
    comoAdmin()
    perfisFalso.buscarPorId.mockImplementation((id: string) =>
      Promise.resolve(
        id === ADMIN_ID
          ? {
              id,
              nome: 'Bia',
              tipo: 'profissional',
              status: 'aprovado',
              is_admin: true,
            }
          : id === ALVO
            ? {
                id,
                nome: 'Joana',
                tipo: 'homecare',
                status: 'aprovado',
                is_admin: false,
              }
            : null,
      ),
    )

    const homecare = await request(app)
      .post(`/api/admin/profissionais/${ALVO}/aprovar`)
      .set('Cookie', COOKIE)
    const inexistente = await request(app)
      .post(
        '/api/admin/profissionais/44444444-4444-4444-8444-444444444444/aprovar',
      )
      .set('Cookie', COOKIE)

    expect(homecare.status).toBe(404)
    expect(inexistente.status).toBe(404)
    expect(perfisFalso.avaliar).not.toHaveBeenCalled()
  })

  it('id que não é uuid: 400', async () => {
    comoAdmin()

    const resposta = await request(app)
      .post('/api/admin/profissionais/nao-e-uuid/aprovar')
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(400)
    expect(perfisFalso.avaliar).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/profissionais/:id/recusar', () => {
  const recusar = (corpo: object) =>
    request(app)
      .post(`/api/admin/profissionais/${ALVO}/recusar`)
      .set('Cookie', COOKIE)
      .send(corpo)

  it.each([
    ['sem motivo', {}],
    ['motivo vazio', { motivo: '' }],
    ['só espaços', { motivo: '     ' }],
    ['curto demais', { motivo: 'ok' }],
    ['longo demais', { motivo: 'x'.repeat(301) }],
    ['não é texto', { motivo: 123 }],
  ])('recusar %s: 400, sem decidir nada', async (_nome, corpo) => {
    comoAdmin()

    const resposta = await recusar(corpo)

    expect(resposta.status).toBe(400)
    expect(perfisFalso.avaliar).not.toHaveBeenCalled()
  })

  it('recusa com o motivo (sem espaços nas pontas) e grava quem decidiu', async () => {
    comoAdmin()
    perfisFalso.avaliar.mockResolvedValue(true)

    const resposta = await recusar({ motivo: '  Comprovante ilegível  ' })

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'recusado' })
    expect(perfisFalso.avaliar).toHaveBeenCalledWith({
      perfilId: ALVO,
      decisao: 'recusado',
      motivo: 'Comprovante ilegível',
      avaliadorId: ADMIN_ID,
    })
  })

  it('já avaliado: 409', async () => {
    comoAdmin()
    perfisFalso.avaliar.mockResolvedValue(false)

    const resposta = await recusar({ motivo: 'Documento vencido' })

    expect(resposta.status).toBe(409)
  })
})

describe('e-mails depois da decisão', () => {
  const contato = { nome: 'Maria Souza', email: 'maria@exemplo.com' }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    comoAdmin()
    perfisFalso.avaliar.mockResolvedValue(true)
    perfisFalso.buscarContato.mockResolvedValue(contato)
    emailFalso.enviarEmail.mockResolvedValue(undefined)
  })

  it('aprovar avisa o profissional, no e-mail do cadastro', async () => {
    await request(app)
      .post(`/api/admin/profissionais/${ALVO}/aprovar`)
      .set('Cookie', COOKIE)

    expect(emailFalso.enviarEmail).toHaveBeenCalledTimes(1)
    expect(emailFalso.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        para: 'maria@exemplo.com',
        assunto: 'Seu cadastro foi aprovado',
      }),
    )
  })

  it('recusar avisa o profissional com o motivo', async () => {
    await request(app)
      .post(`/api/admin/profissionais/${ALVO}/recusar`)
      .set('Cookie', COOKIE)
      .send({ motivo: 'Comprovante ilegível' })

    expect(emailFalso.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        para: 'maria@exemplo.com',
        assunto: 'Não conseguimos aprovar seu cadastro',
        texto: expect.stringContaining('Motivo: Comprovante ilegível'),
      }),
    )
  })

  it('falha no envio NÃO desfaz a aprovação: 200, decisão gravada, log sem dados', async () => {
    emailFalso.enviarEmail.mockRejectedValue(
      new Error('O Resend respondeu 500'),
    )

    const resposta = await request(app)
      .post(`/api/admin/profissionais/${ALVO}/aprovar`)
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'aprovado' })
    expect(perfisFalso.avaliar).toHaveBeenCalledTimes(1)
    const registrado = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(registrado).not.toMatch(/Maria|maria@/)
  })

  it('falha ao buscar o contato também não desfaz a recusa', async () => {
    perfisFalso.buscarContato.mockRejectedValue(
      new Error('Falha ao buscar contato (XX)'),
    )

    const resposta = await request(app)
      .post(`/api/admin/profissionais/${ALVO}/recusar`)
      .set('Cookie', COOKIE)
      .send({ motivo: 'Documento vencido' })

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'recusado' })
    expect(emailFalso.enviarEmail).not.toHaveBeenCalled()
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      'Documento vencido',
    )
  })

  it('decisão que não valeu (já avaliado) não manda e-mail nenhum', async () => {
    perfisFalso.avaliar.mockResolvedValue(false)

    const resposta = await request(app)
      .post(`/api/admin/profissionais/${ALVO}/aprovar`)
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(409)
    expect(emailFalso.enviarEmail).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/comprovantes/:id/url', () => {
  it('admin recebe só uma URL assinada de 5 minutos, sem cache e sem o arquivo', async () => {
    comoAdmin()
    comprovantesFalso.buscarPorId.mockResolvedValue({
      id: COMPROVANTE,
      perfilId: ALVO,
      caminho: `${ALVO}/arquivo.pdf`,
    })
    comprovantesFalso.criarUrlDeLeitura.mockResolvedValue(
      'https://exemplo.supabase.co/storage/v1/object/sign/x?token=t',
    )

    const resposta = await request(app)
      .get(`/api/admin/comprovantes/${COMPROVANTE}/url`)
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(200)
    expect(comprovantesFalso.criarUrlDeLeitura).toHaveBeenCalledWith(
      `${ALVO}/arquivo.pdf`,
      300,
    )
    expect(resposta.headers['cache-control']).toBe('no-store')
    expect(resposta.headers['content-type']).toMatch(/json/)
    expect(resposta.body).toEqual({
      url: 'https://exemplo.supabase.co/storage/v1/object/sign/x?token=t',
      expiraEmSegundos: 300,
    })
  })

  it('comprovante que não existe: 404, sem gerar URL', async () => {
    comoAdmin()
    comprovantesFalso.buscarPorId.mockResolvedValue(null)

    const resposta = await request(app)
      .get(`/api/admin/comprovantes/${COMPROVANTE}/url`)
      .set('Cookie', COOKIE)

    expect(resposta.status).toBe(404)
    expect(comprovantesFalso.criarUrlDeLeitura).not.toHaveBeenCalled()
  })

  it('id que não é uuid: 400', async () => {
    comoAdmin()

    const resposta = await request(app)
      .get('/api/admin/comprovantes/../../outro/url')
      .set('Cookie', COOKIE)

    expect([400, 404]).toContain(resposta.status)
    expect(comprovantesFalso.criarUrlDeLeitura).not.toHaveBeenCalled()
  })
})
