import type { Perfil } from '../repositories/perfis.repository.js'

// Campos que o middleware `autenticar` coloca na requisição. Ficam opcionais
// porque só existem nas rotas protegidas por ele. `ehAdmin` é só uma dica para
// a tela (o link "Cadastros"): quem decide de verdade é `exigirAdmin`, que
// sempre confere is_admin no banco e nunca confia no que veio do navegador.
declare module 'express-serve-static-core' {
  interface Request {
    usuario?: { id: string; email: string }
    perfil?: Pick<Perfil, 'nome' | 'tipo' | 'status'> & { ehAdmin: boolean }
  }
}
