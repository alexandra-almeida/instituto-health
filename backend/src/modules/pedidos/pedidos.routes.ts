import { Router } from 'express'
import { autenticar } from '../../middlewares/autenticar.js'
import { autenticarOpcional } from '../../middlewares/autenticarOpcional.js'
import { limitarCriacaoDePedido } from '../../middlewares/limitarTentativas.js'
import { protegerOrigem } from '../../middlewares/protegerOrigem.js'
import { validar, validarEntrada } from '../../middlewares/validar.js'
import { buscar, criar, listar } from './pedidos.controller.js'
import { criarPedidoSchema, idDoPedidoSchema } from './pedidos.schemas.js'

export const pedidosRoutes = Router()

// Dados pessoais e valores: nada de cache em lugar nenhum
pedidosRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// Criar pedido: visitante pode (compra sem cadastro); com sessão válida o
// pedido fica ligado à conta. Passa pela proteção de origem (POST) e pelo limite
// de tentativas por IP (5 a cada 10 minutos).
pedidosRoutes.post(
  '/',
  protegerOrigem,
  limitarCriacaoDePedido,
  autenticarOpcional,
  validar(criarPedidoSchema),
  criar,
)

// Consultar: só logado, e só o dono (ou admin)
pedidosRoutes.get('/', autenticar, listar)
pedidosRoutes.get(
  '/:id',
  autenticar,
  validarEntrada(idDoPedidoSchema, 'params'),
  buscar,
)
