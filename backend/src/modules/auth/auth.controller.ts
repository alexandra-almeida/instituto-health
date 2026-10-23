import type { RequestHandler } from 'express'
import { gravarSessao, lerSessao, limparSessao } from '../../lib/cookies.js'
import type {
  CadastroEntrada,
  ConfirmarEmailEntrada,
  EsqueciSenhaEntrada,
  LoginEntrada,
  RedefinirSenhaEntrada,
  ReenviarCodigoEntrada,
} from './auth.schemas.js'
import { authService } from './auth.service.js'

// O corpo já passou pelo middleware `validar`, então os tipos abaixo valem.

export const cadastrar: RequestHandler = async (req, res) => {
  const resultado = await authService.cadastrar(req.body as CadastroEntrada)
  res.status(201).json(resultado)
}

export const confirmarEmail: RequestHandler = async (req, res) => {
  const { sessao, usuario, perfil } = await authService.confirmarEmail(
    req.body as ConfirmarEmailEntrada,
  )
  // Tokens só nos cookies; o corpo da resposta não os repete
  gravarSessao(res, sessao)
  res.json({ usuario, perfil })
}

export const reenviarCodigo: RequestHandler = async (req, res) => {
  const resultado = await authService.reenviarCodigo(
    req.body as ReenviarCodigoEntrada,
  )
  res.json(resultado)
}

export const login: RequestHandler = async (req, res) => {
  const { sessao, usuario, perfil } = await authService.entrar(
    req.body as LoginEntrada,
  )
  gravarSessao(res, sessao)
  res.json({ usuario, perfil })
}

export const logout: RequestHandler = async (req, res) => {
  await authService.sair(lerSessao(req).accessToken)
  // Limpa os cookies mesmo sem sessão ou com o encerramento recusado
  limparSessao(res)
  res.status(204).end()
}

// Chega aqui só depois do middleware `autenticar`, que preenche usuario e
// perfil. is_admin nunca é devolvido ao navegador.
export const eu: RequestHandler = (req, res) => {
  res.json({ usuario: req.usuario, perfil: req.perfil })
}

export const esqueciSenha: RequestHandler = async (req, res) => {
  const resultado = await authService.esqueciSenha(
    req.body as EsqueciSenhaEntrada,
  )
  res.json(resultado)
}

export const redefinirSenha: RequestHandler = async (req, res) => {
  const resultado = await authService.redefinirSenha(
    req.body as RedefinirSenhaEntrada,
  )
  res.json(resultado)
}
