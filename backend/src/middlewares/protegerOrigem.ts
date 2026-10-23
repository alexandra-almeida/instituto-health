import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ErroDeNegocio } from '../lib/erros.js'

interface Configuracao {
  producao: boolean
  origensPermitidas: string[]
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Em desenvolvimento o navegador envia Origin de localhost (site no Vite);
// não faz sentido exigir isso na configuração local
const ORIGEM_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

// "a, b/," vira ['a', 'b']: sem espaços, sem barra final, em minúsculas
export function listarOrigens(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((origem) => origem.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean)
}

// Proteção contra CSRF (plano, seção 3) nas rotas que alteram dados: confere o
// cabeçalho Origin contra ORIGEM_FRONTEND e só aceita corpo JSON. Em produção
// FALHA FECHADO: sem Origin, com Origin fora da lista ou com a lista vazia, a
// requisição é recusada. Os valores nunca vão para log nem para a resposta.
export function criarProtegerOrigem({
  producao,
  origensPermitidas,
}: Configuracao): RequestHandler {
  if (producao && origensPermitidas.length === 0) {
    console.warn(
      'ORIGEM_FRONTEND não configurada: as requisições que alteram dados estão sendo recusadas',
    )
  }

  return (req, _res, next) => {
    if (METODOS_SEGUROS.has(req.method)) {
      next()
      return
    }

    const origem = req.get('origin')?.trim().toLowerCase()
    let permitida: boolean
    if (origem === undefined) {
      // curl, testes e chamadas servidor a servidor não enviam Origin
      permitida = !producao
    } else if (origensPermitidas.includes(origem)) {
      permitida = true
    } else {
      permitida = !producao && ORIGEM_LOCAL.test(origem)
    }
    if (!permitida) {
      next(
        new ErroDeNegocio('origem_nao_permitida', 'Origem não permitida.', 403),
      )
      return
    }

    // Só confere o tipo quando há corpo de verdade: POST sem corpo (como o
    // logout) chega com Content-Length 0 e não deve ser recusado
    const temCorpo =
      Number(req.get('content-length') ?? 0) > 0 ||
      req.get('transfer-encoding') !== undefined
    if (temCorpo && !req.is('json')) {
      next(
        new ErroDeNegocio(
          'tipo_nao_suportado',
          'Formato de dados não aceito.',
          415,
        ),
      )
      return
    }
    next()
  }
}

export const protegerOrigem = criarProtegerOrigem({
  producao: env.NODE_ENV === 'production',
  origensPermitidas: listarOrigens(env.ORIGEM_FRONTEND),
})
