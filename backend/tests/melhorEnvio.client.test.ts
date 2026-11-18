import { describe, expect, it, vi } from 'vitest'
import {
  criarMelhorEnvioClient,
  ErroDoMelhorEnvio,
  OPERACOES,
  USER_AGENT,
} from '../src/lib/melhorEnvio.client.js'

const TOKEN = 'token-secreto-do-teste-123'
const volume = {
  alturaCm: 10,
  larguraCm: 15,
  comprimentoCm: 20,
  pesoKg: 0.5,
  valorSegurado: 100,
}
const entrada = {
  cepOrigem: '14840000',
  cepDestino: '13500000',
  volumes: [volume],
}

const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function cliente(
  fetchFalso: typeof fetch,
  ambiente: 'sandbox' | 'producao' = 'sandbox',
) {
  return criarMelhorEnvioClient({
    token: TOKEN,
    ambiente,
    fetchImpl: fetchFalso,
  })
}

const PAC = {
  id: 1,
  name: 'PAC',
  price: '37.79',
  custom_price: '39.50',
  delivery_time: 9,
  delivery_range: { min: 8, max: 9 },
  custom_delivery_time: 10,
  custom_delivery_range: { min: 9, max: 10 },
  company: { id: 1, name: 'Correios' },
}

describe('chamada', () => {
  it('manda o User-Agent exato, o token, o corpo em cm, kg e reais e só a rota de cotação', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(resposta([PAC]))

    await cliente(fetchFalso as unknown as typeof fetch).calcular(entrada)

    const [url, init] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
    )
    expect(init.method).toBe('POST')
    const cabecalhos = init.headers as Record<string, string>
    expect(cabecalhos['User-Agent']).toBe(USER_AGENT)
    expect(USER_AGENT).toBe('Instituto Health (contato@healthinstituto.com.br)')
    expect(cabecalhos.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(cabecalhos.Accept).toBe('application/json')
    expect(cabecalhos['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({
      from: { postal_code: '14840000' },
      to: { postal_code: '13500000' },
      volumes: [
        { height: 10, width: 15, length: 20, weight: 0.5, insurance: 100 },
      ],
      options: { receipt: false, own_hand: false },
    })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('produção usa o endereço de produção', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(resposta([]))
    await cliente(fetchFalso as unknown as typeof fetch, 'producao').calcular(
      entrada,
    )
    expect(fetchFalso.mock.calls[0]![0]).toBe(
      'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
    )
  })

  it('a lista de operações é FECHADA: só cotação, nada de checkout, geração ou impressão', () => {
    expect(Object.keys(OPERACOES)).toEqual(['calcular'])
    const caminhos = Object.values(OPERACOES).map((o) => o.caminho)
    for (const caminho of caminhos) {
      expect(caminho).not.toMatch(/checkout|generate|print/)
    }
  })
})

describe('resposta', () => {
  it('usa custom_price e custom_delivery_range, e devolve o preço em centavos', async () => {
    const r = await cliente(
      vi.fn().mockResolvedValue(resposta([PAC])) as unknown as typeof fetch,
    ).calcular(entrada)
    expect(r).toEqual([
      {
        servicoId: 1,
        servico: 'PAC',
        transportadora: 'Correios',
        precoEmCentavos: 3950,
        prazoMinDias: 9,
        prazoMaxDias: 10,
      },
    ])
  })

  it('sem custom_*: cai para price e delivery_range; sem faixa: delivery_time', async () => {
    const sedex = {
      id: 2,
      name: 'SEDEX',
      price: '46.23',
      delivery_time: 4,
      company: { name: 'Correios' },
    }
    const pacSemCustom = {
      id: 1,
      name: 'PAC',
      price: '37.79',
      delivery_range: { min: 8, max: 9 },
      company: { name: 'Correios' },
    }
    const r = await cliente(
      vi
        .fn()
        .mockResolvedValue(
          resposta([pacSemCustom, sedex]),
        ) as unknown as typeof fetch,
    ).calcular(entrada)
    expect(
      r.map((o) => [o.precoEmCentavos, o.prazoMinDias, o.prazoMaxDias]),
    ).toEqual([
      [3779, 8, 9],
      [4623, 4, 4],
    ])
  })

  it('descarta serviço com erro, sem preço, com preço zero ou sem prazo', async () => {
    const r = await cliente(
      vi
        .fn()
        .mockResolvedValue(
          resposta([
            PAC,
            {
              id: 3,
              name: 'Com erro',
              error: 'Serviço indisponível',
              price: '10.00',
              delivery_time: 5,
            },
            { id: 4, name: 'Sem preço', delivery_time: 5 },
            { id: 5, name: 'Preço zero', price: '0.00', delivery_time: 5 },
            { id: 6, name: 'Sem prazo', price: '10.00' },
            'lixo',
          ]),
        ) as unknown as typeof fetch,
    ).calcular(entrada)
    expect(r.map((o) => o.servicoId)).toEqual([1])
  })

  it('resposta que não é uma lista: resposta_invalida', async () => {
    const erro = await cliente(
      vi
        .fn()
        .mockResolvedValue(
          resposta({ message: 'x' }),
        ) as unknown as typeof fetch,
    )
      .calcular(entrada)
      .catch((e: unknown) => e)
    expect((erro as ErroDoMelhorEnvio).codigo).toBe('resposta_invalida')
  })
})

describe('erros', () => {
  const casos: Array<[string, number, string]> = [
    ['401', 401, 'token_invalido'],
    ['403', 403, 'token_invalido'],
    ['429', 429, 'limite_de_uso'],
    ['400', 400, 'entrada_invalida'],
    ['422', 422, 'entrada_invalida'],
    ['500', 500, 'indisponivel'],
    ['503', 503, 'indisponivel'],
  ]
  it.each(casos)('HTTP %s vira %s', async (_nome, status, codigo) => {
    const fetchFalso = vi
      .fn()
      .mockResolvedValue(
        resposta({ message: 'detalhe com Rua Secreta 10' }, status),
      )
    const erro = await cliente(fetchFalso as unknown as typeof fetch)
      .calcular(entrada)
      .catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroDoMelhorEnvio)
    expect((erro as ErroDoMelhorEnvio).codigo).toBe(codigo)
    // a mensagem nunca traz o corpo da resposta nem o token
    expect((erro as Error).message).not.toMatch(/Rua Secreta|detalhe/)
    expect((erro as Error).message).not.toContain(TOKEN)
  })

  it('falha de rede e tempo esgotado: indisponivel, sem o erro original', async () => {
    const fetchFalso = vi
      .fn()
      .mockRejectedValue(new Error(`falhou com ${TOKEN}`))
    const erro = await cliente(fetchFalso as unknown as typeof fetch)
      .calcular(entrada)
      .catch((e: unknown) => e)
    expect((erro as ErroDoMelhorEnvio).codigo).toBe('indisponivel')
    expect((erro as Error).message).not.toContain(TOKEN)
  })

  it('o tempo limite de verdade interrompe a chamada', async () => {
    const lento = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, rejeitar) => {
          init.signal?.addEventListener('abort', () =>
            rejeitar(new Error('abortado')),
          )
        }),
    )
    const c = criarMelhorEnvioClient({
      token: TOKEN,
      ambiente: 'sandbox',
      fetchImpl: lento as unknown as typeof fetch,
      tempoLimiteEmMs: 20,
    })
    const erro = await c.calcular(entrada).catch((e: unknown) => e)
    expect((erro as ErroDoMelhorEnvio).codigo).toBe('indisponivel')
  })

  it('corpo que não é JSON: resposta_invalida', async () => {
    const fetchFalso = vi
      .fn()
      .mockResolvedValue(new Response('<html>', { status: 200 }))
    const erro = await cliente(fetchFalso as unknown as typeof fetch)
      .calcular(entrada)
      .catch((e: unknown) => e)
    expect((erro as ErroDoMelhorEnvio).codigo).toBe('resposta_invalida')
  })

  it('não repete a chamada sozinho', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(resposta({}, 500))
    await cliente(fetchFalso as unknown as typeof fetch)
      .calcular(entrada)
      .catch(() => {})
    expect(fetchFalso).toHaveBeenCalledTimes(1)
  })
})
