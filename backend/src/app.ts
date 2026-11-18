import express from 'express'
import './config/env.js'
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { comprovantesRoutes } from './modules/comprovantes/comprovantes.routes.js'
import { cronRoutes } from './modules/cron/cron.routes.js'
import { pedidosRoutes } from './modules/pedidos/pedidos.routes.js'
import { produtosRoutes } from './modules/produtos/produtos.routes.js'
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
app.use('/api/admin', adminRoutes)
app.use('/api/comprovantes', comprovantesRoutes)
app.use('/api/cron', cronRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/produtos', produtosRoutes)

app.use(rotaNaoEncontrada)
app.use(tratarErros)

export default app
