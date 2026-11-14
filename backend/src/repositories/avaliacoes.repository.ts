import { supabaseAdmin } from '../lib/supabase.js'
import type { DecisaoSobrePerfil } from './perfis.repository.js'

export interface AvaliacaoRegistrada {
  decisao: DecisaoSobrePerfil
  /** só nas recusas */
  motivo: string | null
  em: string
  /** nome de quem decidiu (null se a conta de quem decidiu foi apagada) */
  por: string | null
}

export interface AvaliacoesRepository {
  /** A decisão mais recente de cada perfil (perfis sem decisão ficam de
   * fora do resultado). */
  ultimasPorPerfis(
    perfilIds: string[],
  ): Promise<Map<string, AvaliacaoRegistrada>>
}

interface Linha {
  perfil_id: string
  decisao: DecisaoSobrePerfil
  motivo: string | null
  criado_em: string
  avaliador_id: string | null
}

// Única camada que lê a tabela `avaliacoes_perfil` (a escrita é da função
// `avaliar_perfil`, chamada por perfisRepository.avaliar)
export const avaliacoesRepository: AvaliacoesRepository = {
  async ultimasPorPerfis(perfilIds) {
    const resultado = new Map<string, AvaliacaoRegistrada>()
    if (perfilIds.length === 0) return resultado

    const { data, error } = await supabaseAdmin
      .from('avaliacoes_perfil')
      .select('perfil_id, decisao, motivo, criado_em, avaliador_id')
      .in('perfil_id', perfilIds)
      .order('criado_em', { ascending: false })
    if (error) throw new Error(`Falha ao listar avaliações (${error.code})`)

    const linhas = data as Linha[]
    const avaliadores = [
      ...new Set(
        linhas.map((l) => l.avaliador_id).filter((id): id is string => !!id),
      ),
    ]
    const nomes = new Map<string, string>()
    if (avaliadores.length > 0) {
      const resposta = await supabaseAdmin
        .from('perfis')
        .select('id, nome')
        .in('id', avaliadores)
      if (resposta.error) {
        throw new Error(`Falha ao buscar quem avaliou (${resposta.error.code})`)
      }
      for (const { id, nome } of resposta.data as {
        id: string
        nome: string
      }[]) {
        nomes.set(id, nome)
      }
    }

    // Já vem da mais nova para a mais antiga: a primeira de cada perfil vale
    for (const linha of linhas) {
      if (resultado.has(linha.perfil_id)) continue
      resultado.set(linha.perfil_id, {
        decisao: linha.decisao,
        motivo: linha.motivo,
        em: linha.criado_em,
        por: linha.avaliador_id
          ? (nomes.get(linha.avaliador_id) ?? null)
          : null,
      })
    }
    return resultado
  },
}
