// Regras de preço do profissional (decididas com a Juliana em 16/11/2026, ver
// "Regra de preço do profissional" no plano). Funções PURAS, em centavos
// inteiros: dinheiro nunca passa por ponto flutuante.
//
// Ainda NÃO entra aqui o preço promocional: a regra "vale o MAIOR desconto
// entre a promoção vigente e 30% sobre o preço cheio" só pode ser aplicada
// quando existir a tabela de promoções. Quando existir, é UMA mudança em
// `precoDoProfissionalEmCentavos`: menor(promoção, preço com 30%), sempre a
// partir do preço CHEIO (nunca 30% em cima do promocional).

export const DESCONTO_DO_PROFISSIONAL_PERCENTUAL = 30

// Descartáveis para clínicas (skus `desc-...`) não têm desconto, nem para
// profissional
export const PREFIXO_DOS_DESCARTAVEIS = 'desc-'

export const ehDescartavel = (sku: string) =>
  sku.startsWith(PREFIXO_DOS_DESCARTAVEIS)

// numeric do Postgres chega como número ou texto: "129.90" e 129.9 são o mesmo
// preço
export const emCentavos = (valor: number | string): number =>
  Math.round(Number(valor) * 100)

export const emReais = (centavos: number): number => centavos / 100

// 30% do preço cheio, com o meio centavo arredondado para cima. Conta só com
// inteiros (cheio * 30 é exato; somar 50 e dividir por 100 arredonda sem
// ponto flutuante). Descartável: 0.
export function descontoDoProfissionalEmCentavos(
  sku: string,
  precoCheioEmCentavos: number,
): number {
  if (ehDescartavel(sku)) return 0
  return Math.floor(
    (precoCheioEmCentavos * DESCONTO_DO_PROFISSIONAL_PERCENTUAL + 50) / 100,
  )
}

// Preço que o profissional aprovado paga por unidade, sempre a partir do preço
// cheio
export function precoDoProfissionalEmCentavos(
  sku: string,
  precoCheioEmCentavos: number,
): number {
  return (
    precoCheioEmCentavos -
    descontoDoProfissionalEmCentavos(sku, precoCheioEmCentavos)
  )
}

// O preço cheio de um produto: o público (`preco`) ou, nos exclusivos, o
// `preco_cheio` confidencial. O banco garante que nunca existem os dois. Nulo
// = sem preço: o produto NÃO pode ser vendido (nunca se cai para outro valor).
export function precoCheioEmCentavos(produto: {
  preco: number | string | null
  preco_cheio: number | string | null
}): number | null {
  const valor = produto.preco ?? produto.preco_cheio
  return valor === null ? null : emCentavos(valor)
}
