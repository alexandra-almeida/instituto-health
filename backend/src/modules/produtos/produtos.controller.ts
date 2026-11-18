import type { RequestHandler } from 'express'
import type { ConsultaDePrecosEntrada } from './produtos.schemas.js'
import { produtosService } from './produtos.service.js'

// A query já passou pelo middleware `validarEntrada` (resultado em res.locals)
export const precosParaProfissional: RequestHandler = async (_req, res) => {
  const { skus } = res.locals.query as ConsultaDePrecosEntrada
  res.json(await produtosService.precosParaProfissional(skus))
}
