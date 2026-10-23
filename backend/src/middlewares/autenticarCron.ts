import { createHash, timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ErroDeNegocio } from '../lib/erros.js'

const PREFIXO = 'Bearer '

// Hash dos dois lados: deixa os buffers com o mesmo tamanho (o
// timingSafeEqual exige) sem revelar o tamanho do segredo
function hash(valor: string) {
  return createHash('sha256').update(valor).digest()
}

// Protege as rotas chamadas pelo Cron da Vercel, que envia
// `Authorization: Bearer <CRON_SECRET>`. A comparação leva o mesmo tempo
// qualquer que seja o valor enviado. Sem CRON_SECRET configurada, a rota
// responde 401 sempre (nunca fica aberta); a API em si sobe normalmente.
// O valor do segredo nunca vai para log nem para a resposta.
export function criarAutenticarCron(
  segredo: string | undefined,
): RequestHandler {
  return (req, _res, next) => {
    const negado = () =>
      next(new ErroDeNegocio('nao_autorizado', 'Acesso negado.', 401))

    if (!segredo) {
      console.warn(
        'CRON_SECRET não configurada: a rota do cron está respondendo 401',
      )
      negado()
      return
    }

    const cabecalho = req.get('authorization') ?? ''
    if (!cabecalho.startsWith(PREFIXO)) {
      negado()
      return
    }
    const enviado = cabecalho.slice(PREFIXO.length)
    if (!timingSafeEqual(hash(enviado), hash(segredo))) {
      negado()
      return
    }
    next()
  }
}

export const autenticarCron = criarAutenticarCron(env.CRON_SECRET)
