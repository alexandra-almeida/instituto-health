import { Router } from 'express'
import { limitarCotacao } from '../../middlewares/limitarTentativas.js'
import { protegerOrigem } from '../../middlewares/protegerOrigem.js'
import { validar } from '../../middlewares/validar.js'
import { cotar } from './frete.controller.js'
import { cotacaoSchema } from './frete.schemas.js'

export const freteRoutes = Router()

// Cotação pública (compra sem cadastro), sem cache. É POST, então passa pela
// proteção de origem e pelo limite de tentativas por IP (20 a cada 10 minutos):
// cada chamada gasta uma consulta ao Melhor Envio (limite de 250 por minuto na
// conta).
freteRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
freteRoutes.post(
  '/cotacao',
  protegerOrigem,
  limitarCotacao,
  validar(cotacaoSchema),
  cotar,
)
