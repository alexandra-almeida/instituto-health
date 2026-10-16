import type { AddToCartInput } from '../context/cart-context'
import { getProductGalleryExtras } from './productGallery'
import { getProductImage } from './productImages'
import { getProductDetails } from './tulipiaDetalhes'
import type { ProdutoDetalhes } from './tulipiaDetalhes'
import raw from './tulipia-produtos.json'

export interface TulipiaProduct {
  id: string
  /** nome completo, como está no catálogo (ex: "Sweet Lips - Gloss Labial Cereja") */
  nome: string
  /** nome sem o prefixo da linha (ex: "Gloss Labial Cereja") — usado no card */
  displayName: string
  /** linha/coleção (ex: "Sweet Lips", "Life C+"), quando o nome segue o
   * padrão "Linha - Produto"; null para itens sem esse padrão (kits, etc.) */
  linha: string | null
  /** tipo de produto (lista fechada, ver CATEGORIAS) — ex: Séruns, Máscaras,
   * Kits. Independente da linha/marca. */
  categoria: string
  /** necessidade/objetivo (lista fechada, ver CUIDADOS) — ex: Antiacne,
   * Clareamento. Um produto pode ter 0, 1 ou mais cuidados. */
  cuidado: string[]
  tamanho: string
  preco: number | null
  observacao?: string
  /** variações (ex: sabores do Sweet Lips), extraídas da observação */
  variacoes: string[] | null
  /** true para os itens em destaque do catálogo ("Queridinhos") */
  destaque: boolean
  /** true para itens de venda exclusiva a profissionais (sem preço público
   * — vem direto do catálogo oficial). A aba "Home Care" da página oculta
   * esses. */
  exclusivoProfissional: boolean
  /** foto real do produto, quando já baixada (ver productImages.ts) —
   * ausente para produtos que ainda não têm foto (cai no placeholder). */
  imagem?: string
  /** fotos extras de galeria (ver productGallery.ts) — vazio quando o
   * produto só tem a foto principal (ou nenhuma foto ainda). Usado só no
   * modal de detalhe; o card do grid mostra sempre só a principal. */
  imagensExtras: string[]
  /** descrição, benefícios, ativos, modo de uso, INCI etc. (ver
   * tulipiaDetalhes.ts) — ausente nos produtos ainda sem texto oficial. */
  detalhes?: ProdutoDetalhes
}

interface RawProduct {
  /** identificador fixo e único do produto (vira o `id`); nunca é alterado
   * depois de criado, ver "SKU" no CLAUDE.md */
  sku: string
  nome: string
  tamanho: string
  preco: number | null
  observacao?: string
  categoria: string
  cuidado: string[]
  /** true para os itens em destaque do catálogo ("Queridinhos") */
  destaque?: boolean
  /** vem direto do catálogo oficial (tulipia-produtos.json) — produtos
   * exclusivos a profissionais não mostram preço publicamente no site de
   * origem. Ausente = false (produto público). */
  exclusivoProfissional?: boolean
}

interface RawData {
  marca: string
  produtos: RawProduct[]
}

const data = raw as RawData

// A maioria dos nomes segue "Linha - Produto" (ex: "Marezi - Nano Sabonete
// Hidratante"); kits e alguns itens avulsos não têm esse separador.
function splitLinha(nome: string): { linha: string | null; displayName: string } {
  const separator = ' - '
  const index = nome.indexOf(separator)
  if (index === -1) return { linha: null, displayName: nome }
  return {
    linha: nome.slice(0, index).trim(),
    displayName: nome.slice(index + separator.length).trim(),
  }
}

// Extrai variações (sabores) de observações como
// "disponível em 3 sabores: tutti-frutti, cereja, chocolate" — quando a
// observação só menciona a quantidade sem listar (ex: "disponível em 3
// sabores"), usa a lista já conhecida da linha Sweet Lips como fallback.
function parseVariacoes(observacao?: string): string[] | null {
  if (!observacao) return null
  const withList = observacao.match(/sabor(?:es)?:\s*(.+)/i)
  if (withList) {
    return withList[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (/dispon[íi]vel em \d+ sabores/i.test(observacao)) {
    return ['Tutti-Frutti', 'Cereja', 'Chocolate']
  }
  return null
}

// O id do produto É o sku gravado no JSON: ele aparece na URL
// (/tulipia/produto/:slug), na chave do carrinho e nos favoritos salvos no
// navegador, então precisa ficar estável mesmo que o produto mude de nome,
// tamanho ou posição na lista. (Antes era calculado a partir do nome, do
// tamanho e do índice no array; os sku atuais são exatamente esses valores
// antigos, congelados.)
export const ALL_PRODUCTS: TulipiaProduct[] = data.produtos.map((p) => {
  const { linha, displayName } = splitLinha(p.nome)
  return {
    id: p.sku,
    nome: p.nome,
    displayName,
    linha,
    categoria: p.categoria,
    cuidado: p.cuidado,
    tamanho: p.tamanho,
    preco: p.preco,
    observacao: p.observacao,
    variacoes: parseVariacoes(p.observacao),
    destaque: p.destaque ?? false,
    exclusivoProfissional: p.exclusivoProfissional ?? false,
    imagem: getProductImage(p.nome, p.tamanho),
    imagensExtras: getProductGalleryExtras(p.nome, p.tamanho),
    detalhes: getProductDetails(p.nome, p.tamanho),
  }
})

// Dois produtos com o mesmo sku se misturariam no carrinho e nos favoritos.
// Falha alto no desenvolvimento (não derruba o site em produção).
if (import.meta.env.DEV) {
  const vistos = new Set<string>()
  for (const { id } of ALL_PRODUCTS) {
    if (vistos.has(id)) throw new Error(`sku repetido no catálogo: ${id}`)
    vistos.add(id)
  }
}

/** Produtos em destaque ("Queridinhos") — exibidos à parte, no topo. */
export const QUERIDINHOS = ALL_PRODUCTS.filter((p) => p.destaque)

/** Catálogo padrão (todos os produtos, exceto os em destaque). */
export const CATALOGO = ALL_PRODUCTS.filter((p) => !p.destaque)

export const CATEGORIAS = Array.from(
  new Set(CATALOGO.map((p) => p.categoria)),
).sort((a, b) => a.localeCompare(b, 'pt-BR'))

export const LINHAS = Array.from(
  new Set(CATALOGO.filter((p) => p.linha).map((p) => p.linha as string)),
).sort((a, b) => a.localeCompare(b, 'pt-BR'))

export const CUIDADOS = Array.from(
  new Set(CATALOGO.flatMap((p) => p.cuidado)),
).sort((a, b) => a.localeCompare(b, 'pt-BR'))

export function formatPrice(preco: number | null): string {
  if (preco == null) return 'Sob consulta'
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const PRODUCTS_BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p]))

export function findProductById(id: string): TulipiaProduct | undefined {
  return PRODUCTS_BY_ID.get(id)
}

/** Monta o item pra adicionar ao carrinho a partir de um produto (+ a
 * variação escolhida, se houver seletor). */
export function toCartInput(
  product: TulipiaProduct,
  variant?: string | null,
): AddToCartInput {
  return {
    productId: product.id,
    nome: product.nome,
    displayName: product.displayName,
    linha: product.linha,
    categoria: product.categoria,
    tamanho: product.tamanho,
    variant: variant ?? null,
    preco: product.preco,
    exclusivoProfissional: product.exclusivoProfissional,
    imagem: product.imagem,
  }
}

// Kits/combos descrevem o conteúdo dentro do próprio campo `tamanho`, ex:
// "kit (6 itens: Marezi loção tônica remineralizante 300ml, ...)" ou
// "kit (sérum 50ml + sabonete 110ml)". Extrai cada item como uma linha da
// lista "Esse kit contém".
export function parseKitContents(tamanho: string): string[] | null {
  if (!/^kit|^combo/i.test(tamanho.trim())) return null
  const match = tamanho.match(/\((.+)\)/)
  if (!match) return null
  let content = match[1]
  // remove prefixos tipo "6 itens:" antes de listar
  content = content.replace(/^\d+\s*itens?:\s*/i, '')
  const items = content
    .split(/,|\+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length > 0 ? items : null
}

// Nem todo kit lista os itens entre parênteses no `tamanho` (ex: "Kit
// Protocolo Dermo Estetic" só tem "kit completo") — pra saber SE é um kit
// (independente de termos a lista de itens ou não) olha pro nome também.
function isKitProduct(product: TulipiaProduct): boolean {
  return (
    /^kit|^combo/i.test(product.nome.trim()) ||
    /^kit|^combo/i.test(product.tamanho.trim())
  )
}

// Ainda não existe um campo de descrição de verdade no catálogo — só o
// nome, categoria e uma observação (nem sempre voltada pro cliente final).
// Enquanto isso não chega, gera um texto padrão a partir do que já temos.
export function generateDescription(product: TulipiaProduct): string {
  const linhaTexto = product.linha ? `da linha ${product.linha} ` : ''

  if (isKitProduct(product)) {
    return `${product.displayName} é um kit ${linhaTexto}da Tulípia, reunindo produtos complementares para um protocolo completo de cuidado. Ideal para quem busca praticidade e resultado com a qualidade Tulípia.`
  }

  return `${product.displayName} é um produto ${linhaTexto}da Tulípia, desenvolvido para a categoria ${product.categoria}. Formulado para oferecer cuidado e resultado com a qualidade Tulípia, é indicado para quem busca uma rotina eficiente e prática de beleza e bem-estar.`
}

/** Produtos relacionados: prioriza a mesma linha; sem linha (kits, etc.),
 * cai pra mesma categoria. Sempre exclui o próprio produto. */
export function getRelatedProducts(
  product: TulipiaProduct,
  limit = 4,
): TulipiaProduct[] {
  const sameLinha = product.linha
    ? ALL_PRODUCTS.filter(
        (p) => p.id !== product.id && p.linha === product.linha,
      )
    : []
  if (sameLinha.length >= limit) return sameLinha.slice(0, limit)

  const sameCategoria = ALL_PRODUCTS.filter(
    (p) =>
      p.id !== product.id &&
      p.categoria === product.categoria &&
      !sameLinha.includes(p),
  )
  return [...sameLinha, ...sameCategoria].slice(0, limit)
}
