import type { RequestHandler } from 'express'
import type { CotacaoEntrada } from './frete.schemas.js'
import { freteService } from './frete.service.js'

// Corpo já validado (e limpo) pelo middleware `validar`. Sessão não é exigida:
// visitante compra sem cadastro.
export const cotar: RequestHandler = async (req, res) => {
  const { cep, itens } = req.body as CotacaoEntrada
  res.json(await freteService.cotar(cep, itens))
}
