import type { RequestHandler } from 'express'
import { gravarSessao } from '../../lib/cookies.js'
import type {
  CadastroEntrada,
  ConfirmarEmailEntrada,
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
