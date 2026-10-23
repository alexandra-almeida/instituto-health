import { z } from 'zod'

// Normaliza o e-mail (espaços e caixa) para que o mesmo endereço digitado de
// formas diferentes seja sempre a mesma conta
const email = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .max(254, 'E-mail inválido.')
  .pipe(z.email({ error: 'E-mail inválido.' }))

export const cadastroSchema = z.object({
  perfil: z.enum(['profissional', 'homecare'], {
    error: 'Escolha o tipo de perfil.',
  }),
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(1, 'Informe o nome.')
    .max(120, 'O nome é muito longo.'),
  email,
  // 72 é o limite do bcrypt, que o Supabase usa; acima disso rejeita
  senha: z
    .string({ error: 'Informe a senha.' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.'),
})

export const confirmarEmailSchema = z.object({
  email,
  codigo: z
    .string({ error: 'Informe o código.' })
    .trim()
    .regex(/^\d{6}$/, 'O código tem 6 números.'),
})

export const reenviarCodigoSchema = z.object({ email })

export type CadastroEntrada = z.infer<typeof cadastroSchema>
export type ConfirmarEmailEntrada = z.infer<typeof confirmarEmailSchema>
export type ReenviarCodigoEntrada = z.infer<typeof reenviarCodigoSchema>
