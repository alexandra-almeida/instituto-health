import type { RequestHandler } from 'express'
import { gravarSessao, lerSessao, limparSessao } from '../lib/cookies.js'
import { ErroDeNegocio } from '../lib/erros.js'
import { authService, type AuthService } from '../modules/auth/auth.service.js'

// Valida a sessão dos cookies, renova quando o token de acesso venceu e deixa
// usuario e perfil em `req`. Sem sessão válida, 401.
export function criarAutenticar(
  servico: Pick<AuthService, 'autenticarSessao'>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const resultado = await servico.autenticarSessao(lerSessao(req))
      if (resultado.sessaoRenovada) gravarSessao(res, resultado.sessaoRenovada)
      req.usuario = resultado.usuario
      req.perfil = resultado.perfil
      next()
    } catch (erro) {
      // Cookies que não valem mais são removidos para o navegador parar de
      // reenviá-los
      if (erro instanceof ErroDeNegocio && erro.status === 401) {
        limparSessao(res)
      }
      next(erro)
    }
  }
}

export const autenticar = criarAutenticar(authService)
