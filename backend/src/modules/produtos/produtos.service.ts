import {
  emReais,
  precoCheioEmCentavos,
  precoDoProfissionalEmCentavos,
} from '../../lib/preco.js'
import {
  produtosRepository,
  type ProdutosRepository,
} from '../../repositories/produtos.repository.js'

export interface PrecoParaProfissional {
  sku: string
  /** preço cheio, em reais */
  precoCheio: number
  /** o que o profissional aprovado paga (30% sobre o cheio; descartável sem desconto) */
  precoComDesconto: number
}

export interface PrecosParaProfissional {
  itens: PrecoParaProfissional[]
  /** não podem ser vendidos: sku desconhecido, produto inativo ou sem preço */
  semPreco: string[]
}

export function criarProdutosService(
  produtos: Pick<ProdutosRepository, 'buscarPrecosPorSkus'>,
) {
  return {
    // Preços para o profissional aprovado (quem chama já passou por
    // exigirProfissionalAprovado). O preço sempre sai do banco; o desconto é
    // calculado aqui, nunca vem do navegador. Produto sem preço aplicável NUNCA
    // recebe outro valor: vai para `semPreco`. A ordem segue a pedida.
    async precosParaProfissional(
      skus: string[],
    ): Promise<PrecosParaProfissional> {
      const linhas = await produtos.buscarPrecosPorSkus(skus)
      const porSku = new Map(linhas.map((linha) => [linha.sku, linha]))

      const itens: PrecoParaProfissional[] = []
      const semPreco: string[] = []
      for (const sku of skus) {
        const linha = porSku.get(sku)
        const cheio = linha?.ativo ? precoCheioEmCentavos(linha) : null
        if (cheio === null) {
          semPreco.push(sku)
          continue
        }
        itens.push({
          sku,
          precoCheio: emReais(cheio),
          precoComDesconto: emReais(precoDoProfissionalEmCentavos(sku, cheio)),
        })
      }
      return { itens, semPreco }
    },
  }
}

export type ProdutosService = ReturnType<typeof criarProdutosService>

export const produtosService = criarProdutosService(produtosRepository)
