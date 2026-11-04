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
  /** URL da foto desta variação, quando o produto tem uma foto por tamanho */
  imagem?: string
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
  /** URL da foto do produto inteiro, quando houver. Sem nenhuma foto (nem por
   * variação), a página usa um ícone da categoria. Veja `fotoDoDescartavel`. */
  imagem?: string
  variacoes: VariacaoDescartavel[]
  /** preço do produto (as variações têm o mesmo preço) */
  preco: number
}

// `imagem` no JSON é o NOME do arquivo em src/assets/descartaveis/, ligado pelo
// importador; aqui ele vira a URL
interface VariacaoBruta extends Omit<VariacaoDescartavel, 'imagem'> {
  imagem?: string
}
interface DadosBrutos {
  produtos: Array<
    Omit<Descartavel, 'id' | 'preco' | 'imagem' | 'variacoes'> & {
      imagem?: string
      variacoes: VariacaoBruta[]
    }
  >
}

// Fotos dos descartáveis: o arquivo vai em src/assets/descartaveis/, com o slug
// do produto no nome, e `npm run descartaveis` grava o nome dele no JSON. Aqui o
// nome do arquivo vira a URL que o Vite serve. As fotos são as oficiais dos
// fabricantes, usadas pelo Instituto como representante, que compra direto do
// fabricante.
const FOTOS = import.meta.glob<string>(
  '../assets/descartaveis/*.{webp,jpg,jpeg,png}',
  { eager: true, query: '?url', import: 'default' },
)
export const FOTOS_DOS_DESCARTAVEIS = new Map(
  Object.entries(FOTOS).map(([caminho, url]) => [
    caminho.slice(caminho.lastIndexOf('/') + 1),
    url,
  ]),
)

const urlDaFoto = (arquivo: string | undefined) =>
  arquivo ? FOTOS_DOS_DESCARTAVEIS.get(arquivo) : undefined

export const DESCARTAVEIS: Descartavel[] = (raw as DadosBrutos).produtos.map(
  ({ imagem, variacoes, ...p }) => ({
    ...p,
    id: variacoes[0].sku,
    preco: variacoes[0].preco,
    imagem: urlDaFoto(imagem),
    variacoes: variacoes.map(({ imagem: fotoDaVariacao, ...v }) => ({
      ...v,
      imagem: urlDaFoto(fotoDaVariacao),
    })),
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
