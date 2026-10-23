import { Router } from 'express'
import { autenticar } from '../../middlewares/autenticar.js'
import { protegerOrigem } from '../../middlewares/protegerOrigem.js'
import { validar } from '../../middlewares/validar.js'
import {
  cadastrar,
  confirmarEmail,
  esqueciSenha,
  eu,
  login,
  logout,
  redefinirSenha,
  reenviarCodigo,
} from './auth.controller.js'
import {
  cadastroSchema,
  confirmarEmailSchema,
  esqueciSenhaSchema,
  loginSchema,
  redefinirSenhaSchema,
  reenviarCodigoSchema,
} from './auth.schemas.js'

export const authRoutes = Router()

// Vale para todo POST deste módulo, inclusive os que forem criados depois
authRoutes.use(protegerOrigem)

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
authRoutes.post('/login', validar(loginSchema), login)
authRoutes.post('/logout', logout)
authRoutes.get('/eu', autenticar, eu)
authRoutes.post('/esqueci-senha', validar(esqueciSenhaSchema), esqueciSenha)
authRoutes.post(
  '/redefinir-senha',
  validar(redefinirSenhaSchema),
  redefinirSenha,
)
