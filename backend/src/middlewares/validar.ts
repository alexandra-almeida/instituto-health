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
