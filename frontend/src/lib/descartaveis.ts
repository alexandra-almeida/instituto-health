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
    imagem: produto.imagem,
  }
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
