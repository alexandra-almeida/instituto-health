import { Router } from 'express'
import { autenticarCron } from '../../middlewares/autenticarCron.js'
import { manterAtivo } from './cron.controller.js'

export const cronRoutes = Router()

// Chamada pelo Cron da Vercel (backend/vercel.json), a cada 6 horas
cronRoutes.get('/manter-ativo', autenticarCron, manterAtivo)
