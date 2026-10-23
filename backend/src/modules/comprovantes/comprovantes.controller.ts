import type { Request, RequestHandler } from 'express'
import { ErroDeNegocio } from '../../lib/erros.js'
import type {
  ConfirmarEntrada,
  UrlDeEnvioEntrada,
} from './comprovantes.schemas.js'
import {
  comprovantesService,
  type PerfilDaSessao,
} from './comprovantes.service.js'

// O corpo já passou pelo middleware `validar`. O perfil vem sempre da sessão
// (preenchida por `autenticar`), nunca do corpo.
function perfilDaSessao(req: Request): PerfilDaSessao {
  if (!req.usuario || !req.perfil) {
    throw new ErroDeNegocio(
      'nao_autenticado',
      'Faça login para continuar.',
      401,
    )
  }
  return {
    id: req.usuario.id,
    tipo: req.perfil.tipo,
    status: req.perfil.status,
  }
}

export const urlDeEnvio: RequestHandler = async (req, res) => {
  const resultado = await comprovantesService.gerarUrlDeEnvio(
    perfilDaSessao(req),
    req.body as UrlDeEnvioEntrada,
  )
  // A URL carrega um token de envio: nada de cache
  res.set('Cache-Control', 'no-store')
  res.json(resultado)
}

export const confirmar: RequestHandler = async (req, res) => {
  const { comprovante, criado } = await comprovantesService.confirmar(
    perfilDaSessao(req),
    req.body as ConfirmarEntrada,
  )
  res.status(criado ? 201 : 200).json({ comprovante })
}

export const listar: RequestHandler = async (req, res) => {
  res.json(await comprovantesService.listar(perfilDaSessao(req).id))
}
