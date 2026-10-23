import type { RequestHandler } from 'express'
import { cronService } from './cron.service.js'

export const manterAtivo: RequestHandler = async (_req, res) => {
  res.json(await cronService.manterAtivo())
}
