// Único ponto do backend que fala com o Melhor Envio (plano, seção "Frete").
//
// Segurança:
//  - Lista FECHADA de operações (OPERACOES). Hoje só existe a cotação
//    (`shipping-calculate`). O token do site também tem cart-read, cart-write,
//    orders-read e shipping-tracking, mas NÃO tem shipping-checkout,
//    shipping-generate nem shipping-print: o site nunca paga nem gera etiqueta.
//    Operações novas (carrinho, rastreio) entram aqui, uma a uma, com teste.
//  - O token nunca é registrado: nem em log, nem em erro, nem na resposta. As
//    mensagens de erro não trazem o corpo da resposta (pode ter endereço).
//  - Tempo limite de 8 s; sem repetição automática.
//  - O cabeçalho User-Agent com o nome da aplicação e um e-mail de contato
//    técnico é OBRIGATÓRIO na API do Melhor Envio.

export const USER_AGENT = 'Instituto Health (contato@healthinstituto.com.br)'

const BASES = {
  sandbox: 'https://sandbox.melhorenvio.com.br',
  producao: 'https://melhorenvio.com.br',
} as const

export type AmbienteDoMelhorEnvio = keyof typeof BASES

export const OPERACOES = {
  calcular: { metodo: 'POST', caminho: '/api/v2/me/shipment/calculate' },
} as const

export type CodigoDeErroDoMelhorEnvio =
  | 'token_invalido'
  | 'limite_de_uso'
  | 'entrada_invalida'
  | 'indisponivel'
  | 'resposta_invalida'

// Erro técnico do cliente; o service decide o que mostrar ao cliente da loja
export class ErroDoMelhorEnvio extends Error {
  readonly codigo: CodigoDeErroDoMelhorEnvio
  /**
   * Só o campo `message` da resposta de erro (texto de validação do Melhor
   * Envio), curto e com números longos mascarados (CEP, documento). Serve para
   * diagnosticar um 400/422 nos logs; nunca é mostrado ao cliente da loja.
   */
  readonly detalhe?: string

  constructor(codigo: CodigoDeErroDoMelhorEnvio, detalhe?: string) {
    super(`Melhor Envio: ${codigo}`)
    this.name = 'ErroDoMelhorEnvio'
    this.codigo = codigo
    this.detalhe = detalhe
  }
}

export interface VolumeParaCotar {
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  pesoKg: number
  /** valor segurado do volume, em reais */
  valorSegurado: number
}

export interface OpcaoDoMelhorEnvio {
  servicoId: number
  servico: string
  transportadora: string
  precoEmCentavos: number
  prazoMinDias: number
  prazoMaxDias: number
}

export interface MelhorEnvioClient {
  calcular(entrada: {
    cepOrigem: string
    cepDestino: string
    volumes: VolumeParaCotar[]
  }): Promise<OpcaoDoMelhorEnvio[]>
}

interface Configuracao {
  token: string
  ambiente: AmbienteDoMelhorEnvio
  fetchImpl?: typeof fetch
  tempoLimiteEmMs?: number
}

const TEMPO_LIMITE_PADRAO_EM_MS = 8000

type Cru = Record<string, unknown>
const objeto = (valor: unknown): Cru | null =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Cru)
    : null
const numeroOuNulo = (valor: unknown): number | null => {
  const n = typeof valor === 'string' ? Number(valor) : valor
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

// Uma opção devolvida pelo Melhor Envio. Usa os campos `custom_*` (a
// documentação recomenda: trazem os acréscimos de preço e de prazo que a Bia
// configurar no painel). Serviço com erro ou sem preço é descartado.
function lerOpcao(bruto: unknown): OpcaoDoMelhorEnvio | null {
  const s = objeto(bruto)
  if (!s || s.error) return null
  const id = numeroOuNulo(s.id)
  const preco = numeroOuNulo(s.custom_price) ?? numeroOuNulo(s.price)
  if (id === null || preco === null || preco <= 0) return null

  const faixa = objeto(s.custom_delivery_range) ?? objeto(s.delivery_range)
  const unico =
    numeroOuNulo(s.custom_delivery_time) ?? numeroOuNulo(s.delivery_time)
  const min = numeroOuNulo(faixa?.min) ?? unico
  const max = numeroOuNulo(faixa?.max) ?? unico
  if (min === null || max === null) return null

  const empresa = objeto(s.company)
  return {
    servicoId: id,
    servico: typeof s.name === 'string' ? s.name : `Serviço ${id}`,
    transportadora:
      typeof empresa?.name === 'string' ? empresa.name : 'Transportadora',
    precoEmCentavos: Math.round(preco * 100),
    prazoMinDias: Math.max(0, Math.round(min)),
    prazoMaxDias: Math.max(0, Math.round(max)),
  }
}

// Só a mensagem curta de validação (sem o objeto `errors`, que pode repetir o
// que enviamos), com sequências de 5 ou mais dígitos mascaradas
async function mensagemDeValidacao(
  resposta: Response,
): Promise<string | undefined> {
  try {
    const corpo: unknown = await resposta.json()
    const mensagem = objeto(corpo)?.message
    if (typeof mensagem !== 'string') return undefined
    return mensagem.replace(/\d{5,}/g, '#').slice(0, 160)
  } catch {
    return undefined
  }
}

export function criarMelhorEnvioClient({
  token,
  ambiente,
  fetchImpl = fetch,
  tempoLimiteEmMs = TEMPO_LIMITE_PADRAO_EM_MS,
}: Configuracao): MelhorEnvioClient {
  async function chamar(
    operacao: keyof typeof OPERACOES,
    corpo: unknown,
  ): Promise<unknown> {
    const { metodo, caminho } = OPERACOES[operacao]
    let resposta: Response
    try {
      resposta = await fetchImpl(`${BASES[ambiente]}${caminho}`, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(tempoLimiteEmMs),
      })
    } catch {
      // tempo esgotado ou falha de rede: nada do erro original é guardado
      throw new ErroDoMelhorEnvio('indisponivel')
    }

    if (resposta.status === 401 || resposta.status === 403) {
      throw new ErroDoMelhorEnvio('token_invalido')
    }
    if (resposta.status === 429) throw new ErroDoMelhorEnvio('limite_de_uso')
    if (resposta.status === 400 || resposta.status === 422) {
      throw new ErroDoMelhorEnvio(
        'entrada_invalida',
        await mensagemDeValidacao(resposta),
      )
    }
    if (!resposta.ok) throw new ErroDoMelhorEnvio('indisponivel')
    try {
      return await resposta.json()
    } catch {
      throw new ErroDoMelhorEnvio('resposta_invalida')
    }
  }

  return {
    async calcular({ cepOrigem, cepDestino, volumes }) {
      const resposta = await chamar('calcular', {
        from: { postal_code: cepOrigem },
        to: { postal_code: cepDestino },
        volumes: volumes.map((v) => ({
          height: v.alturaCm,
          width: v.larguraCm,
          length: v.comprimentoCm,
          weight: v.pesoKg,
          insurance: v.valorSegurado,
        })),
        options: { receipt: false, own_hand: false },
      })
      if (!Array.isArray(resposta)) {
        throw new ErroDoMelhorEnvio('resposta_invalida')
      }
      return resposta
        .map(lerOpcao)
        .filter((o): o is OpcaoDoMelhorEnvio => o !== null)
    },
  }
}
