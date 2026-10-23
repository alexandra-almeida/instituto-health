export const CODIGO_TAMANHO = 6

// O Supabase só libera um novo código a cada 60 s (plano do backend, seção 5);
// o botão de reenvio espera esse tempo para não pedir antes da hora
export const RESEND_COOLDOWN_SECONDS = 60

export function codigoVazio(): string[] {
  return Array<string>(CODIGO_TAMANHO).fill('')
}
