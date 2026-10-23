import { Router } from 'express'
import { validar } from '../../middlewares/validar.js'
import { cadastrar, confirmarEmail, reenviarCodigo } from './auth.controller.js'
import {
  cadastroSchema,
  confirmarEmailSchema,
  reenviarCodigoSchema,
} from './auth.schemas.js'

export const authRoutes = Router()

authRoutes.post('/cadastro', validar(cadastroSchema), cadastrar)
authRoutes.post(
  '/confirmar-email',
  validar(confirmarEmailSchema),
  confirmarEmail,
)
authRoutes.post(
  '/reenviar-codigo',
  validar(reenviarCodigoSchema),
  reenviarCodigo,
)
