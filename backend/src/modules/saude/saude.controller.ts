import type { RequestHandler } from 'express'

// Verificação de que a API está no ar. Não consulta o banco de propósito:
// responde rápido e não gasta conexão a cada checagem.
export const verificarSaude: RequestHandler = (_req, res) => {
  res.json({ status: 'ok' })
}
