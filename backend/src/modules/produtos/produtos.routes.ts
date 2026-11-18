import { Router } from 'express'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirProfissionalAprovado } from '../../middlewares/exigirProfissionalAprovado.js'
import { validarEntrada } from '../../middlewares/validar.js'
import { precosParaProfissional } from './produtos.controller.js'
import { consultaDePrecosSchema } from './produtos.schemas.js'

export const produtosRoutes = Router()

// Preços confidenciais (preço cheio dos exclusivos e o preço com desconto) só
// para profissional APROVADO, conferido no banco a cada chamada. Resposta
// privada e nunca em cache (proxy, CDN ou navegador).
produtosRoutes.get(
  '/precos-profissionais',
  (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    next()
  },
  autenticar,
  exigirProfissionalAprovado,
  validarEntrada(consultaDePrecosSchema, 'query'),
  precosParaProfissional,
)
