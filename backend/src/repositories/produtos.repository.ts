import { supabaseAdmin } from '../lib/supabase.js'

// Só o que o cálculo de preço precisa. `preco_cheio` é CONFIDENCIAL (preço dos
// exclusivos): quem usa esta camada só pode devolvê-lo a profissional aprovado.
export interface PrecoDoProduto {
  sku: string
  preco: number | string | null
  preco_cheio: number | string | null
  ativo: boolean
}

export interface ProdutosRepository {
  buscarPrecosPorSkus(skus: string[]): Promise<PrecoDoProduto[]>
}

// Única camada que lê a tabela `produtos` no backend
export const produtosRepository: ProdutosRepository = {
  async buscarPrecosPorSkus(skus) {
    if (skus.length === 0) return []
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select('sku, preco, preco_cheio, ativo')
      .in('sku', skus)
    if (error) {
      // A mensagem do banco pode citar valores; guardamos só o código
      throw new Error(`Falha ao buscar preços (${error.code})`)
    }
    return data as PrecoDoProduto[]
  },
}
