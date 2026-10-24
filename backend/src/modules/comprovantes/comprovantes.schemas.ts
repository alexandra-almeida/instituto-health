import { z } from 'zod'
import { TAMANHO_MAXIMO_BYTES, TIPOS_ACEITOS } from './comprovantes.regras.js'

// Só tipo e tamanho: o caminho no bucket NUNCA vem do cliente nesta rota, é
// gerado pelo service. Campos a mais (perfil_id, nome do arquivo...) são
// descartados pelo middleware `validar`.
export const urlDeEnvioSchema = z.object({
  tipo: z.enum(TIPOS_ACEITOS, {
    error: 'Tipo de arquivo não aceito. Envie JPG, PNG ou PDF.',
  }),
  tamanho: z
    .number({ error: 'Informe o tamanho do arquivo.' })
    .int('Informe o tamanho do arquivo.')
    .min(1, 'O arquivo está vazio.')
    .max(TAMANHO_MAXIMO_BYTES, 'O arquivo deve ter no máximo 10 MB.'),
})

export const confirmarSchema = z.object({
  caminho: z
    .string({ error: 'Informe o arquivo enviado.' })
    .min(1, 'Informe o arquivo enviado.')
    .max(200, 'Arquivo não reconhecido.'),
})

export type UrlDeEnvioEntrada = z.infer<typeof urlDeEnvioSchema>
export type ConfirmarEntrada = z.infer<typeof confirmarSchema>
