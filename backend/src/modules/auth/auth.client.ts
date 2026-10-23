import type { AuthError } from '@supabase/supabase-js'
import type { Sessao } from '../../lib/cookies.js'
import { criarClienteSemEstado, supabaseAdmin } from '../../lib/supabase.js'

// Motivos que o service sabe tratar. Todo o resto vira 'desconhecido' e
// termina em erro 500 genérico, com o detalhe só no log.
export type MotivoDeFalha =
  | 'email_existente'
  | 'senha_fraca'
  | 'senha_igual'
  | 'codigo_invalido'
  | 'credenciais_invalidas'
  | 'email_nao_confirmado'
  | 'sessao_invalida'
  | 'limite_de_envio'
  | 'desconhecido'

export class FalhaDoSupabaseAuth extends Error {
  readonly motivo: MotivoDeFalha
  // Código do Supabase (ex.: over_email_send_rate_limit), útil no log e sem
  // dado pessoal. A mensagem original não é guardada: pode conter o e-mail.
  readonly codigoOriginal: string

  constructor(motivo: MotivoDeFalha, codigoOriginal: string) {
    super(`Falha no Supabase Auth: ${codigoOriginal}`)
    this.name = 'FalhaDoSupabaseAuth'
    this.motivo = motivo
    this.codigoOriginal = codigoOriginal
  }
}

// Códigos do Supabase para token de acesso ou de renovação que não vale mais
const CODIGOS_DE_SESSAO_INVALIDA = new Set([
  'bad_jwt',
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
  'refresh_token_already_used',
  'user_not_found',
])

function traduzir(erro: AuthError): FalhaDoSupabaseAuth {
  const codigo = erro.code ?? `http_${erro.status ?? 'sem_status'}`
  let motivo: MotivoDeFalha = 'desconhecido'

  if (codigo === 'email_exists' || codigo === 'user_already_exists') {
    motivo = 'email_existente'
  } else if (codigo === 'weak_password') {
    motivo = 'senha_fraca'
  } else if (codigo === 'same_password') {
    motivo = 'senha_igual'
  } else if (codigo === 'otp_expired') {
    // O Supabase usa o mesmo código para código errado e código vencido
    motivo = 'codigo_invalido'
  } else if (codigo === 'invalid_credentials') {
    motivo = 'credenciais_invalidas'
  } else if (codigo === 'email_not_confirmed') {
    motivo = 'email_nao_confirmado'
  } else if (CODIGOS_DE_SESSAO_INVALIDA.has(codigo)) {
    motivo = 'sessao_invalida'
  } else if (
    codigo === 'over_email_send_rate_limit' ||
    codigo === 'over_request_rate_limit' ||
    erro.status === 429
  ) {
    motivo = 'limite_de_envio'
  }
  return new FalhaDoSupabaseAuth(motivo, codigo)
}

// Nas chamadas que usam um token já emitido, 401 e 403 sem código conhecido
// também significam que o token não serve mais
function traduzirDeSessao(erro: AuthError): FalhaDoSupabaseAuth {
  const falha = traduzir(erro)
  if (
    falha.motivo === 'desconhecido' &&
    (erro.status === 401 || erro.status === 403)
  ) {
    return new FalhaDoSupabaseAuth('sessao_invalida', falha.codigoOriginal)
  }
  return falha
}

export interface UsuarioAutenticado {
  id: string
  email: string
}

export interface SessaoAberta {
  usuario: UsuarioAutenticado
  sessao: Sessao
}

export interface AuthClient {
  criarUsuario(email: string, senha: string): Promise<{ id: string }>
  apagarUsuario(id: string): Promise<void>
  enviarCodigoDeConfirmacao(email: string): Promise<void>
  confirmarCodigo(email: string, codigo: string): Promise<SessaoAberta>
  entrar(email: string, senha: string): Promise<SessaoAberta>
  validarToken(accessToken: string): Promise<UsuarioAutenticado>
  renovarSessao(refreshToken: string): Promise<SessaoAberta>
  // Encerra só a sessão deste token (um aparelho)
  encerrarSessao(accessToken: string): Promise<void>
  enviarCodigoDeRecuperacao(email: string): Promise<void>
  // Troca a senha e encerra TODAS as sessões do usuário
  redefinirSenha(
    email: string,
    codigo: string,
    novaSenha: string,
  ): Promise<void>
}

type SessaoDoSdk = {
  access_token: string
  refresh_token: string
  expires_in: number
}

function paraSessao(sessao: SessaoDoSdk): Sessao {
  return {
    accessToken: sessao.access_token,
    refreshToken: sessao.refresh_token,
    expiresIn: sessao.expires_in,
  }
}

// Única parte que fala com o Supabase Auth neste módulo. O service não
// conhece o SDK, só este contrato, o que permite simulá-lo nos testes.
export const authClient: AuthClient = {
  async criarUsuario(email, senha) {
    // email_confirm: false deixa a conta aguardando o código. Usar o
    // createUser de admin (e não o signUp) evita que um novo cadastro com um
    // e-mail ainda não confirmado troque a senha dessa conta.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: false,
    })
    if (error) throw traduzir(error)
    return { id: data.user.id }
  },

  async apagarUsuario(id) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) throw traduzir(error)
  },

  async enviarCodigoDeConfirmacao(email) {
    // Cliente próprio: resend não abre sessão, mas mantemos o admin livre de
    // qualquer estado de usuário
    const { error } = await criarClienteSemEstado().auth.resend({
      type: 'signup',
      email,
    })
    if (error) throw traduzir(error)
  },

  async confirmarCodigo(email, codigo) {
    const { data, error } = await criarClienteSemEstado().auth.verifyOtp({
      email,
      token: codigo,
      type: 'signup',
    })
    if (error) throw traduzir(error)
    if (!data.session || !data.user) {
      throw new FalhaDoSupabaseAuth('desconhecido', 'sem_sessao')
    }
    return {
      usuario: { id: data.user.id, email: data.user.email ?? email },
      sessao: paraSessao(data.session),
    }
  },

  async entrar(email, senha) {
    const { data, error } =
      await criarClienteSemEstado().auth.signInWithPassword({
        email,
        password: senha,
      })
    if (error) throw traduzir(error)
    return {
      usuario: { id: data.user.id, email: data.user.email ?? email },
      sessao: paraSessao(data.session),
    }
  },

  async validarToken(accessToken) {
    // getUser consulta o servidor do Auth, então também pega token de uma
    // sessão já encerrada (logout, troca de senha), o que só ler o JWT não faz
    const { data, error } =
      await criarClienteSemEstado().auth.getUser(accessToken)
    if (error) throw traduzirDeSessao(error)
    return { id: data.user.id, email: data.user.email ?? '' }
  },

  async renovarSessao(refreshToken) {
    const { data, error } = await criarClienteSemEstado().auth.refreshSession({
      refresh_token: refreshToken,
    })
    if (error) throw traduzirDeSessao(error)
    if (!data.session || !data.user) {
      throw new FalhaDoSupabaseAuth('sessao_invalida', 'sem_sessao')
    }
    return {
      usuario: { id: data.user.id, email: data.user.email ?? '' },
      sessao: paraSessao(data.session),
    }
  },

  async encerrarSessao(accessToken) {
    const { error } = await supabaseAdmin.auth.admin.signOut(
      accessToken,
      'local',
    )
    if (error) throw traduzirDeSessao(error)
  },

  async enviarCodigoDeRecuperacao(email) {
    // Sem redirectTo: a recuperação é por código, não por link
    const { error } =
      await criarClienteSemEstado().auth.resetPasswordForEmail(email)
    if (error) throw traduzir(error)
  },

  async redefinirSenha(email, codigo, novaSenha) {
    // O mesmo cliente descartável mantém a sessão de recuperação aberta só o
    // tempo de trocar a senha
    const cliente = criarClienteSemEstado()
    const { data, error } = await cliente.auth.verifyOtp({
      email,
      token: codigo,
      type: 'recovery',
    })
    if (error) throw traduzir(error)
    if (!data.session) {
      throw new FalhaDoSupabaseAuth('desconhecido', 'sem_sessao')
    }

    const { error: erroDaSenha } = await cliente.auth.updateUser({
      password: novaSenha,
    })
    if (erroDaSenha) throw traduzir(erroDaSenha)

    // A senha já mudou. Encerrar as sessões (as de outros aparelhos e a de
    // recuperação) não pode desfazer isso, então uma falha aqui só vai para o
    // log, sem token nem e-mail
    const { error: erroDeSaida } = await supabaseAdmin.auth.admin.signOut(
      data.session.access_token,
      'global',
    )
    if (erroDeSaida) {
      console.error(
        `Senha trocada, mas as sessões não foram encerradas (${traduzir(erroDeSaida).codigoOriginal})`,
      )
    }
  },
}
