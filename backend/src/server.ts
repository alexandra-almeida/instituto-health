import app from './app.js'
import { env } from './config/env.js'

// Só para desenvolvimento local. Em produção a Vercel usa o export default
// de app.ts e este arquivo não é executado.
app.listen(env.PORTA, () => {
  console.log(`API rodando em http://localhost:${env.PORTA}`)
})
