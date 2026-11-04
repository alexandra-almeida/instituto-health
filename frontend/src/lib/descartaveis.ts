import type { AddToCartInput } from '../context/cart-context'
import type { Descartavel, VariacaoDescartavel } from '../data/descartaveis'

// Funções puras da página de descartáveis (sem React), para poderem ser
// testadas.

// Texto do bloco "Compras em atacado e licitações" e do botão de cada produto
export const MENSAGEM_ATACADO =
  'Olá! Gostaria de um orçamento para compra em atacado/licitação.'

export function linkDoWhatsapp(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}

// Nome do arquivo de foto do produto, sem a extensão: o slug do nome mais o da
// marca quando ela está confirmada (ex: "luva-de-vinil-sem-po-vabene"). É a
// mesma regra do importador (scripts/importar-descartaveis.mjs); o teste de
// fotos confere que as duas concordam.
export function slugDoProduto(nome: string, marca: string | null) {
  const slug = (texto: string) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  return marca ? `${slug(nome)}-${slug(marca)}` : slug(nome)
}

// Mensagem do botão "Atacado ou licitação? Fale com a gente" de cada produto:
// produto, variação e quantidade desejada. Se a pessoa ainda não escolheu a
// variação, vai "a definir" (o botão do WhatsApp não exige a escolha).
export function mensagemDoProduto(
  produto: Pick<Descartavel, 'nome' | 'marca' | 'rotuloDaVariacao'>,
  variacao: Pick<VariacaoDescartavel, 'rotulo'> | null,
  quantidade: number,
) {
  const linhas = [
    MENSAGEM_ATACADO,
    `Produto: ${produto.nome}${produto.marca ? ` (${produto.marca})` : ''}`,
  ]
  if (produto.rotuloDaVariacao) {
    linhas.push(
      `${produto.rotuloDaVariacao}: ${variacao?.rotulo ?? 'a definir'}`,
    )
  }
  linhas.push(`Quantidade: ${quantidade}`)
  return linhas.join('\n')
}

// Item do carrinho (o mesmo da Tulípia). O `productId` é o sku da VARIAÇÃO, o
// mesmo que o servidor usa para achar o preço na tabela `produtos`; o carrinho
// já separa linhas por produto + variação.
export function paraCarrinho(
  produto: Descartavel,
  variacao: VariacaoDescartavel,
): AddToCartInput {
  return {
    productId: variacao.sku,
    nome: produto.nome,
    displayName: produto.nome,
    linha: produto.marca,
    categoria: produto.categoria,
    tamanho: produto.embalagem ?? '',
    variant: variacao.rotulo,
    preco: variacao.preco,
    exclusivoProfissional: false,
    imagem: fotoDoDescartavel(produto, variacao),
  }
}

// Foto mostrada no card. Quando o produto tem uma foto por variação (ex: uma
// caixa para cada tamanho da luva), vale a da variação escolhida. Antes de
// escolher, ou se a escolhida não tiver foto, vale a da variação M, ou a
// primeira variação que tiver foto; por último, a foto do produto inteiro.
// Sem nenhuma foto devolve undefined e o card usa o ícone da categoria.
export function fotoDoDescartavel(
  produto: {
    imagem?: string
    variacoes: ReadonlyArray<{ rotulo: string | null; imagem?: string }>
  },
  variacao: { imagem?: string } | null,
) {
  if (variacao?.imagem) return variacao.imagem
  const padrao =
    produto.variacoes.find((v) => v.rotulo === 'M' && v.imagem) ??
    produto.variacoes.find((v) => v.imagem)
  return padrao?.imagem ?? produto.imagem
}

// Sem acento e em minúsculas, para a busca achar "luva" em "Luva" e "agua" em
// "Água"
export function normalizarBusca(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export interface FiltrosDeDescartaveis {
  /** vazio = todas */
  categoria: string
  /** vazio = todas */
  marca: string
  busca: string
}

export function filtrarDescartaveis(
  lista: readonly Descartavel[],
  { categoria, marca, busca }: FiltrosDeDescartaveis,
) {
  const consulta = normalizarBusca(busca)
  return lista.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!marca || p.marca === marca) &&
      (!consulta || normalizarBusca(p.nome).includes(consulta)),
  )
}
