import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { tratarErros } from '../src/middlewares/tratarErros.js'
import {
  criarProtegerOrigem,
  listarOrigens,
} from '../src/middlewares/protegerOrigem.js'

// App mínimo só com o middleware, para testar o modo de produção, que o
// ambiente de teste (NODE_ENV=test) não exercita
function criarApp(config: Parameters<typeof criarProtegerOrigem>[0]) {
  const app = express()
  app.use(express.json())
  app.use(criarProtegerOrigem(config))
  app.get('/x', (_req, res) => res.json({ ok: true }))
  app.post('/x', (_req, res) => res.json({ ok: true }))
  app.use(tratarErros)
  return app
}

const SITE = 'https://instituto-health.vercel.app'
const DOMINIO = 'https://healthinstituto.com.br'

describe('listarOrigens', () => {
  it('separa por vírgula, tira espaços e barra final, e usa minúsculas', () => {
    expect(
      listarOrigens(` ${SITE}/ , HTTPS://HealthInstituto.com.br,, `),
    ).toEqual([SITE, DOMINIO])
  })

  it('valor ausente ou vazio vira lista vazia', () => {
    expect(listarOrigens(undefined)).toEqual([])
    expect(listarOrigens('  ')).toEqual([])
  })
})

describe('em produção', () => {
  const app = criarApp({
    producao: true,
    origensPermitidas: [SITE, DOMINIO],
  })

  it.each([SITE, DOMINIO])('aceita a Origin %s', async (origem) => {
    const resposta = await request(app)
      .post('/x')
      .set('Origin', origem)
      .send({ a: 1 })
    expect(resposta.status).toBe(200)
  })

  it('compara sem diferenciar maiúsculas', async () => {
    const resposta = await request(app)
      .post('/x')
      .set('Origin', SITE.toUpperCase())
      .send({})
    expect(resposta.status).toBe(200)
  })

  it('recusa POST sem Origin (403 no JSON padrão)', async () => {
    const resposta = await request(app).post('/x').send({})
    expect(resposta.status).toBe(403)
    expect(resposta.body).toEqual({
      erro: {
        codigo: 'origem_nao_permitida',
        mensagem: 'Origem não permitida.',
      },
    })
  })

  it('recusa Origin fora da lista, inclusive localhost', async () => {
    for (const origem of ['https://outro.example', 'http://localhost:5173']) {
      const resposta = await request(app)
        .post('/x')
        .set('Origin', origem)
        .send({})
      expect(resposta.status).toBe(403)
    }
  })

  it('não confunde subdomínio ou sufixo com a origem permitida', async () => {
    for (const origem of [
      `${SITE}.malicioso.example`,
      `https://x.${SITE.slice(8)}`,
    ]) {
      const resposta = await request(app)
        .post('/x')
        .set('Origin', origem)
        .send({})
      expect(resposta.status).toBe(403)
    }
  })

  it('GET não exige Origin', async () => {
    const resposta = await request(app).get('/x')
    expect(resposta.status).toBe(200)
  })

  it('Origin certa mas corpo que não é JSON: 415', async () => {
    const resposta = await request(app)
      .post('/x')
      .set('Origin', SITE)
      .set('Content-Type', 'text/plain')
      .send('a=1')
    expect(resposta.status).toBe(415)
  })

  it('Origin certa e sem corpo (logout) passa', async () => {
    const resposta = await request(app).post('/x').set('Origin', SITE)
    expect(resposta.status).toBe(200)
  })

  it('a resposta de recusa não repete a Origin enviada', async () => {
    const resposta = await request(app)
      .post('/x')
      .set('Origin', 'https://eco-da-origem.example')
      .send({})
    expect(JSON.stringify(resposta.body)).not.toContain('eco-da-origem')
  })
})

describe('em produção sem ORIGEM_FRONTEND (falha fechado)', () => {
  it('recusa tudo que altera dados e avisa no log sem valores', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = criarApp({ producao: true, origensPermitidas: [] })

    const comOrigem = await request(app).post('/x').set('Origin', SITE).send({})
    const semOrigem = await request(app).post('/x').send({})

    expect(comOrigem.status).toBe(403)
    expect(semOrigem.status).toBe(403)
    expect(aviso).toHaveBeenCalledTimes(1)
    expect(String(aviso.mock.calls[0]?.[0])).toContain('ORIGEM_FRONTEND')
    expect(String(aviso.mock.calls[0]?.[0])).not.toContain(SITE)
    aviso.mockRestore()
  })
})

describe('em desenvolvimento e testes', () => {
  const app = criarApp({ producao: false, origensPermitidas: [SITE] })

  it('aceita POST sem Origin', async () => {
    const resposta = await request(app).post('/x').send({})
    expect(resposta.status).toBe(200)
  })

  it('aceita localhost e a origem configurada, recusa as outras', async () => {
    const aceitas = ['http://localhost:5173', 'http://127.0.0.1:3000', SITE]
    for (const origem of aceitas) {
      const resposta = await request(app)
        .post('/x')
        .set('Origin', origem)
        .send({})
      expect(resposta.status).toBe(200)
    }
    const recusada = await request(app)
      .post('/x')
      .set('Origin', 'https://outro.example')
      .send({})
    expect(recusada.status).toBe(403)
  })
})
