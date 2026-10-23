import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

const opcoes = {
  // O backend guarda a sessão em cookies, não no cliente do Supabase
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const

// Cliente com a chave secreta, para o banco e para as operações de admin do
// Auth (criar e apagar usuário). NUNCA use para verifyOtp/signIn: ao abrir
// uma sessão o cliente passaria a enviar o token DAQUELE usuário nas
// próximas chamadas, e como este objeto é compartilhado entre requisições,
// elas perderiam o privilégio de admin ou vazariam entre usuários.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  opcoes,
)

// Cliente novo a cada chamada, para os fluxos que abrem sessão (verifyOtp,
// login). Descartado ao fim da operação, então nenhum estado sobra.
export function criarClienteSemEstado() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, opcoes)
}
