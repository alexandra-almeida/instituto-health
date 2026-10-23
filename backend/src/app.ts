import express from 'express'
import './config/env.js'
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { comprovantesRoutes } from './modules/comprovantes/comprovantes.routes.js'
import { cronRoutes } from './modules/cron/cron.routes.js'
import { saudeRoutes } from './modules/saude/saude.routes.js'

// Monta o app sem chamar listen. A Vercel procura um arquivo que importe
// 'express' nesta ordem: app, index, server (na raiz e depois em src/), e
// usa o export default como Function. Por isso este arquivo se chama app.ts
// e importa o express diretamente, enquanto server.ts só importa daqui.
const app = express()

// Não anunciar o framework no cabeçalho das respostas
app.disable('x-powered-by')

app.use(express.json())

app.use('/api/saude', saudeRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/comprovantes', comprovantesRoutes)
app.use('/api/cron', cronRoutes)

app.use(rotaNaoEncontrada)
app.use(tratarErros)

export default app
