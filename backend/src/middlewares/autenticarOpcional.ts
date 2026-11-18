import type { RequestHandler } from 'express'
import { gravarSessao, lerSessao } from '../lib/cookies.js'
import { ErroDeNegocio } from '../lib/erros.js'
import { authService, type AuthService } from '../modules/auth/auth.service.js'

// Como `autenticar`, mas SEM exigir sessão: quem compra sem cadastro segue como
// visitante. Sessão válida deixa `usuario` e `perfil` em `req` (e renova os
// cookies se precisar); sessão ausente ou vencida (401) segue sem usuário. Qualquer
// outro erro continua sendo erro. O que o visitante PODE fazer não depende
// deste middleware: quem decide o tipo de preço é o service, que lê o banco.
export function criarAutenticarOpcional(
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
      if (erro instanceof ErroDeNegocio && erro.status === 401) {
        next()
        return
      }
      next(erro)
    }
  }
}

export const autenticarOpcional = criarAutenticarOpcional(authService)
