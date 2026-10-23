import { supabaseAdmin } from '../lib/supabase.js'

export type TipoDePerfil = 'profissional' | 'homecare'
export type StatusDoPerfil = 'pendente' | 'aprovado' | 'recusado'

export interface Perfil {
  id: string
  nome: string
  tipo: TipoDePerfil
  status: StatusDoPerfil
  is_admin: boolean
}

const COLUNAS = 'id, nome, tipo, status, is_admin'

export interface PerfisRepository {
  criar(dados: {
    id: string
    nome: string
    tipo: TipoDePerfil
    status: StatusDoPerfil
  }): Promise<void>
  buscarPorId(id: string): Promise<Perfil | null>
}

// Única camada que lê e grava a tabela `perfis`. is_admin não é parâmetro de
// criar() de propósito: nasce false pelo default do banco e só muda pelo
// Table Editor.
export const perfisRepository: PerfisRepository = {
  async criar(dados) {
    const { error } = await supabaseAdmin.from('perfis').insert(dados)
    if (error) {
      // A mensagem do banco pode citar valores; guardamos só o código
      throw new Error(`Falha ao criar perfil (${error.code})`)
    }
  },

  async buscarPorId(id) {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select(COLUNAS)
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Falha ao buscar perfil (${error.code})`)
    return data as Perfil | null
  },
}
