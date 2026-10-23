import type { AuthError } from '@supabase/supabase-js'
import type { Sessao } from '../../lib/cookies.js'
import { criarClienteSemEstado, supabaseAdmin } from '../../lib/supabase.js'

// Motivos que o service sabe tratar. Todo o resto vira 'desconhecido' e
// termina em erro 500 genérico, com o detalhe só no log.
export type MotivoDeFalha =
  | 'email_existente'
  | 'senha_fraca'
  | 'codigo_invalido'
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

function traduzir(erro: AuthError): FalhaDoSupabaseAuth {
  const codigo = erro.code ?? `http_${erro.status ?? 'sem_status'}`
  let motivo: MotivoDeFalha = 'desconhecido'

  if (codigo === 'email_exists' || codigo === 'user_already_exists') {
    motivo = 'email_existente'
  } else if (codigo === 'weak_password') {
    motivo = 'senha_fraca'
  } else if (codigo === 'otp_expired') {
    // O Supabase usa o mesmo código para código errado e código vencido
    motivo = 'codigo_invalido'
  } else if (
    codigo === 'over_email_send_rate_limit' ||
    codigo === 'over_request_rate_limit' ||
    erro.status === 429
  ) {
    motivo = 'limite_de_envio'
  }
  return new FalhaDoSupabaseAuth(motivo, codigo)
}

export interface UsuarioAutenticado {
  id: string
  email: string
}

export interface AuthClient {
  criarUsuario(email: string, senha: string): Promise<{ id: string }>
  apagarUsuario(id: string): Promise<void>
  enviarCodigoDeConfirmacao(email: string): Promise<void>
  confirmarCodigo(
    email: string,
    codigo: string,
  ): Promise<{ usuario: UsuarioAutenticado; sessao: Sessao }>
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
      sessao: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    }
  },
}
