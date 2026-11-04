import type { TulipiaProduct } from '../data/tulipiaProducts'

export interface DadosDoCartao {
  /** linha do produto (ex: "Floraty"); sem linha, o nome do produto */
  marca: string
  /** nome sem a linha (ex: "Creme Emoliente para Cravos"); null sem linha */
  nome: string | null
  tamanho: string
  /** true para venda só a profissionais: o card mostra o aviso, não o preço */
  exclusivo: boolean
  /** preço público, só quando o produto não é exclusivo e tem preço */
  preco: number | null
}

// Dados do card que fica sobre um banner de produto. Tudo sai do catálogo (nada
// escrito à mão), então o card acompanha qualquer mudança de nome, tamanho,
// preço público ou exclusividade.
export function dadosDoCartao(produto: TulipiaProduct): DadosDoCartao {
  return {
    marca: produto.linha ?? produto.displayName,
    nome: produto.linha ? produto.displayName : null,
    tamanho: produto.tamanho,
    exclusivo: produto.exclusivoProfissional,
    preco: produto.exclusivoProfissional ? null : produto.preco,
  }
}
