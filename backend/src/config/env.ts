import { z } from 'zod'

// Lê e valida as variáveis de ambiente uma única vez, na subida do app.
// Se algo estiver faltando ou errado, o processo falha logo no início em vez
// de quebrar no meio de uma requisição. Do Supabase o backend usa só estas
// duas (decisão de 16/10/2026 no plano, seção 9). As da Rede entram nos
// próximos passos.
const esquema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  // Só usada no desenvolvimento local; na Vercel não existe listen
  PORTA: z.coerce.number().int().positive().default(3333),
  SUPABASE_URL: z.url(),
  // Chave secreta: ignora o RLS. Nunca registrar em log nem devolver ao cliente
  SUPABASE_SECRET_KEY: z.string().min(1),
  // Origens do site que podem chamar a API, separadas por vírgula (o domínio
  // da Vercel e, depois, o próprio). Vazia em produção: a API recusa toda
  // requisição que altera dados. Ver middlewares/protegerOrigem.ts
  ORIGEM_FRONTEND: z.string().optional(),
  // Segredo do Cron da Vercel (rota /api/cron/manter-ativo). Opcional até em
  // produção: sem ela a API sobe normal e só a rota do cron responde 401.
  // Definida (não vazia), precisa ter 16 caracteres ou mais.
  CRON_SECRET: z.preprocess(
    (valor) => (valor === '' ? undefined : valor),
    z.string().min(16).optional(),
  ),
})

const resultado = esquema.safeParse(process.env)

if (!resultado.success) {
  // Mostra só os nomes das variáveis com problema, nunca os valores
  const nomes = resultado.error.issues.map((issue) => issue.path.join('.'))
  throw new Error(`Variáveis de ambiente inválidas: ${nomes.join(', ')}`)
}

export const env = resultado.data
