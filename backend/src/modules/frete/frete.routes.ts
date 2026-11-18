import { Router } from 'express'
import { protegerOrigem } from '../../middlewares/protegerOrigem.js'
import { validar } from '../../middlewares/validar.js'
import { cotar } from './frete.controller.js'
import { cotacaoSchema } from './frete.schemas.js'

export const freteRoutes = Router()

// Cotação pública (compra sem cadastro), sem cache. É POST, então passa pela
// proteção de origem. Falta o limite de tentativas por IP, pendência
// obrigatória antes do lançamento (plano, seção 12): cada chamada gasta uma
// consulta ao Melhor Envio (limite de 250 por minuto na conta).
freteRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
freteRoutes.post('/cotacao', protegerOrigem, validar(cotacaoSchema), cotar)
