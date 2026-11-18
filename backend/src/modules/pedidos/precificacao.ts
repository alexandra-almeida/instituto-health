import { ErroDeNegocio } from '../../lib/erros.js'
import {
  precoCheioEmCentavos,
  precoDoProfissionalEmCentavos,
} from '../../lib/preco.js'
import type { ProdutoParaPedido } from '../../repositories/produtos.repository.js'

export interface ItemPedido {
  sku: string
  quantidade: number
  /** sabor, tamanho etc. escolhido no site (não muda o preço) */
  variacao: string | null
}

export interface ItemPrecificado {
  sku: string
  nome: string
  variacao: string | null
  quantidade: number
  /** preço de UMA unidade, em centavos, já com o desconto do profissional */
  precoUnitarioEmCentavos: number
}

export interface Precificacao {
  itens: ItemPrecificado[]
  subtotalEmCentavos: number
  /** qual tabela de preços o servidor usou (auditoria no pedido) */
  tabelaDePrecos: 'publico' | 'profissional'
}

export const MAXIMO_DE_UNIDADES_POR_ITEM = 99

// O mesmo sku com a mesma variação vira uma linha só (o banco tem uma linha por
// sku e variação em cada pedido), somando as quantidades
export function juntarItensRepetidos(itens: ItemPedido[]): ItemPedido[] {
  const porChave = new Map<string, ItemPedido>()
  for (const item of itens) {
    const chave = `${item.sku}::${item.variacao ?? ''}`
    const existente = porChave.get(chave)
    if (existente) existente.quantidade += item.quantidade
    else porChave.set(chave, { ...item })
  }
  return [...porChave.values()]
}

const recusar = (codigo: string, mensagem: string) =>
  new ErroDeNegocio(codigo, mensagem, 422)

// Calcula o subtotal SEMPRE no servidor, com os preços do banco; nada que vem
// do navegador (preço, desconto, total) entra aqui. Regras:
//  - produto que não existe ou está inativo: recusa;
//  - exclusivo de profissional só para profissional APROVADO;
//  - sem preço aplicável (nem público nem cheio): recusa, nunca cai para outro
//    valor;
//  - profissional aprovado: 30% de desconto sobre o preço cheio dos produtos
//    Tulípia (descartáveis `desc-` sem desconto); os demais, o preço público.
// A regra do MAIOR desconto entre a promoção vigente e os 30% entra quando
// existir a tabela de promoções (ver lib/preco.ts).
export function precificarPedido(
  itens: ItemPedido[],
  produtos: ProdutoParaPedido[],
  profissionalAprovado: boolean,
): Precificacao {
  const porSku = new Map(produtos.map((p) => [p.sku, p]))
  const precificados: ItemPrecificado[] = []
  let subtotal = 0

  for (const item of itens) {
    const produto = porSku.get(item.sku)
    if (!produto || !produto.ativo) {
      throw recusar(
        'produto_indisponivel',
        `${produto?.nome ?? 'Um dos produtos'} não está disponível no momento.`,
      )
    }
    if (produto.exclusivo_profissional && !profissionalAprovado) {
      throw recusar(
        'produto_exclusivo',
        `${produto.nome} é exclusivo para profissionais com cadastro aprovado.`,
      )
    }
    const cheio = precoCheioEmCentavos(produto)
    if (cheio === null) {
      throw recusar(
        'produto_sem_preco',
        `${produto.nome} está sem preço e não pode ser vendido no momento.`,
      )
    }
    if (
      !Number.isInteger(item.quantidade) ||
      item.quantidade < 1 ||
      item.quantidade > MAXIMO_DE_UNIDADES_POR_ITEM
    ) {
      throw recusar(
        'quantidade_invalida',
        `A quantidade de ${produto.nome} precisa ser de 1 a ${MAXIMO_DE_UNIDADES_POR_ITEM}.`,
      )
    }

    const unitario = profissionalAprovado
      ? precoDoProfissionalEmCentavos(item.sku, cheio)
      : cheio
    subtotal += unitario * item.quantidade
    precificados.push({
      sku: item.sku,
      nome: produto.nome,
      variacao: item.variacao,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: unitario,
    })
  }

  return {
    itens: precificados,
    subtotalEmCentavos: subtotal,
    tabelaDePrecos: profissionalAprovado ? 'profissional' : 'publico',
  }
}
