import { filtroDeBusca } from '../lib/busca.js'
import { supabaseAdmin } from '../lib/supabase.js'

export type TipoDePerfil = 'profissional' | 'homecare'
export type StatusDoPerfil = 'pendente' | 'aprovado' | 'recusado'
export type DecisaoSobrePerfil = 'aprovado' | 'recusado'

export interface Perfil {
  id: string
  nome: string
  tipo: TipoDePerfil
  status: StatusDoPerfil
  is_admin: boolean
}

// Linha da tela de cadastros: só o necessário (LGPD). Nunca senha, token,
// endereço nem dado de pagamento.
export interface LinhaDeCadastro {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  registroProfissional: string | null
  status: StatusDoPerfil
  criadoEm: string
}

export interface ConsultaDeCadastros {
  tipo: TipoDePerfil
  status?: StatusDoPerfil
  busca?: string
  /** a partir de 1 */
  pagina: number
  porPagina: number
}

export interface ResumoDeCadastros {
  profissionais: Record<StatusDoPerfil, number>
  homecare: number
}

export interface ContatoDoPerfil {
  nome: string
  email: string | null
}

const COLUNAS = 'id, nome, tipo, status, is_admin'
const COLUNAS_DA_LISTA =
  'id, nome, email, telefone, registro_profissional, status, created_at'

interface LinhaDoBanco {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  registro_profissional: string | null
  status: StatusDoPerfil
  created_at: string
}

export interface PerfisRepository {
  criar(dados: {
    id: string
    nome: string
    email: string
    tipo: TipoDePerfil
    status: StatusDoPerfil
  }): Promise<void>
  buscarPorId(id: string): Promise<Perfil | null>
  buscarContato(id: string): Promise<ContatoDoPerfil | null>
  listar(
    consulta: ConsultaDeCadastros,
  ): Promise<{ itens: LinhaDeCadastro[]; total: number }>
  contarPorStatus(): Promise<ResumoDeCadastros>
  /** Decide sobre um profissional PENDENTE (muda o status e grava o histórico
   * na mesma transação). false = já não estava pendente (ou não é
   * profissional): ninguém foi alterado. */
  avaliar(dados: {
    perfilId: string
    decisao: DecisaoSobrePerfil
    motivo: string | null
    avaliadorId: string
  }): Promise<boolean>
  /** Profissional recusado que reenviou comprovante volta para pendente */
  reabrir(perfilId: string): Promise<void>
}

const paraLinha = (linha: LinhaDoBanco): LinhaDeCadastro => ({
  id: linha.id,
  nome: linha.nome,
  email: linha.email,
  telefone: linha.telefone,
  registroProfissional: linha.registro_profissional,
  status: linha.status,
  criadoEm: linha.created_at,
})

// Única camada que lê e grava a tabela `perfis`. is_admin não é parâmetro de
// criar() de propósito: nasce false pelo default do banco e só muda pelo SQL
// Editor. O e-mail é uma CÓPIA do que está em auth.users (para a busca e a
// listagem): se um dia existir troca de e-mail, esta coluna precisa ser
// atualizada junto.
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

  async buscarContato(id) {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('nome, email')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Falha ao buscar contato (${error.code})`)
    return data as ContatoDoPerfil | null
  },

  async listar({ tipo, status, busca, pagina, porPagina }) {
    let consulta = supabaseAdmin
      .from('perfis')
      .select(COLUNAS_DA_LISTA, { count: 'exact' })
      .eq('tipo', tipo)
    if (status) consulta = consulta.eq('status', status)
    if (busca) consulta = consulta.or(filtroDeBusca(busca))

    const inicio = (pagina - 1) * porPagina
    const { data, count, error } = await consulta
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(inicio, inicio + porPagina - 1)
    if (error) throw new Error(`Falha ao listar cadastros (${error.code})`)
    return {
      itens: (data as LinhaDoBanco[]).map(paraLinha),
      total: count ?? 0,
    }
  },

  async contarPorStatus() {
    const contar = async (
      tipo: TipoDePerfil,
      status?: StatusDoPerfil,
    ): Promise<number> => {
      let consulta = supabaseAdmin
        .from('perfis')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', tipo)
      if (status) consulta = consulta.eq('status', status)
      const { count, error } = await consulta
      if (error) throw new Error(`Falha ao contar cadastros (${error.code})`)
      return count ?? 0
    }
    const [pendente, aprovado, recusado, homecare] = await Promise.all([
      contar('profissional', 'pendente'),
      contar('profissional', 'aprovado'),
      contar('profissional', 'recusado'),
      contar('homecare'),
    ])
    return { profissionais: { pendente, aprovado, recusado }, homecare }
  },

  async avaliar({ perfilId, decisao, motivo, avaliadorId }) {
    const { data, error } = await supabaseAdmin.rpc('avaliar_perfil', {
      p_perfil: perfilId,
      p_decisao: decisao,
      p_motivo: motivo,
      p_avaliador: avaliadorId,
    })
    if (error) throw new Error(`Falha ao avaliar perfil (${error.code})`)
    return data === true
  },

  async reabrir(perfilId) {
    const { error } = await supabaseAdmin
      .from('perfis')
      .update({ status: 'pendente' })
      .eq('id', perfilId)
      .eq('tipo', 'profissional')
      .eq('status', 'recusado')
    if (error) throw new Error(`Falha ao reabrir perfil (${error.code})`)
  },
}
