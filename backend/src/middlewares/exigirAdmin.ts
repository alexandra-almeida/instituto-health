import type { RequestHandler } from 'express'
import { ErroDeNegocio } from '../lib/erros.js'
import {
  perfisRepository,
  type PerfisRepository,
} from '../repositories/perfis.repository.js'

// Usar DEPOIS de `autenticar`. Lê is_admin direto do banco a cada chamada:
// nada que veio do navegador (nem do cookie) decide quem é admin.
export function criarExigirAdmin(
  perfis: Pick<PerfisRepository, 'buscarPorId'>,
): RequestHandler {
  return async (req, _res, next) => {
    if (!req.usuario) {
      next(
        new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
      )
      return
    }
    const perfil = await perfis.buscarPorId(req.usuario.id)
    if (!perfil?.is_admin) {
      next(new ErroDeNegocio('acesso_negado', 'Acesso restrito.', 403))
      return
    }
    next()
  }
}

export const exigirAdmin = criarExigirAdmin(perfisRepository)
