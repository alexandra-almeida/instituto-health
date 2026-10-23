// Único ponto de chamada HTTP do site ao backend. Sempre caminhos relativos
// (/api/...): em produção o rewrite do vercel.json leva ao backend e em
// desenvolvimento o proxy do Vite leva a localhost:3333, então navegador e API
// ficam na mesma origem (sem CORS, com cookies de primeira parte).
//
// A sessão vive em cookies httpOnly que o navegador envia sozinho: este
// arquivo nunca lê, guarda nem repassa token, e nada de sessão vai para
// localStorage ou sessionStorage.

export type TipoDePerfil = 'profissional' | 'homecare'
export type StatusDoPerfil = 'pendente' | 'aprovado' | 'recusado'

export interface Usuario {
  id: string
  email: string
}

export interface PerfilDaConta {
  nome: string
  tipo: TipoDePerfil
  status: StatusDoPerfil
}

export interface DadosDaSessao {
  usuario: Usuario
  perfil: PerfilDaConta
}

export interface Mensagem {
  mensagem: string
}

const MENSAGEM_SEM_CONEXAO =
  'Não foi possível conectar. Confira sua internet e tente de novo.'
const MENSAGEM_ERRO_GENERICO = 'Algo deu errado. Tente novamente em instantes.'

// Erro devolvido pela API no formato { erro: { codigo, mensagem } }. A
// mensagem já vem em português, pronta para mostrar na tela; o `codigo` serve
// para a interface decidir o que fazer (ex.: email_nao_confirmado).
export class ApiError extends Error {
  readonly codigo: string
  readonly status: number

  constructor(codigo: string, mensagem: string, status: number) {
    super(mensagem)
    this.name = 'ApiError'
    this.codigo = codigo
    this.status = status
  }
}

// Lê { erro: { codigo, mensagem } } sem confiar no formato: uma página de erro
// HTML do proxy, por exemplo, não pode derrubar a interface.
function lerErro(corpo: unknown): { codigo: string; mensagem: string } | null {
  if (typeof corpo !== 'object' || corpo === null || !('erro' in corpo)) {
    return null
  }
  const erro = corpo.erro
  if (typeof erro !== 'object' || erro === null) return null
  const { codigo, mensagem } = erro as Record<string, unknown>
  if (typeof codigo !== 'string' || typeof mensagem !== 'string') return null
  return { codigo, mensagem }
}

async function requisicao<T>(
  metodo: 'GET' | 'POST',
  caminho: string,
  corpo?: unknown,
): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      credentials: 'same-origin',
      headers:
        corpo === undefined
          ? undefined
          : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ApiError('sem_conexao', MENSAGEM_SEM_CONEXAO, 0)
  }

  if (resposta.ok) {
    // O logout responde 204, sem corpo
    if (resposta.status === 204) return undefined as T
    try {
      return (await resposta.json()) as T
    } catch {
      throw new ApiError(
        'erro_servidor',
        MENSAGEM_ERRO_GENERICO,
        resposta.status,
      )
    }
  }

  let erro: { codigo: string; mensagem: string } | null = null
  try {
    erro = lerErro(await resposta.json())
  } catch {
    // corpo que não é JSON: cai na mensagem genérica
  }
  throw new ApiError(
    erro?.codigo ?? 'erro_servidor',
    erro?.mensagem ?? MENSAGEM_ERRO_GENERICO,
    resposta.status,
  )
}

export const api = {
  cadastro: (dados: {
    perfil: TipoDePerfil
    nome: string
    email: string
    senha: string
  }) => requisicao<Mensagem>('POST', '/auth/cadastro', dados),

  confirmarEmail: (email: string, codigo: string) =>
    requisicao<DadosDaSessao>('POST', '/auth/confirmar-email', {
      email,
      codigo,
    }),

  reenviarCodigo: (email: string) =>
    requisicao<Mensagem>('POST', '/auth/reenviar-codigo', { email }),

  login: (email: string, senha: string) =>
    requisicao<DadosDaSessao>('POST', '/auth/login', { email, senha }),

  logout: () => requisicao<void>('POST', '/auth/logout'),

  eu: () => requisicao<DadosDaSessao>('GET', '/auth/eu'),

  esqueciSenha: (email: string) =>
    requisicao<Mensagem>('POST', '/auth/esqueci-senha', { email }),

  redefinirSenha: (dados: {
    email: string
    codigo: string
    novaSenha: string
  }) => requisicao<Mensagem>('POST', '/auth/redefinir-senha', dados),
}
