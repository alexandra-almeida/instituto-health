import {
  batimentosRepository,
  type BatimentosRepository,
} from '../../repositories/batimentos.repository.js'

interface Dependencias {
  batimentos: BatimentosRepository
  /** relógio injetável, para o teste não depender da hora real */
  agora?: () => Date
}

export function criarCronService({
  batimentos,
  agora = () => new Date(),
}: Dependencias) {
  return {
    // Grava a data de agora numa linha única e depois a lê de volta. O
    // Supabase gratuito pausa o projeto por pouca atividade, e uma leitura por
    // dia não bastou (incidente de 31/10/2026, ver o plano). Gravar e ler
    // exercita o banco de verdade e prova que ele responde.
    async manterAtivo() {
      const instante = agora()
      await batimentos.registrar(instante)
      const lido = await batimentos.ler()
      // `>=` e não `===`: se outro disparo gravar logo depois, a data lida é
      // mais nova, e isso também prova que a gravação funcionou
      if (!lido || lido.getTime() < instante.getTime()) {
        throw new Error('O batimento gravado não foi encontrado na leitura')
      }
      return { ok: true }
    },
  }
}

export type CronService = ReturnType<typeof criarCronService>

export const cronService = criarCronService({
  batimentos: batimentosRepository,
})
