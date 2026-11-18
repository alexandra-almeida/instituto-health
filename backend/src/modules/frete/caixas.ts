// Caixas padrão do envio. Medidas PROVISÓRIAS até a Bia medir as reais (ela
// preenche a planilha docs/frete-medidas.csv; quando voltar, estes números são
// trocados aqui, num commit). São só 3 linhas, por isso ficam no código e não no
// banco.
export interface Caixa {
  nome: 'Pequena' | 'Média' | 'Grande'
  comprimentoCm: number
  larguraCm: number
  alturaCm: number
  /** peso da caixa vazia, em gramas */
  pesoVaziaG: number
  /** peso máximo de PRODUTOS que a caixa leva, em gramas */
  capacidadeMaxG: number
}

// Da menor para a maior (a escolha do volume depende desta ordem)
export const CAIXAS: readonly Caixa[] = [
  {
    nome: 'Pequena',
    comprimentoCm: 20,
    larguraCm: 15,
    alturaCm: 10,
    pesoVaziaG: 100,
    capacidadeMaxG: 1000,
  },
  {
    nome: 'Média',
    comprimentoCm: 30,
    larguraCm: 22,
    alturaCm: 15,
    pesoVaziaG: 200,
    capacidadeMaxG: 3000,
  },
  {
    nome: 'Grande',
    comprimentoCm: 40,
    larguraCm: 30,
    alturaCm: 25,
    pesoVaziaG: 400,
    capacidadeMaxG: 8000,
  },
]

// Cada unidade ocupa um volume estimado (peso x este fator, em cm³) e a caixa só
// se enche até esta fração do volume (sobra espaço para proteção)
export const FATOR_DE_VOLUME_CM3_POR_G = 1.6
export const OCUPACAO_MAXIMA_DA_CAIXA = 0.6
