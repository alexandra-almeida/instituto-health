import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'
import { criarAutenticar } from '../src/middlewares/autenticar.js'
import { criarExigirAdmin } from '../src/middlewares/exigirAdmin.js'
import { tratarErros } from '../src/middlewares/tratarErros.js'
import type { AuthService } from '../src/modules/auth/auth.service.js'
import type { PerfisRepository } from '../src/repositories/perfis.repository.js'

const usuario = { id: 'u-1', email: 'maria@exemplo.com' }
const perfil = {
  nome: 'Maria',
  tipo: 'profissional',
  status: 'aprovado',
} as const

describe('autenticar', () => {
  function criarApp(autenticarSessao: AuthService['autenticarSessao']) {
    const app = express()
    app.get('/protegida', criarAutenticar({ autenticarSessao }), (req, res) => {
      res.json({ usuario: req.usuario, perfil: req.perfil })
    })
    app.use(tratarErros)
    return app
  }

  it('coloca usuário e perfil em req e passa os cookies ao service', async () => {
    const autenticarSessao = vi
      .fn<AuthService['autenticarSessao']>()
      .mockResolvedValue({ usuario, perfil })

    const resposta = await request(criarApp(autenticarSessao))
      .get('/protegida')
      .set('Cookie', ['ih_acesso=a1', 'ih_renovacao=r1'])

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ usuario, perfil })
    expect(autenticarSessao).toHaveBeenCalledWith({
      accessToken: 'a1',
      refreshToken: 'r1',
    })
  })

  it('quando renovou, grava os cookies novos', async () => {
    const autenticarSessao = vi
      .fn<AuthService['autenticarSessao']>()
      .mockResolvedValue({
        usuario,
        perfil,
        sessaoRenovada: {
          accessToken: 'a2',
          refreshToken: 'r2',
          expiresIn: 60,
        },
      })

    const resposta = await request(criarApp(autenticarSessao))
      .get('/protegida')
      .set('Cookie', ['ih_renovacao=r1'])

    const cookies = resposta.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c) => c.startsWith('ih_acesso=a2'))).toBe(true)
    expect(cookies.some((c) => c.startsWith('ih_renovacao=r2'))).toBe(true)
  })

  it('401 do service: responde 401 e limpa os cookies', async () => {
    const autenticarSessao = vi
      .fn<AuthService['autenticarSessao']>()
      .mockRejectedValue(
        new ErroDeNegocio('nao_autenticado', 'Faça login para continuar.', 401),
      )

    const resposta = await request(criarApp(autenticarSessao)).get('/protegida')

    expect(resposta.status).toBe(401)
    const cookies = resposta.headers['set-cookie'] as unknown as string[]
    expect(cookies).toHaveLength(2)
  })

  it('erro inesperado vira 500 genérico e não limpa os cookies', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const autenticarSessao = vi
      .fn<AuthService['autenticarSessao']>()
      .mockRejectedValue(new Error('rede caiu'))

    const resposta = await request(criarApp(autenticarSessao)).get('/protegida')

    expect(resposta.status).toBe(500)
    expect(resposta.headers['set-cookie']).toBeUndefined()
    expect(JSON.stringify(resposta.body)).not.toContain('rede caiu')
  })
})

describe('exigirAdmin', () => {
  function criarApp(
    buscarPorId: PerfisRepository['buscarPorId'],
    comUsuario = true,
  ) {
    const app = express()
    app.get(
      '/admin',
      (req, _res, next) => {
        if (comUsuario) req.usuario = usuario
        next()
      },
      criarExigirAdmin({ buscarPorId }),
      (_req, res) => {
        res.json({ ok: true })
      },
    )
    app.use(tratarErros)
    return app
  }

  it('admin no banco passa', async () => {
    const buscarPorId = vi
      .fn<PerfisRepository['buscarPorId']>()
      .mockResolvedValue({ ...perfil, id: 'u-1', is_admin: true })

    const resposta = await request(criarApp(buscarPorId)).get('/admin')

    expect(resposta.status).toBe(200)
    expect(buscarPorId).toHaveBeenCalledWith('u-1')
  })

  it('não admin: 403', async () => {
    const buscarPorId = vi
      .fn<PerfisRepository['buscarPorId']>()
      .mockResolvedValue({ ...perfil, id: 'u-1', is_admin: false })

    const resposta = await request(criarApp(buscarPorId)).get('/admin')

    expect(resposta.status).toBe(403)
    expect(resposta.body.erro.codigo).toBe('acesso_negado')
  })

  it('perfil inexistente: 403', async () => {
    const buscarPorId = vi
      .fn<PerfisRepository['buscarPorId']>()
      .mockResolvedValue(null)

    const resposta = await request(criarApp(buscarPorId)).get('/admin')

    expect(resposta.status).toBe(403)
  })

  it('sem usuário em req (autenticar não rodou): 401, sem consultar o banco', async () => {
    const buscarPorId = vi.fn<PerfisRepository['buscarPorId']>()

    const resposta = await request(criarApp(buscarPorId, false)).get('/admin')

    expect(resposta.status).toBe(401)
    expect(buscarPorId).not.toHaveBeenCalled()
  })
})
