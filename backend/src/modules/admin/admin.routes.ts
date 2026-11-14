import { Router } from 'express'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirAdmin } from '../../middlewares/exigirAdmin.js'
import { protegerOrigem } from '../../middlewares/protegerOrigem.js'
import { validar, validarEntrada } from '../../middlewares/validar.js'
import {
  aprovar,
  listarHomeCare,
  listarProfissionais,
  recusar,
  resumo,
  urlDoComprovante,
} from './admin.controller.js'
import {
  idSchema,
  listaDeHomeCareSchema,
  listaDeProfissionaisSchema,
  recusarSchema,
} from './admin.schemas.js'

export const adminRoutes = Router()

// TODAS as rotas daqui exigem sessão E is_admin (conferido no banco a cada
// chamada). Os POST também passam pela proteção de origem. As respostas levam
// dados pessoais e links temporários: nada de cache.
adminRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
adminRoutes.use(protegerOrigem)
adminRoutes.use(autenticar)
adminRoutes.use(exigirAdmin)

adminRoutes.get('/resumo', resumo)
adminRoutes.get(
  '/profissionais',
  validarEntrada(listaDeProfissionaisSchema, 'query'),
  listarProfissionais,
)
adminRoutes.get(
  '/homecare',
  validarEntrada(listaDeHomeCareSchema, 'query'),
  listarHomeCare,
)
adminRoutes.get(
  '/comprovantes/:id/url',
  validarEntrada(idSchema, 'params'),
  urlDoComprovante,
)
adminRoutes.post(
  '/profissionais/:id/aprovar',
  validarEntrada(idSchema, 'params'),
  aprovar,
)
adminRoutes.post(
  '/profissionais/:id/recusar',
  validarEntrada(idSchema, 'params'),
  validar(recusarSchema),
  recusar,
)
