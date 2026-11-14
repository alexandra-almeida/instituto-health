import { createContext } from 'react'
import type { DadosDaSessao, PerfilDaConta, Usuario } from '../lib/api'

// 'carregando' só existe até a primeira resposta de GET /api/auth/eu; depois
// disso a pessoa está logada ou deslogada.
export type StatusDaSessao = 'carregando' | 'logado' | 'deslogado'

export interface AuthContextValue {
  status: StatusDaSessao
  usuario: Usuario | null
  perfil: PerfilDaConta | null
  /** Quantos profissionais aguardam aprovação, só para admin (o número do
   * link "Cadastros"). null enquanto não se sabe, e sempre null para quem não
   * é admin. */
  pendentes: number | null
  /** Pergunta de novo ao servidor (a tela de cadastros chama depois de aprovar
   * ou recusar) */
  atualizarPendentes: () => void
  /** abre a sessão; erros da API (ApiError) sobem para a tela tratar */
  entrar: (email: string, senha: string) => Promise<DadosDaSessao>
  /** confirma o código do cadastro; a API já abre a sessão */
  confirmarEmail: (email: string, codigo: string) => Promise<DadosDaSessao>
  sair: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
