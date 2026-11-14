import type { Request, RequestHandler } from 'express'
import { ErroDeNegocio } from '../../lib/erros.js'
import type {
  IdEntrada,
  ListaDeHomeCareEntrada,
  ListaDeProfissionaisEntrada,
  RecusarEntrada,
} from './admin.schemas.js'
import { adminService } from './admin.service.js'

// Query e parâmetros já passaram pelo middleware `validarEntrada` (resultado
// em res.locals); o corpo, pelo `validar`. Quem está decidindo vem sempre da
// sessão, nunca do corpo.
function adminDaSessao(req: Request): string {
  if (!req.usuario) {
    throw new ErroDeNegocio(
      'nao_autenticado',
      'Faça login para continuar.',
      401,
    )
  }
  return req.usuario.id
}

export const resumo: RequestHandler = async (_req, res) => {
  res.json(await adminService.resumo())
}

export const listarProfissionais: RequestHandler = async (_req, res) => {
  const consulta = res.locals.query as ListaDeProfissionaisEntrada
  res.json(await adminService.listarProfissionais(consulta))
}

export const listarHomeCare: RequestHandler = async (_req, res) => {
  const consulta = res.locals.query as ListaDeHomeCareEntrada
  res.json(await adminService.listarHomeCare(consulta))
}

export const urlDoComprovante: RequestHandler = async (_req, res) => {
  const { id } = res.locals.params as IdEntrada
  res.json(await adminService.urlDoComprovante(id))
}

export const aprovar: RequestHandler = async (req, res) => {
  const { id } = res.locals.params as IdEntrada
  res.json(await adminService.aprovar(id, adminDaSessao(req)))
}

export const recusar: RequestHandler = async (req, res) => {
  const { id } = res.locals.params as IdEntrada
  const { motivo } = req.body as RecusarEntrada
  res.json(await adminService.recusar(id, motivo, adminDaSessao(req)))
}
