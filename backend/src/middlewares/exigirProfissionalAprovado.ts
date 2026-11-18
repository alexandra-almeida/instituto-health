import type { RequestHandler } from 'express'
import { ErroDeNegocio } from '../lib/erros.js'
import {
  perfisRepository,
  type PerfisRepository,
} from '../repositories/perfis.repository.js'

// Usar DEPOIS de `autenticar`. Só passa quem é profissional com cadastro
// APROVADO, lido direto do banco a cada chamada (como o exigirAdmin): nada que
// veio do navegador, do cookie nem da sessão em cache decide isso. Home Care,
// profissional pendente ou recusado: 403.
export function criarExigirProfissionalAprovado(
  perfis: Pick<PerfisRepository, 'buscarPorId'>,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.usuario) {
        throw new ErroDeNegocio(
          'nao_autenticado',
          'Faça login para continuar.',
          401,
        )
      }
      const perfil = await perfis.buscarPorId(req.usuario.id)
      if (perfil?.tipo !== 'profissional' || perfil.status !== 'aprovado') {
        throw new ErroDeNegocio(
          'profissional_nao_aprovado',
          'Disponível só para profissionais com cadastro aprovado.',
          403,
        )
      }
      next()
    } catch (erro) {
      next(erro)
    }
  }
}

export const exigirProfissionalAprovado =
  criarExigirProfissionalAprovado(perfisRepository)
