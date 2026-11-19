import { supabaseAdmin } from '../lib/supabase.js'

export interface ResultadoDaTentativa {
  excedeu: boolean
  /** segundos até a janela recomeçar */
  esperaSegundos: number
}

export interface LimitesRepository {
  /** Registra uma tentativa de forma atômica (função registrar_tentativa) */
  registrar(
    chave: string,
    limite: number,
    janelaSegundos: number,
  ): Promise<ResultadoDaTentativa>
  /** Apaga as janelas vencidas há mais de `idadeSegundos` */
  limparVencidos(idadeSegundos: number): Promise<number>
}

// Única camada que fala com a tabela limites_de_uso (migração 0009). A chave já
// chega como hash: nenhum IP passa por aqui.
export const limitesRepository: LimitesRepository = {
  async registrar(chave, limite, janelaSegundos) {
    const { data, error } = await supabaseAdmin.rpc('registrar_tentativa', {
      p_chave: chave,
      p_limite: limite,
      p_janela_segundos: janelaSegundos,
    })
    if (error) throw new Error(`Falha ao registrar a tentativa (${error.code})`)
    const linha = (
      data as Array<{ r_excedeu: boolean; r_espera_segundos: number }>
    )[0]
    if (!linha) throw new Error('Falha ao registrar a tentativa (sem retorno)')
    return {
      excedeu: linha.r_excedeu,
      esperaSegundos: Number(linha.r_espera_segundos),
    }
  },

  async limparVencidos(idadeSegundos) {
    const { data, error } = await supabaseAdmin.rpc('limpar_limites_vencidos', {
      p_idade_segundos: idadeSegundos,
    })
    if (error) throw new Error(`Falha ao limpar os limites (${error.code})`)
    return Number(data)
  },
}
