import { Router } from 'express'
import { autenticar } from '../../middlewares/autenticar.js'
import { protegerOrigem } from '../../middlewares/protegerOrigem.js'
import { validar } from '../../middlewares/validar.js'
import { confirmar, listar, urlDeEnvio } from './comprovantes.controller.js'
import { confirmarSchema, urlDeEnvioSchema } from './comprovantes.schemas.js'

export const comprovantesRoutes = Router()

// Todas as rotas exigem sessão; os POST também passam pela proteção de origem
comprovantesRoutes.use(protegerOrigem)
comprovantesRoutes.use(autenticar)

comprovantesRoutes.get('/', listar)
comprovantesRoutes.post('/url-de-envio', validar(urlDeEnvioSchema), urlDeEnvio)
comprovantesRoutes.post('/confirmar', validar(confirmarSchema), confirmar)
