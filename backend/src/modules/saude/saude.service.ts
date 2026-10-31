import { ErroDeNegocio } from '../../lib/erros.js'
import {
  batimentosRepository,
  type BatimentosRepository,
} from '../../repositories/batimentos.repository.js'

interface Dependencias {
  batimentos: Pick<BatimentosRepository, 'ler'>
}

export function criarSaudeService({ batimentos }: Dependencias) {
  return {
    // Só LÊ a data do último batimento (nenhum dado de cliente) para provar que
    // o banco responde, e devolve só essa data. Serve ao monitor externo, que
    // chama esta rota a cada 5 minutos: avisa se o Supabase pausar e, de
    // quebra, gera leituras no banco. Linha ainda ausente (antes do primeiro
    // disparo do cron) não é falha: o banco respondeu e `ultimo` vai null.
    // Tabela ausente ou banco fora do ar é falha.
    async verificarBanco() {
      let ultimo: Date | null
      try {
        ultimo = await batimentos.ler()
      } catch (erro) {
        // A mensagem do repository só traz o código do banco, nunca dados
        console.error(
          'Verificação de saúde: banco indisponível.',
          erro instanceof Error ? erro.message : 'erro desconhecido',
        )
        throw new ErroDeNegocio(
          'banco_indisponivel',
          'O banco de dados não respondeu.',
          503,
        )
      }
      return { status: 'ok', ultimo: ultimo ? ultimo.toISOString() : null }
    },
  }
}

export type SaudeService = ReturnType<typeof criarSaudeService>

export const saudeService = criarSaudeService({
  batimentos: batimentosRepository,
})
