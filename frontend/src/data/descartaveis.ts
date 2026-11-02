import raw from './descartaveis.json'

// Descartáveis para clínicas (rota /produtos-hospitalares), separados do
// catálogo da Tulípia. Os dados vêm de descartaveis.json, gerado a partir do CSV
// da Juliana por scripts/importar-descartaveis.mjs. Preço único: não existe
// preço de profissional por produto aqui.

export interface VariacaoDescartavel {
  /** sku FIXO da variação (`desc-...-N`): nunca muda, novos entram no fim */
  sku: string
  /** tamanho da luva ou fragrância do sabonete; null em produto sem variação */
  rotulo: string | null
  /** preço em reais, igual ao que o servidor cobra (tabela `produtos`) */
  preco: number
}

export interface Descartavel {
  /** sku da primeira variação; identifica o produto na página */
  id: string
  nome: string
  categoria: string
  /** só quando confirmada; nunca "A CONFIRMAR" */
  marca: string | null
  /** só quando confirmada, ex: "Pacote com 100" */
  embalagem: string | null
  /** "Tamanho" ou "Fragrância"; null em produto sem variação */
  rotuloDaVariacao: string | null
  /** URL da foto, quando houver (sem foto, a página usa um ícone da categoria) */
  imagem?: string
  variacoes: VariacaoDescartavel[]
  /** preço do produto (as variações têm o mesmo preço) */
  preco: number
}

interface DadosBrutos {
  produtos: Array<Omit<Descartavel, 'id' | 'preco'>>
}

export const DESCARTAVEIS: Descartavel[] = (raw as DadosBrutos).produtos.map(
  (p) => ({
    ...p,
    id: p.variacoes[0].sku,
    preco: p.variacoes[0].preco,
  }),
)

// Na ordem em que aparecem na lista da Juliana
export const CATEGORIAS_DESCARTAVEIS = Array.from(
  new Set(DESCARTAVEIS.map((p) => p.categoria)),
)

// Só marcas confirmadas, em ordem alfabética
export const MARCAS_DESCARTAVEIS = Array.from(
  new Set(DESCARTAVEIS.flatMap((p) => (p.marca ? [p.marca] : []))),
).sort((a, b) => a.localeCompare(b, 'pt-BR'))
