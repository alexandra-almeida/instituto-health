import { supabaseAdmin } from '../lib/supabase.js'

const TABELA = 'batimentos'
// A tabela guarda uma única linha (check id = 1 na migração 0003)
const ID_DA_LINHA = 1

export interface BatimentosRepository {
  /** grava (upsert) a data do batimento na linha única */
  registrar(instante: Date): Promise<void>
  /** devolve a data gravada, ou null se a linha ainda não existe */
  ler(): Promise<Date | null>
}

// Única camada que lê e grava a tabela `batimentos`, usada só pelo despertador
// do cron para o Supabase gratuito contar atividade de leitura E escrita.
export const batimentosRepository: BatimentosRepository = {
  async registrar(instante) {
    const { error } = await supabaseAdmin
      .from(TABELA)
      .upsert({ id: ID_DA_LINHA, ultimo_em: instante.toISOString() })
    if (error) {
      throw new Error(`Falha ao registrar batimento (${error.code})`)
    }
  },

  async ler() {
    const { data, error } = await supabaseAdmin
      .from(TABELA)
      .select('ultimo_em')
      .eq('id', ID_DA_LINHA)
      .maybeSingle()
    if (error) {
      throw new Error(`Falha ao ler batimento (${error.code})`)
    }
    return data ? new Date(data.ultimo_em) : null
  },
}
