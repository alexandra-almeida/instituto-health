import { createHmac } from 'node:crypto'
import type { Request, RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ErroDeNegocio } from '../lib/erros.js'
import {
  limitesRepository,
  type LimitesRepository,
} from '../repositories/limites.repository.js'

// IP do cliente. Na Vercel o primeiro valor de x-forwarded-for é o IP de quem
// chamou (a plataforma preenche e sobrescreve o que o cliente mandar); fora dela
// cai no endereço da conexão. Nada daqui é guardado em claro: vira hash.
export function ipDoCliente(req: Request): string {
  const encaminhado = req.headers['x-forwarded-for']
  const cru = Array.isArray(encaminhado) ? encaminhado[0] : encaminhado
  const primeiro = cru?.split(',')[0]?.trim()
  return primeiro || req.socket.remoteAddress || 'desconhecido'
}

// HMAC com um segredo do servidor, para o hash do IP não ser desfeito por
// tabela de IPs. A chave do Supabase já existe só no backend; trocá-la apenas
// zera os contadores.
export function chaveDoLimite(
  rota: string,
  ip: string,
  segredo: string,
): string {
  return createHmac('sha256', segredo)
    .update(`${rota}|${ip}`)
    .digest('hex')
    .slice(0, 40)
}

interface Configuracao {
  /** nome da rota (parte da chave: cada rota tem o seu contador) */
  rota: string
  limite: number
  janelaSegundos: number
}

interface Dependencias {
  limites: Pick<LimitesRepository, 'registrar'>
  segredo: string
}

// Limite de tentativas por IP e rota. Passou do limite: 429 com Retry-After. Se o
// banco falhar, a requisição SEGUE e vai um aviso ao log (sem IP): o limitador
// nunca derruba a venda.
export function criarLimitarTentativas(
  { rota, limite, janelaSegundos }: Configuracao,
  { limites, segredo }: Dependencias,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const chave = chaveDoLimite(rota, ipDoCliente(req), segredo)
      const resultado = await limites.registrar(chave, limite, janelaSegundos)
      if (resultado.excedeu) {
        res.set('Retry-After', String(resultado.esperaSegundos))
        next(
          new ErroDeNegocio(
            'muitas_tentativas',
            'Muitas tentativas em pouco tempo. Tente de novo em alguns minutos.',
            429,
          ),
        )
        return
      }
    } catch {
      console.warn(
        `Limite de tentativas (${rota}): falha no banco, requisição liberada`,
      )
    }
    next()
  }
}

// Limites iniciais (ajustáveis; plano, "Limite de tentativas por IP")
const DEZ_MINUTOS = 600

export const limitarCotacao = criarLimitarTentativas(
  { rota: 'cotacao', limite: 20, janelaSegundos: DEZ_MINUTOS },
  { limites: limitesRepository, segredo: env.SUPABASE_SECRET_KEY },
)

export const limitarCriacaoDePedido = criarLimitarTentativas(
  { rota: 'pedido', limite: 5, janelaSegundos: DEZ_MINUTOS },
  { limites: limitesRepository, segredo: env.SUPABASE_SECRET_KEY },
)
