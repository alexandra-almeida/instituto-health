import type { Perfil } from '../repositories/perfis.repository.js'

// Campos que o middleware `autenticar` coloca na requisição. Ficam opcionais
// porque só existem nas rotas protegidas por ele. is_admin não entra aqui de
// propósito: `exigirAdmin` sempre confere no banco.
declare module 'express-serve-static-core' {
  interface Request {
    usuario?: { id: string; email: string }
    perfil?: Pick<Perfil, 'nome' | 'tipo' | 'status'>
  }
}
