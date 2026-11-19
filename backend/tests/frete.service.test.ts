import { describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'
import {
  ErroDoMelhorEnvio,
  type MelhorEnvioClient,
  type OpcaoDoMelhorEnvio,
} from '../src/lib/melhorEnvio.client.js'
import { criarFreteService } from '../src/modules/frete/frete.service.js'

const base = { tamanho: '50ml', ativo: true, exclusivo_profissional: false }
const NIACINE = {
  ...base,
  sku: 'niacine-7',
  nome: 'Niacine+ Sérum',
  preco: '149.00',
  preco_cheio: null,
}
const EXCLUSIVO = {
  ...base,
  sku: 'exclusivo-9',
  nome: 'Máscara Exclusiva',
  preco: null,
  preco_cheio: '200.00',
  exclusivo_profissional: true,
}
const GALAO = {
  ...base,
  sku: 'desc-cloro-gel-5-l-32',
  nome: 'Cloro Gel 5 L',
  preco: '36.79',
  preco_cheio: null,
}

const PAC: OpcaoDoMelhorEnvio = {
  servicoId: 1,
  servico: 'PAC',
  transportadora: 'Correios',
  precoEmCentavos: 3950,
  prazoMinDias: 9,
  prazoMaxDias: 10,
}
const SEDEX: OpcaoDoMelhorEnvio = {
  servicoId: 2,
  servico: 'SEDEX',
  transportadora: 'Correios',
  precoEmCentavos: 1189,
  prazoMinDias: 2,
  prazoMaxDias: 3,
}

const logistica = (sku: string, peso_g: number, extra = {}) => ({
  sku,
  peso_g,
  liquido: false,
  so_retirada: false,
  ...extra,
})

function montar(
  opcoes: {
    catalogo?: unknown[]
    pesos?: unknown[]
    melhorEnvio?: MelhorEnvioClient | null
  } = {},
) {
  const produtos = {
    buscarParaPedido: vi
      .fn()
      .mockResolvedValue(opcoes.catalogo ?? [NIACINE, EXCLUSIVO, GALAO]),
  }
  const repoLogistica = {
    buscarPorSkus: vi
      .fn()
      .mockResolvedValue(
        opcoes.pesos ?? [
          logistica('niacine-7', 91),
          logistica('exclusivo-9', 630),
          logistica('desc-cloro-gel-5-l-32', 5300, { liquido: true }),
        ],
      ),
  }
  const calcular = vi.fn().mockResolvedValue([PAC, SEDEX])
  const melhorEnvio =
    opcoes.melhorEnvio === undefined ? { calcular } : opcoes.melhorEnvio
  const servico = criarFreteService({
    produtos: produtos as never,
    logistica: repoLogistica as never,
    melhorEnvio,
    cepDeOrigem: '14830021',
  })
  return { servico, produtos, repoLogistica, calcular }
}

const itens = (...l: Array<[string, number]>) =>
  l.map(([sku, quantidade]) => ({ sku, quantidade }))

describe('cotar', () => {
  it('devolve as opções por preço crescente, com 1 dia útil de postagem e a retirada', async () => {
    const { servico } = montar()
    const r = await servico.cotar('13500000', itens(['niacine-7', 1]))
    expect(r.opcoes).toEqual([
      {
        servicoId: 2,
        servico: 'SEDEX',
        transportadora: 'Correios',
        preco: 11.89,
        prazoMinDias: 3,
        prazoMaxDias: 4,
        volumes: 1,
      },
      {
        servicoId: 1,
        servico: 'PAC',
        transportadora: 'Correios',
        preco: 39.5,
        prazoMinDias: 10,
        prazoMaxDias: 11,
        volumes: 1,
      },
    ])
    expect(r.retirada).toEqual({
      disponivel: true,
      rotulo: 'Retirar na clínica (Rincão, SP)',
      endereco: 'Rua 15 de Novembro, 464, Centro, Rincão, SP, CEP 14830-021',
    })
    expect(r).toMatchObject({
      soRetirada: false,
      motivoSoRetirada: null,
      freteIndisponivel: false,
      semServicoParaOCep: false,
    })
  })

  it('monta o volume pelo peso do banco e manda CEP de origem, destino e seguro ao Melhor Envio', async () => {
    const { servico, calcular } = montar()
    await servico.cotar('13500000', itens(['niacine-7', 2]))
    expect(calcular).toHaveBeenCalledTimes(1)
    const entrada = calcular.mock.calls[0]![0]
    expect(entrada.cepOrigem).toBe('14830021')
    expect(entrada.cepDestino).toBe('13500000')
    expect(entrada.volumes).toHaveLength(1)
    // 2 x 91 g + 100 g da caixa pequena = 282 g
    expect(entrada.volumes[0].pesoKg).toBeCloseTo(0.282, 5)
    // seguro: 2 x R$ 149,00
    expect(entrada.volumes[0].valorSegurado).toBe(298)
  })

  it('o mesmo sku repetido vira uma linha só', async () => {
    const { servico, produtos, calcular } = montar()
    await servico.cotar('13500000', itens(['niacine-7', 1], ['niacine-7', 2]))
    expect(produtos.buscarParaPedido).toHaveBeenCalledWith(['niacine-7'])
    expect(calcular.mock.calls[0]![0].volumes[0].pesoKg).toBeCloseTo(
      (3 * 91 + 100) / 1000,
      5,
    )
  })

  it('descartável pesado (líquido) também é enviado: nada de só retirada', async () => {
    const { servico, calcular } = montar()
    const r = await servico.cotar(
      '13500000',
      itens(['desc-cloro-gel-5-l-32', 1]),
    )
    expect(r.soRetirada).toBe(false)
    expect(r.opcoes.length).toBeGreaterThan(0)
    expect(calcular).toHaveBeenCalledTimes(1)
    expect(calcular.mock.calls[0]![0].volumes[0].pesoKg).toBeCloseTo(5.7, 5)
  })

  it('vários volumes quando passa da caixa grande, e o seguro é repartido pelo peso', async () => {
    const { servico, calcular } = montar()
    const r = await servico.cotar(
      '13500000',
      itens(['desc-cloro-gel-5-l-32', 2]),
    )
    expect(r.opcoes[0]!.volumes).toBe(2)
    const volumes = calcular.mock.calls[0]![0].volumes
    expect(volumes).toHaveLength(2)
    expect(volumes[0].valorSegurado + volumes[1].valorSegurado).toBeCloseTo(
      73.58,
      2,
    )
  })

  it('exclusivo usa o preço cheio só no seguro: o valor nunca aparece na resposta', async () => {
    const { servico, calcular } = montar()
    const r = await servico.cotar('13500000', itens(['exclusivo-9', 1]))
    expect(calcular.mock.calls[0]![0].volumes[0].valorSegurado).toBe(200)
    expect(JSON.stringify(r)).not.toMatch(/200|seguro|valorSegurado/)
  })

  it('a válvula so_retirada ligada: só retirada, sem chamar o Melhor Envio', async () => {
    const { servico, calcular } = montar({
      pesos: [logistica('niacine-7', 91, { so_retirada: true })],
    })
    const r = await servico.cotar('13500000', itens(['niacine-7', 1]))
    expect(r).toMatchObject({ soRetirada: true, opcoes: [] })
    expect(r.motivoSoRetirada).toMatch(/só pode ser retirado/)
    expect(calcular).not.toHaveBeenCalled()
  })

  it('sem token (sem cliente): só a retirada e freteIndisponivel', async () => {
    const { servico } = montar({ melhorEnvio: null })
    const r = await servico.cotar('13500000', itens(['niacine-7', 1]))
    expect(r).toMatchObject({
      opcoes: [],
      freteIndisponivel: true,
      soRetirada: false,
    })
    expect(r.retirada.disponivel).toBe(true)
  })

  it('o Melhor Envio fora do ar ou com token inválido: 200 com só a retirada (sem vazar nada)', async () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const codigo of [
      'indisponivel',
      'token_invalido',
      'limite_de_uso',
      'resposta_invalida',
    ] as const) {
      const { servico } = montar({
        melhorEnvio: {
          calcular: vi.fn().mockRejectedValue(new ErroDoMelhorEnvio(codigo)),
        },
      })
      const r = await servico.cotar('13500000', itens(['niacine-7', 1]))
      expect(r).toMatchObject({ opcoes: [], freteIndisponivel: true })
    }
    // só o código vai para o log
    expect(erro.mock.calls.flat().join(' ')).toMatch(/token_invalido/)
    expect(erro.mock.calls.flat().join(' ')).not.toMatch(/Bearer|13500000/)
    erro.mockRestore()
  })

  it('CEP que o Melhor Envio recusa: 422 cep_invalido', async () => {
    const { servico } = montar({
      melhorEnvio: {
        calcular: vi
          .fn()
          .mockRejectedValue(new ErroDoMelhorEnvio('entrada_invalida')),
      },
    })
    const e = await servico
      .cotar('00000000', itens(['niacine-7', 1]))
      .catch((x: unknown) => x)
    expect(e).toBeInstanceOf(ErroDeNegocio)
    expect((e as ErroDeNegocio).codigo).toBe('cep_invalido')
    expect((e as ErroDeNegocio).status).toBe(422)
  })

  it('nenhum serviço atende o CEP: opcoes vazias e semServicoParaOCep (só a retirada)', async () => {
    const { servico } = montar({
      melhorEnvio: { calcular: vi.fn().mockResolvedValue([]) },
    })
    const r = await servico.cotar('13500000', itens(['niacine-7', 1]))
    expect(r).toMatchObject({
      opcoes: [],
      semServicoParaOCep: true,
      freteIndisponivel: false,
    })
  })

  it.each([
    [
      'produto desconhecido',
      { catalogo: [NIACINE] },
      itens(['nao-existe-1', 1]),
      'produto_indisponivel',
    ],
    [
      'produto inativo',
      { catalogo: [{ ...NIACINE, ativo: false }] },
      itens(['niacine-7', 1]),
      'produto_indisponivel',
    ],
    [
      'produto sem peso cadastrado',
      { pesos: [] },
      itens(['niacine-7', 1]),
      'produto_sem_peso',
    ],
    [
      'quantidade somada acima de 99',
      {},
      itens(['niacine-7', 60], ['niacine-7', 60]),
      'quantidade_invalida',
    ],
  ])(
    '%s: 422 e o Melhor Envio não é chamado',
    async (_nome, opcoes, entrada, codigo) => {
      const { servico, calcular } = montar(opcoes)
      const e = await servico
        .cotar('13500000', entrada)
        .catch((x: unknown) => x)
      expect(e).toBeInstanceOf(ErroDeNegocio)
      expect((e as ErroDeNegocio).codigo).toBe(codigo)
      expect(calcular).not.toHaveBeenCalled()
    },
  )

  it('item grande demais para a maior caixa: 422', async () => {
    const { servico } = montar({ pesos: [logistica('niacine-7', 9000)] })
    const e = await servico
      .cotar('13500000', itens(['niacine-7', 1]))
      .catch((x: unknown) => x)
    expect((e as ErroDeNegocio).codigo).toBe('item_grande_demais')
  })
})

describe('cotarServicoEscolhido (usado pelo pedido)', () => {
  const entrada = {
    cep: '13500000',
    servicoId: 1,
    itens: itens(['niacine-7', 1]),
  }

  it('devolve o serviço escolhido com o preço e o prazo DO SERVIDOR', async () => {
    const { servico } = montar()
    expect(await servico.cotarServicoEscolhido(entrada)).toEqual({
      servicoNome: 'Correios PAC',
      precoEmCentavos: 3950,
      prazoMinDias: 10,
      prazoMaxDias: 11,
    })
  })

  it('serviço que sumiu da cotação: 409 frete_mudou', async () => {
    const { servico } = montar()
    const e = await servico
      .cotarServicoEscolhido({ ...entrada, servicoId: 99 })
      .catch((x: unknown) => x)
    expect((e as ErroDeNegocio).codigo).toBe('frete_mudou')
    expect((e as ErroDeNegocio).status).toBe(409)
  })

  it('sem Melhor Envio: 503 frete_indisponivel; válvula ligada: 422 so_retirada', async () => {
    const sem = montar({ melhorEnvio: null })
    const e1 = await sem.servico
      .cotarServicoEscolhido(entrada)
      .catch((x: unknown) => x)
    expect((e1 as ErroDeNegocio).status).toBe(503)
    const valvula = montar({
      pesos: [logistica('niacine-7', 91, { so_retirada: true })],
    })
    const e2 = await valvula.servico
      .cotarServicoEscolhido(entrada)
      .catch((x: unknown) => x)
    expect((e2 as ErroDeNegocio).codigo).toBe('so_retirada')
  })
})
