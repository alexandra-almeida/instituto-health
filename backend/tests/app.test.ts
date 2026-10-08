import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { ErroDeNegocio } from '../src/lib/erros.js'
import { tratarErros } from '../src/middlewares/tratarErros.js'

describe('GET /api/saude', () => {
  it('responde 200 com status ok', async () => {
    const resposta = await request(app).get('/api/saude')

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'ok' })
  })

  it('não expõe o cabeçalho x-powered-by', async () => {
    const resposta = await request(app).get('/api/saude')

    expect(resposta.headers['x-powered-by']).toBeUndefined()
  })
})

describe('tratamento de erros', () => {
  it('responde 404 em JSON para rota inexistente', async () => {
    const resposta = await request(app).get('/api/nao-existe')

    expect(resposta.status).toBe(404)
    expect(resposta.body.erro.codigo).toBe('rota_nao_encontrada')
  })

  it('responde 400 para JSON malformado', async () => {
    const resposta = await request(app)
      .post('/api/saude')
      .set('Content-Type', 'application/json')
      .send('{ quebrado')

    expect(resposta.status).toBe(400)
    expect(resposta.body.erro.codigo).toBe('json_invalido')
  })

  // App de teste isolado para simular rotas que lançam erros, sem
  // precisar criar rotas falsas no app real
  function appQueLanca(erro: unknown) {
    const appDeTeste = express()
    appDeTeste.get('/', () => {
      throw erro
    })
    appDeTeste.use(tratarErros)
    return appDeTeste
  }

  it('converte ErroDeNegocio no formato padrão', async () => {
    const erro = new ErroDeNegocio('teste', 'Mensagem de teste.', 409)

    const resposta = await request(appQueLanca(erro)).get('/')

    expect(resposta.status).toBe(409)
    expect(resposta.body).toEqual({
      erro: { codigo: 'teste', mensagem: 'Mensagem de teste.' },
    })
  })

  it('esconde o detalhe de erros inesperados', async () => {
    const erro = new Error('detalhe interno sigiloso')
    const erroOriginal = console.error
    console.error = () => {}

    const resposta = await request(appQueLanca(erro)).get('/')

    console.error = erroOriginal
    expect(resposta.status).toBe(500)
    expect(resposta.body.erro.codigo).toBe('erro_interno')
    expect(JSON.stringify(resposta.body)).not.toContain('sigiloso')
  })
})
