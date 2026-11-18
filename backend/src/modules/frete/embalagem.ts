import { ErroDeNegocio } from '../../lib/erros.js'
import {
  CAIXAS,
  FATOR_DE_VOLUME_CM3_POR_G,
  OCUPACAO_MAXIMA_DA_CAIXA,
  type Caixa,
} from './caixas.js'

export interface ItemParaEmpacotar {
  /** peso de UMA unidade, em gramas */
  pesoG: number
  quantidade: number
}

export interface VolumeMontado {
  caixa: Caixa['nome']
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  /** peso do volume: produtos + caixa vazia, em gramas */
  pesoG: number
}

interface Unidade {
  pesoG: number
  volumeCm3: number
}

const volumeDaCaixa = (c: Caixa) =>
  c.comprimentoCm * c.larguraCm * c.alturaCm * OCUPACAO_MAXIMA_DA_CAIXA

const cabe = (c: Caixa, pesoG: number, volumeCm3: number) =>
  pesoG <= c.capacidadeMaxG && volumeCm3 <= volumeDaCaixa(c)

// Escolhe os volumes (caixas) de um pedido. Cada unidade ocupa um volume
// estimado (peso x 1,6) e a caixa só se enche até 60% do volume e até o peso
// máximo dela. Ordena do mais pesado para o mais leve (first-fit decreasing)
// dentro da MAIOR caixa e, no fim, cada grupo vai para a MENOR caixa em que
// cabe. Peso do volume = produtos + caixa vazia. Função pura: as mesmas
// entradas dão sempre os mesmos volumes (a cotação e a etiqueta usam estes).
// As medidas das caixas são provisórias até a Bia medir (ver caixas.ts).
export function empacotar(
  itens: ItemParaEmpacotar[],
  caixas: readonly Caixa[] = CAIXAS,
): VolumeMontado[] {
  const maior = caixas[caixas.length - 1]
  if (!maior) throw new Error('Nenhuma caixa configurada')

  const unidades: Unidade[] = []
  for (const { pesoG, quantidade } of itens) {
    for (let i = 0; i < quantidade; i++) {
      unidades.push({ pesoG, volumeCm3: pesoG * FATOR_DE_VOLUME_CM3_POR_G })
    }
  }
  if (unidades.length === 0) {
    throw new ErroDeNegocio('carrinho_vazio', 'O carrinho está vazio.', 400)
  }
  unidades.sort((a, b) => b.pesoG - a.pesoG)

  if (!cabe(maior, unidades[0]!.pesoG, unidades[0]!.volumeCm3)) {
    throw new ErroDeNegocio(
      'item_grande_demais',
      'Um dos produtos é grande demais para o envio. Fale com a clínica.',
      422,
    )
  }

  // first-fit decreasing dentro da maior caixa
  const grupos: Array<{ pesoG: number; volumeCm3: number }> = []
  for (const u of unidades) {
    const grupo = grupos.find((g) =>
      cabe(maior, g.pesoG + u.pesoG, g.volumeCm3 + u.volumeCm3),
    )
    if (grupo) {
      grupo.pesoG += u.pesoG
      grupo.volumeCm3 += u.volumeCm3
    } else {
      grupos.push({ pesoG: u.pesoG, volumeCm3: u.volumeCm3 })
    }
  }

  return grupos.map((g) => {
    const caixa = caixas.find((c) => cabe(c, g.pesoG, g.volumeCm3)) ?? maior
    return {
      caixa: caixa.nome,
      alturaCm: caixa.alturaCm,
      larguraCm: caixa.larguraCm,
      comprimentoCm: caixa.comprimentoCm,
      pesoG: g.pesoG + caixa.pesoVaziaG,
    }
  })
}
