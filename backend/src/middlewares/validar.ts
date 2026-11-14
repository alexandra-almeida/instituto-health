import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { ErroDeNegocio } from '../lib/erros.js'

// Valida o corpo com zod e troca req.body pelo resultado já limpo: campos
// que o esquema não declara (como status, tipo ou is_admin) são descartados
// aqui, antes de chegar ao controller.
export function validar(esquema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req.body)
    if (!resultado.success) {
      // Só a primeira mensagem, já em português, sem ecoar o valor enviado
      const mensagem = resultado.error.issues[0]?.message ?? 'Dados inválidos.'
      next(new ErroDeNegocio('dados_invalidos', mensagem))
      return
    }
    req.body = resultado.data
    next()
  }
}

// Valida a query string ou os parâmetros da rota e deixa o resultado já limpo
// (e com os padrões aplicados) em `res.locals`. Não troca req.query: no
// Express 5 ele é somente leitura.
export function validarEntrada(
  esquema: ZodType,
  de: 'query' | 'params',
): RequestHandler {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[de])
    if (!resultado.success) {
      const mensagem = resultado.error.issues[0]?.message ?? 'Dados inválidos.'
      next(new ErroDeNegocio('dados_invalidos', mensagem))
      return
    }
    res.locals[de] = resultado.data
    next()
  }
}
