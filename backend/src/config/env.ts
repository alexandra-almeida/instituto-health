import { z } from 'zod'

// Lê e valida as variáveis de ambiente uma única vez, na subida do app.
// Se algo estiver faltando ou errado, o processo falha logo no início em vez
// de quebrar no meio de uma requisição. As variáveis do Supabase e do PagBank
// entram aqui nos próximos passos, com os nomes reais criados pela integração.
const esquema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  // Só usada no desenvolvimento local; na Vercel não existe listen
  PORTA: z.coerce.number().int().positive().default(3333),
})

const resultado = esquema.safeParse(process.env)

if (!resultado.success) {
  // Mostra só os nomes das variáveis com problema, nunca os valores
  const nomes = resultado.error.issues.map((issue) => issue.path.join('.'))
  throw new Error(`Variáveis de ambiente inválidas: ${nomes.join(', ')}`)
}

export const env = resultado.data
