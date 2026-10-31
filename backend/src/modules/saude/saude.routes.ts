import { Router } from 'express'
import { verificarBanco, verificarSaude } from './saude.controller.js'

export const saudeRoutes = Router()

saudeRoutes.get('/', verificarSaude)
saudeRoutes.get('/banco', verificarBanco)
