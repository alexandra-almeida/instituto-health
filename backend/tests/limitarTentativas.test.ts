import express from 'express'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chaveDoLimite,
  criarLimitarTentativas,
  ipDoCliente,
} from '../src/middlewares/limitarTentativas.js'
import { tratarErros } from '../src/middlewares/tratarErros.js'
import { criarCronService } from '../src/modules/cron/cron.service.js'

const SEGREDO = 'segredo-de-teste-do-limite'

// Contador em memória com a MESMA regra da função do banco (janela fixa), para
// provar o comportamento do middleware sem Supabase
function limitesEmMemoria(agora: () => number) {
  const janelas = new Map<string, { inicio: number; contagem: number }>()
  const chamadas: Array<{ chave: string; limite: number; janela: number }> = []
  return {
    chamadas,
    async registrar(chave: string, limite: number, janelaSegundos: number) {
      chamadas.push({ chave, limite, janela: janelaSegundos })
      const atual = janelas.get(chave)
      const venceu = !atual || agora() - atual.inicio >= janelaSegundos * 1000
      const janela = venceu
        ? { inicio: agora(), contagem: 1 }
        : { inicio: atual.inicio, contagem: atual.contagem + 1 }
      janelas.set(chave, janela)
      return {
        excedeu: janela.contagem > limite,
        esperaSegundos: Math.max(
          1,
          Math.ceil((janela.inicio + janelaSegundos * 1000 - agora()) / 1000),
        ),
      }
    },
  }
}

function montarApp(
  limites: Pick<ReturnType<typeof limitesEmMemoria>, 'registrar'>,
  limite = 3,
) {
  const app = express()
  app.post(
    '/teste',
    criarLimitarTentativas(
      { rota: 'teste', limite, janelaSegundos: 600 },
      { limites, segredo: SEGREDO },
    ),
    (_req, res) => {
      res.json({ ok: true })
    },
  )
  app.use(tratarErros)
  return app
}

const de = (app: express.Express, ip: string) =>
  request(app).post('/teste').set('X-Forwarded-For', ip)

let agoraEmMs = 0
beforeEach(() => {
  agoraEmMs = 1_000_000
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('limitarTentativas', () => {
  it('deixa passar até o limite e responde 429 com Retry-After depois', async () => {
    const app = montarApp(
      limitesEmMemoria(() => agoraEmMs),
      3,
    )
    for (let i = 0; i < 3; i++) {
      expect((await de(app, '203.0.113.9')).status).toBe(200)
    }
    const r = await de(app, '203.0.113.9')
    expect(r.status).toBe(429)
    expect(r.body.erro.codigo).toBe('muitas_tentativas')
    expect(Number(r.headers['retry-after'])).toBeGreaterThan(0)
    expect(Number(r.headers['retry-after'])).toBeLessThanOrEqual(600)
  })

  it('a janela reinicia depois do tempo', async () => {
    const app = montarApp(
      limitesEmMemoria(() => agoraEmMs),
      1,
    )
    expect((await de(app, '203.0.113.9')).status).toBe(200)
    expect((await de(app, '203.0.113.9')).status).toBe(429)
    agoraEmMs += 601_000
    expect((await de(app, '203.0.113.9')).status).toBe(200)
  })

  it('IPs diferentes têm contadores independentes', async () => {
    const app = montarApp(
      limitesEmMemoria(() => agoraEmMs),
      1,
    )
    expect((await de(app, '203.0.113.1')).status).toBe(200)
    expect((await de(app, '203.0.113.1')).status).toBe(429)
    expect((await de(app, '203.0.113.2')).status).toBe(200)
  })

  it('só o primeiro IP de x-forwarded-for conta (o resto é da cadeia de proxies)', async () => {
    const app = montarApp(
      limitesEmMemoria(() => agoraEmMs),
      1,
    )
    expect((await de(app, '203.0.113.1, 10.0.0.1')).status).toBe(200)
    expect((await de(app, '203.0.113.1, 10.0.0.99')).status).toBe(429)
  })

  it('rotas diferentes têm contadores diferentes para o mesmo IP', () => {
    expect(chaveDoLimite('cotacao', '203.0.113.1', SEGREDO)).not.toBe(
      chaveDoLimite('pedido', '203.0.113.1', SEGREDO),
    )
  })

  it('o IP nunca vai em claro: a chave é um hash e não revela o IP', async () => {
    const limites = limitesEmMemoria(() => agoraEmMs)
    const app = montarApp(limites, 5)
    await de(app, '203.0.113.77')
    const { chave } = limites.chamadas[0]!
    expect(chave).toMatch(/^[0-9a-f]{40}$/)
    expect(chave).not.toContain('203')
    expect(chave).toBe(chaveDoLimite('teste', '203.0.113.77', SEGREDO))
    // o segredo muda a chave (não dá para refazer o hash sem ele)
    expect(chave).not.toBe(chaveDoLimite('teste', '203.0.113.77', 'outro'))
    expect(JSON.stringify(limites.chamadas)).not.toContain('203.0.113.77')
  })

  it('falha do banco: a requisição PASSA, com aviso no log e sem o IP', async () => {
    const app = montarApp({
      registrar: vi.fn().mockRejectedValue(new Error('banco fora do ar')),
    })
    const r = await de(app, '203.0.113.5')
    expect(r.status).toBe(200)
    const avisos = vi.mocked(console.warn).mock.calls.flat().join(' ')
    expect(avisos).toMatch(/falha no banco, requisição liberada/)
    expect(avisos).not.toContain('203.0.113.5')
  })

  it('resposta estranha do banco (sem retorno) também libera a requisição', async () => {
    const app = montarApp({ registrar: vi.fn().mockResolvedValue(undefined) })
    expect((await de(app, '203.0.113.6')).status).toBe(200)
  })
})

describe('ipDoCliente', () => {
  const req = (cabecalho: unknown, remoto = '10.1.1.1') =>
    ({
      headers: { 'x-forwarded-for': cabecalho },
      socket: { remoteAddress: remoto },
    }) as never

  it('usa o primeiro x-forwarded-for, e o endereço da conexão se não houver', () => {
    expect(ipDoCliente(req('203.0.113.1, 10.0.0.1'))).toBe('203.0.113.1')
    expect(ipDoCliente(req(['203.0.113.2, x', 'y']))).toBe('203.0.113.2')
    expect(ipDoCliente(req(undefined))).toBe('10.1.1.1')
    expect(ipDoCliente(req(''))).toBe('10.1.1.1')
  })
})

describe('faxina das janelas vencidas (rotina agendada)', () => {
  const batimentos = {
    registrar: vi.fn().mockResolvedValue(undefined),
    ler: vi.fn().mockResolvedValue(new Date(2_000_000_000_000)),
  }

  it('apaga as janelas com mais de 1 dia depois do batimento', async () => {
    const limparVencidos = vi.fn().mockResolvedValue(3)
    const servico = criarCronService({
      batimentos,
      limites: { limparVencidos },
      agora: () => new Date(1_000_000_000_000),
    })
    expect(await servico.manterAtivo()).toEqual({ ok: true })
    expect(limparVencidos).toHaveBeenCalledWith(86400)
  })

  it('se a faxina falhar, o despertador continua ok (só um aviso)', async () => {
    const servico = criarCronService({
      batimentos,
      limites: { limparVencidos: vi.fn().mockRejectedValue(new Error('x')) },
      agora: () => new Date(1_000_000_000_000),
    })
    expect(await servico.manterAtivo()).toEqual({ ok: true })
    expect(vi.mocked(console.warn).mock.calls.flat().join(' ')).toMatch(
      /limpar os limites/,
    )
  })
})
