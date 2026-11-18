import { supabaseAdmin } from '../lib/supabase.js'

// Valores em dinheiro entram como TEXTO exato ("129.90"), nunca como número de
// ponto flutuante
export interface NovoPedido {
  perfil_id: string | null
  email: string
  tabela_de_precos: 'publico' | 'profissional'
  forma_pagamento: 'pix' | 'credito' | 'debito'
  subtotal: string
  frete: string
  total: string
  frete_servico: string | null
  frete_servico_id: number | null
  frete_prazo_min: number | null
  frete_prazo_max: number | null
  entrega_tipo: 'envio' | 'retirada'
  entrega_nome: string
  entrega_telefone: string
  entrega_cep: string | null
  entrega_rua: string | null
  entrega_numero: string | null
  entrega_complemento: string | null
  entrega_bairro: string | null
  entrega_cidade: string | null
  entrega_estado: string | null
}

export interface NovoItemDePedido {
  sku: string
  nome: string
  variacao: string | null
  quantidade: number
  preco_unitario: string
}

export interface ItemDoBanco {
  sku: string
  nome: string
  variacao: string | null
  quantidade: number
  preco_unitario: number | string
}

export interface PedidoDoBanco {
  id: string
  numero: number
  perfil_id: string | null
  status: string
  forma_pagamento: string
  tabela_de_precos: string
  subtotal: number | string
  frete: number | string
  total: number | string
  frete_servico: string | null
  codigo_rastreio: string | null
  entrega_tipo: 'envio' | 'retirada'
  created_at: string
  itens_pedido: ItemDoBanco[]
}

export type ResumoDePedido = Omit<PedidoDoBanco, 'itens_pedido'>

const COLUNAS_DO_RESUMO =
  'id, numero, perfil_id, status, forma_pagamento, tabela_de_precos, subtotal, frete, total, frete_servico, codigo_rastreio, entrega_tipo, created_at'

export interface PedidosRepository {
  /** Cria o pedido e os itens de uma vez só (função criar_pedido do banco) */
  criar(
    pedido: NovoPedido,
    itens: NovoItemDePedido[],
  ): Promise<{ id: string; numero: number }>
  buscarPorId(id: string): Promise<PedidoDoBanco | null>
  listarDoPerfil(perfilId: string): Promise<ResumoDePedido[]>
}

// Única camada que lê e grava `pedidos` e `itens_pedido`
export const pedidosRepository: PedidosRepository = {
  async criar(pedido, itens) {
    const { data, error } = await supabaseAdmin.rpc('criar_pedido', {
      p_pedido: pedido,
      p_itens: itens,
    })
    if (error) {
      // A mensagem do banco pode citar valores e endereço; guardamos só o código
      throw new Error(`Falha ao criar o pedido (${error.code})`)
    }
    const linha = (data as Array<{ r_id: string; r_numero: number }>)[0]
    if (!linha) throw new Error('Falha ao criar o pedido (sem retorno)')
    return { id: linha.r_id, numero: Number(linha.r_numero) }
  },

  async buscarPorId(id) {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select(
        `${COLUNAS_DO_RESUMO}, itens_pedido (sku, nome, variacao, quantidade, preco_unitario)`,
      )
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Falha ao buscar o pedido (${error.code})`)
    return data as PedidoDoBanco | null
  },

  async listarDoPerfil(perfilId) {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select(COLUNAS_DO_RESUMO)
      .eq('perfil_id', perfilId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(`Falha ao listar os pedidos (${error.code})`)
    return data as ResumoDePedido[]
  },
}
