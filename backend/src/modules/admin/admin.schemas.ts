import { z } from 'zod'
import { limparBusca, TAMANHO_MAXIMO_DA_BUSCA } from '../../lib/busca.js'

const busca = z
  .string()
  .max(TAMANHO_MAXIMO_DA_BUSCA * 3, 'Busca muito longa.')
  .optional()
  .transform(limparBusca)

const pagina = z.coerce
  .number({ error: 'Página inválida.' })
  .int('Página inválida.')
  .min(1, 'Página inválida.')
  .max(10000, 'Página inválida.')
  .default(1)

export const listaDeProfissionaisSchema = z.object({
  status: z
    .enum(['pendente', 'aprovado', 'recusado'], {
      error: 'Situação inválida.',
    })
    .default('pendente'),
  busca,
  pagina,
})

export const listaDeHomeCareSchema = z.object({ busca, pagina })

export const idSchema = z.object({
  id: z.uuid({ error: 'Cadastro não encontrado.' }),
})

// O motivo é obrigatório na recusa: vai no e-mail para o profissional e fica
// no histórico. Espaços nas pontas não contam.
export const MOTIVO_MINIMO = 3
export const MOTIVO_MAXIMO = 300

export const recusarSchema = z.object({
  motivo: z
    .string({ error: 'Informe o motivo da recusa.' })
    .trim()
    .min(MOTIVO_MINIMO, 'Informe o motivo da recusa.')
    .max(
      MOTIVO_MAXIMO,
      `O motivo deve ter no máximo ${MOTIVO_MAXIMO} caracteres.`,
    ),
})

export type ListaDeProfissionaisEntrada = z.infer<
  typeof listaDeProfissionaisSchema
>
export type ListaDeHomeCareEntrada = z.infer<typeof listaDeHomeCareSchema>
export type IdEntrada = z.infer<typeof idSchema>
export type RecusarEntrada = z.infer<typeof recusarSchema>
