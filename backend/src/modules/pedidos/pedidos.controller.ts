import type { Request, RequestHandler } from 'express'
import { ErroDeNegocio } from '../../lib/erros.js'
import type { CriarPedidoEntrada } from './pedidos.schemas.js'
import { pedidosService } from './pedidos.service.js'

function usuarioDaSessao(req: Request) {
  if (!req.usuario) {
    throw new ErroDeNegocio(
      'nao_autenticado',
      'Faça login para continuar.',
      401,
    )
  }
  return { id: req.usuario.id }
}

// Corpo já validado (e limpo) pelo middleware `validar`. A sessão é OPCIONAL:
// visitante compra sem cadastro.
export const criar: RequestHandler = async (req, res) => {
  const pedido = await pedidosService.criar(
    req.body as CriarPedidoEntrada,
    req.usuario ? { id: req.usuario.id } : undefined,
  )
  res.status(201).json({ pedido })
}

export const listar: RequestHandler = async (req, res) => {
  res.json(await pedidosService.listar(usuarioDaSessao(req)))
}

export const buscar: RequestHandler = async (req, res) => {
  const { id } = res.locals.params as { id: string }
  res.json({ pedido: await pedidosService.buscar(id, usuarioDaSessao(req)) })
}
