import {
  perfisRepository,
  type PerfisRepository,
} from '../../repositories/perfis.repository.js'

interface Dependencias {
  perfis: Pick<PerfisRepository, 'verificarConexao'>
}

export function criarCronService({ perfis }: Dependencias) {
  return {
    // Só LÊ o banco. É o que basta para o Supabase gratuito contar atividade e
    // não pausar o projeto por inatividade.
    async manterAtivo() {
      await perfis.verificarConexao()
      return { ok: true }
    },
  }
}

export type CronService = ReturnType<typeof criarCronService>

export const cronService = criarCronService({ perfis: perfisRepository })
