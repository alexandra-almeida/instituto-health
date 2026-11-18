import { env } from '../../config/env.js'
import { ErroDeNegocio } from '../../lib/erros.js'
import {
  criarMelhorEnvioClient,
  ErroDoMelhorEnvio,
  type MelhorEnvioClient,
  type VolumeParaCotar,
} from '../../lib/melhorEnvio.client.js'
import { emReais, precoCheioEmCentavos } from '../../lib/preco.js'
import {
  logisticaRepository,
  type LogisticaRepository,
} from '../../repositories/logistica.repository.js'
import {
  produtosRepository,
  type ProdutosRepository,
} from '../../repositories/produtos.repository.js'
import type { CotadorDeFrete, FreteCotado } from '../pedidos/entrega.js'
import {
  CEP_DE_ORIGEM_PROVISORIO,
  ROTULO_DA_OPCAO_DE_RETIRADA,
} from './clinica.js'
import { empacotar } from './embalagem.js'
import { skusSoComRetirada, somarDiaDePostagem } from './regras.js'

export interface ItemDaCotacao {
  sku: string
  quantidade: number
}

export interface OpcaoDeFrete {
  servicoId: number
  servico: string
  transportadora: string
  /** em reais, o que o cliente paga (frete nunca tem desconto) */
  preco: number
  /** já com o dia útil de postagem */
  prazoMinDias: number
  prazoMaxDias: number
  volumes: number
}

export interface Cotacao {
  soRetirada: boolean
  motivoSoRetirada: string | null
  opcoes: OpcaoDeFrete[]
  retirada: { disponivel: true; rotulo: string }
  /** o Melhor Envio não respondeu (ou não há token): só a retirada */
  freteIndisponivel: boolean
  /** o Melhor Envio respondeu, mas nenhum serviço atende este CEP */
  semServicoParaOCep: boolean
}

const MAXIMO_DE_UNIDADES_POR_SKU = 99
const SEGURO_MAXIMO_POR_VOLUME = 10000

interface Dependencias {
  produtos: Pick<ProdutosRepository, 'buscarParaPedido'>
  logistica: LogisticaRepository
  /** null = sem token: a cotação devolve só a retirada */
  melhorEnvio: MelhorEnvioClient | null
  cepDeOrigem: string
}

export function criarFreteService({
  produtos,
  logistica,
  melhorEnvio,
  cepDeOrigem,
}: Dependencias) {
  const retirada = {
    disponivel: true as const,
    rotulo: ROTULO_DA_OPCAO_DE_RETIRADA,
  }
  const apenasRetirada = (extra: Partial<Cotacao> = {}): Cotacao => ({
    soRetirada: false,
    motivoSoRetirada: null,
    opcoes: [],
    retirada,
    freteIndisponivel: false,
    semServicoParaOCep: false,
    ...extra,
  })

  async function cotar(
    cep: string,
    itensBrutos: ItemDaCotacao[],
  ): Promise<Cotacao> {
    // o mesmo sku repetido vira uma linha só
    const quantidades = new Map<string, number>()
    for (const { sku, quantidade } of itensBrutos) {
      quantidades.set(sku, (quantidades.get(sku) ?? 0) + quantidade)
    }
    const skus = [...quantidades.keys()]
    for (const [, quantidade] of quantidades) {
      if (quantidade > MAXIMO_DE_UNIDADES_POR_SKU) {
        throw new ErroDeNegocio(
          'quantidade_invalida',
          `A quantidade de cada produto vai de 1 a ${MAXIMO_DE_UNIDADES_POR_SKU}.`,
          422,
        )
      }
    }

    const [doCatalogo, pesos] = await Promise.all([
      produtos.buscarParaPedido(skus),
      logistica.buscarPorSkus(skus),
    ])
    const catalogoPorSku = new Map(doCatalogo.map((p) => [p.sku, p]))
    const pesoPorSku = new Map(pesos.map((p) => [p.sku, p]))

    for (const sku of skus) {
      const produto = catalogoPorSku.get(sku)
      if (!produto || !produto.ativo) {
        throw new ErroDeNegocio(
          'produto_indisponivel',
          `${produto?.nome ?? 'Um dos produtos'} não está disponível no momento.`,
          422,
        )
      }
      if (!pesoPorSku.has(sku)) {
        throw new ErroDeNegocio(
          'produto_sem_peso',
          `Não foi possível calcular o frete de ${produto.nome}. Fale com a clínica ou escolha retirar.`,
          422,
        )
      }
    }

    // A válvula so_retirada (sempre false por padrão): o pedido com um desses
    // produtos só pode ser retirado, e nem chamamos o Melhor Envio
    if (skusSoComRetirada(pesos).length > 0) {
      return apenasRetirada({
        soRetirada: true,
        motivoSoRetirada:
          'Algum produto do carrinho só pode ser retirado na clínica.',
      })
    }

    if (!melhorEnvio) return apenasRetirada({ freteIndisponivel: true })

    const volumes = empacotar(
      skus.map((sku) => ({
        pesoG: pesoPorSku.get(sku)!.peso_g,
        quantidade: quantidades.get(sku)!,
      })),
    )

    // Valor segurado: o preço dos produtos (cheio) repartido pelo peso de cada
    // volume. Só entra na conta do frete; nunca vai na resposta.
    const totalEmReais = emReais(
      skus.reduce((soma, sku) => {
        const cheio = precoCheioEmCentavos(catalogoPorSku.get(sku)!) ?? 0
        return soma + cheio * quantidades.get(sku)!
      }, 0),
    )
    const pesoTotal = volumes.reduce((soma, v) => soma + v.pesoG, 0)
    const paraCotar: VolumeParaCotar[] = volumes.map((v) => ({
      alturaCm: v.alturaCm,
      larguraCm: v.larguraCm,
      comprimentoCm: v.comprimentoCm,
      pesoKg: v.pesoG / 1000,
      valorSegurado: Math.min(
        SEGURO_MAXIMO_POR_VOLUME,
        Math.round(((totalEmReais * v.pesoG) / pesoTotal) * 100) / 100,
      ),
    }))

    let encontradas
    try {
      encontradas = await melhorEnvio.calcular({
        cepOrigem: cepDeOrigem,
        cepDestino: cep,
        volumes: paraCotar,
      })
    } catch (erro) {
      if (erro instanceof ErroDoMelhorEnvio) {
        if (erro.codigo === 'entrada_invalida') {
          throw new ErroDeNegocio(
            'cep_invalido',
            'Não foi possível calcular o frete para este CEP. Confira o CEP ou escolha retirar.',
            422,
          )
        }
        // só o código, nunca o corpo da resposta nem o token
        console.error(`Melhor Envio: cotação falhou (${erro.codigo})`)
        return apenasRetirada({ freteIndisponivel: true })
      }
      throw erro
    }

    const opcoes: OpcaoDeFrete[] = encontradas
      .map((o) => {
        const prazo = somarDiaDePostagem({
          min: o.prazoMinDias,
          max: o.prazoMaxDias,
        })
        return {
          servicoId: o.servicoId,
          servico: o.servico,
          transportadora: o.transportadora,
          preco: emReais(o.precoEmCentavos),
          prazoMinDias: prazo.min,
          prazoMaxDias: prazo.max,
          volumes: volumes.length,
        }
      })
      .sort((a, b) => a.preco - b.preco)

    return apenasRetirada({
      opcoes,
      semServicoParaOCep: opcoes.length === 0,
    })
  }

  return {
    cotar,

    // Para o pedido: cota DE NOVO e devolve o serviço escolhido pelo cliente
    // (nunca confia no preço mostrado no navegador). 409 se o serviço sumiu.
    async cotarServicoEscolhido(entrada: {
      cep: string
      servicoId: number
      itens: ItemDaCotacao[]
    }): Promise<FreteCotado> {
      const cotacao = await cotar(entrada.cep, entrada.itens)
      if (cotacao.soRetirada) {
        throw new ErroDeNegocio(
          'so_retirada',
          cotacao.motivoSoRetirada ??
            'Este pedido só pode ser retirado na clínica.',
          422,
        )
      }
      if (cotacao.freteIndisponivel) {
        throw new ErroDeNegocio(
          'frete_indisponivel',
          'O envio não está disponível agora. Escolha retirar na clínica ou tente de novo em instantes.',
          503,
        )
      }
      const escolhida = cotacao.opcoes.find(
        (o) => o.servicoId === entrada.servicoId,
      )
      if (!escolhida) {
        throw new ErroDeNegocio(
          'frete_mudou',
          'O serviço de entrega escolhido não está mais disponível. Escolha outra opção.',
          409,
        )
      }
      return {
        servicoNome: `${escolhida.transportadora} ${escolhida.servico}`,
        precoEmCentavos: Math.round(escolhida.preco * 100),
        prazoMinDias: escolhida.prazoMinDias,
        prazoMaxDias: escolhida.prazoMaxDias,
      }
    },
  }
}

export type FreteService = ReturnType<typeof criarFreteService>

// Adaptador para a porta do pedido (CotadorDeFrete). NÃO está ligado em
// pedidos.service ainda: o envio só passa a valer quando o Checkout e o
// pagamento existirem.
export function comoCotadorDeFrete(servico: FreteService): CotadorDeFrete {
  return {
    cotarServicoEscolhido: ({ cep, servicoId, itens }) =>
      servico.cotarServicoEscolhido({
        cep,
        servicoId,
        itens: itens.map((i) => ({ sku: i.sku, quantidade: i.quantidade })),
      }),
  }
}

export const freteService = criarFreteService({
  produtos: produtosRepository,
  logistica: logisticaRepository,
  melhorEnvio: env.MELHOR_ENVIO_TOKEN
    ? criarMelhorEnvioClient({
        token: env.MELHOR_ENVIO_TOKEN,
        ambiente: env.MELHOR_ENVIO_AMBIENTE,
      })
    : null,
  cepDeOrigem: CEP_DE_ORIGEM_PROVISORIO,
})
