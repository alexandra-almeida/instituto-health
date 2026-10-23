import type { Response } from 'express'

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

export function limparSessao(res: Response) {
  res.clearCookie(COOKIE_ACESSO, base)
  res.clearCookie(COOKIE_RENOVACAO, base)
}
