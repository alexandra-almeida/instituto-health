import type { Request, Response } from 'express'

export const COOKIE_ACESSO = 'ih_acesso'
export const COOKIE_RENOVACAO = 'ih_renovacao'

// Tempo de vida do cookie do token de renovação. O token em si não expira no
// Supabase por padrão; o cookie limita a sessão a 30 dias.
const TRINTA_DIAS_EM_MS = 30 * 24 * 60 * 60 * 1000

export interface Sessao {
  accessToken: string
  refreshToken: string
  // Duração do token de acesso, em segundos
  expiresIn: number
}

// httpOnly: o JavaScript do site nunca vê os tokens. Secure: só trafegam em
// HTTPS (os navegadores tratam localhost como seguro, então funciona em dev).
// SameSite=Lax: não vão em requisições vindas de outros sites. Plano, seção 3.
const base = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const

export function gravarSessao(res: Response, sessao: Sessao) {
  res.cookie(COOKIE_ACESSO, sessao.accessToken, {
    ...base,
    maxAge: sessao.expiresIn * 1000,
  })
  res.cookie(COOKIE_RENOVACAO, sessao.refreshToken, {
    ...base,
    maxAge: TRINTA_DIAS_EM_MS,
  })
}

// Lê só os dois cookies da sessão do cabeçalho Cookie. Feito à mão para não
// depender de um pacote só para isso; valor com escape inválido é ignorado.
export function lerSessao(req: Request): {
  accessToken?: string
  refreshToken?: string
} {
  const encontrados: Record<string, string> = {}
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const separador = parte.indexOf('=')
    if (separador === -1) continue
    const nome = parte.slice(0, separador).trim()
    if (nome !== COOKIE_ACESSO && nome !== COOKIE_RENOVACAO) continue
    try {
      encontrados[nome] = decodeURIComponent(parte.slice(separador + 1).trim())
    } catch {
      // cookie malformado: trata como ausente
    }
  }
  return {
    accessToken: encontrados[COOKIE_ACESSO] || undefined,
    refreshToken: encontrados[COOKIE_RENOVACAO] || undefined,
  }
}

export function limparSessao(res: Response) {
  res.clearCookie(COOKIE_ACESSO, base)
  res.clearCookie(COOKIE_RENOVACAO, base)
}
