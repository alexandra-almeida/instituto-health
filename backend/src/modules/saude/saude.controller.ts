import type { RequestHandler } from 'express'
import { saudeService } from './saude.service.js'

// Verificação de que a API está no ar. Não consulta o banco de propósito:
// responde rápido e não gasta conexão a cada checagem. Para o banco, veja
// verificarBanco logo abaixo.
export const verificarSaude: RequestHandler = (_req, res) => {
  res.json({ status: 'ok' })
}

// Verificação de que o banco responde. Rota pública (o monitor externo gratuito
// não envia cabeçalhos), por isso só devolve o status e a data do último
// batimento do cron, sem nenhum outro dado. Sem cache, senão o monitor leria
// uma resposta velha em vez de testar o banco.
export const verificarBanco: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(await saudeService.verificarBanco())
}
