import { Router } from 'express'
import { verificarSaude } from './saude.controller.js'

export const saudeRoutes = Router()

saudeRoutes.get('/', verificarSaude)
