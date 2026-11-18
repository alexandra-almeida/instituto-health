import { supabaseAdmin } from '../lib/supabase.js'

export interface LogisticaDoProduto {
  sku: string
  peso_g: number
  liquido: boolean
  so_retirada: boolean
}

export interface LogisticaRepository {
  buscarPorSkus(skus: string[]): Promise<LogisticaDoProduto[]>
}

// Única camada que lê `produtos_logistica` (peso por produto, migração 0007)
export const logisticaRepository: LogisticaRepository = {
  async buscarPorSkus(skus) {
    if (skus.length === 0) return []
    const { data, error } = await supabaseAdmin
      .from('produtos_logistica')
      .select('sku, peso_g, liquido, so_retirada')
      .in('sku', skus)
    if (error) throw new Error(`Falha ao buscar a logística (${error.code})`)
    return data as LogisticaDoProduto[]
  },
}
