import { Router } from 'express'
import { autenticarCron } from '../../middlewares/autenticarCron.js'
import { manterAtivo } from './cron.controller.js'

export const cronRoutes = Router()

// Chamada pelo Cron da Vercel (backend/vercel.json), uma vez por dia
cronRoutes.get('/manter-ativo', autenticarCron, manterAtivo)
