import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api'

// fetch simulado: nenhum teste aqui chega ao backend
function simularFetch(resposta: Response | Error) {
  const fetchFalso = vi.fn<typeof fetch>(() =>
    resposta instanceof Error
      ? Promise.reject(resposta)
      : // clone: o corpo de um Response só pode ser lido uma vez, e alguns
        // testes chamam a API mais de uma vez
        Promise.resolve(resposta.clone()),
  )
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requisições', () => {
  it('POST envia JSON em caminho relativo /api, com cookies da mesma origem', async () => {
    const fetchFalso = simularFetch(
      json({ usuario: { id: 'u-1', email: 'a@b.com' }, perfil: {} }),
    )

    await api.login('a@b.com', 'senha-1234')

    expect(fetchFalso).toHaveBeenCalledTimes(1)
    const [url, opcoes] = fetchFalso.mock.calls[0] ?? []
    expect(url).toBe('/api/auth/login')
    expect(opcoes).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', senha: 'senha-1234' }),
    })
  })

  it('GET e logout não enviam corpo nem Content-Type', async () => {
    const fetchFalso = simularFetch(json({ usuario: {}, perfil: {} }))
    await api.eu()
    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/auth/eu')
    expect(fetchFalso.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      body: undefined,
      headers: undefined,
    })

    simularFetch(new Response(null, { status: 204 }))
    const fetchLogout = vi.mocked(fetch)
    await api.logout()
    expect(fetchLogout.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: undefined,
      headers: undefined,
    })
  })

  it('devolve o corpo da resposta de sucesso', async () => {
    simularFetch(json({ mensagem: 'ok' }, 201))

    await expect(
      api.cadastro({
        perfil: 'homecare',
        nome: 'Maria',
        email: 'a@b.com',
        senha: 'senha-1234',
      }),
    ).resolves.toEqual({ mensagem: 'ok' })
  })

  it('204 (logout) resolve sem corpo', async () => {
    simularFetch(new Response(null, { status: 204 }))

    await expect(api.logout()).resolves.toBeUndefined()
  })

  it('cada função usa o caminho e o corpo certos', async () => {
    const fetchFalso = simularFetch(json({ mensagem: 'ok' }))

    await api.confirmarEmail('a@b.com', '123456')
    await api.reenviarCodigo('a@b.com')
    await api.esqueciSenha('a@b.com')
    await api.redefinirSenha({
      email: 'a@b.com',
      codigo: '123456',
      novaSenha: 'nova-senha-1',
    })

    const chamadas = fetchFalso.mock.calls.map(([url, opcoes]) => [
      url,
      opcoes?.body,
    ])
    expect(chamadas).toEqual([
      [
        '/api/auth/confirmar-email',
        JSON.stringify({ email: 'a@b.com', codigo: '123456' }),
      ],
      ['/api/auth/reenviar-codigo', JSON.stringify({ email: 'a@b.com' })],
      ['/api/auth/esqueci-senha', JSON.stringify({ email: 'a@b.com' })],
      [
        '/api/auth/redefinir-senha',
        JSON.stringify({
          email: 'a@b.com',
          codigo: '123456',
          novaSenha: 'nova-senha-1',
        }),
      ],
    ])
  })
})

describe('erros', () => {
  it('erro da API vira ApiError com código, mensagem e status', async () => {
    simularFetch(
      json(
        {
          erro: {
            codigo: 'credenciais_invalidas',
            mensagem: 'E-mail ou senha incorretos.',
          },
        },
        401,
      ),
    )

    const erro = await api.login('a@b.com', 'errada').catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({
      codigo: 'credenciais_invalidas',
      message: 'E-mail ou senha incorretos.',
      status: 401,
    })
  })

  it('corpo de erro que não é JSON (página HTML do proxy) vira mensagem genérica', async () => {
    simularFetch(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    const erro = await api.eu().catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ codigo: 'erro_servidor', status: 502 })
    expect((erro as ApiError).message).not.toContain('Bad Gateway')
  })

  it('JSON de erro fora do formato esperado vira mensagem genérica', async () => {
    simularFetch(json({ erro: 'texto solto' }, 500))

    const erro = await api.eu().catch((e: unknown) => e)

    expect(erro).toMatchObject({ codigo: 'erro_servidor', status: 500 })
  })

  it('sucesso com corpo inválido vira erro, sem estourar SyntaxError', async () => {
    simularFetch(new Response('isso nao e json', { status: 200 }))

    const erro = await api.eu().catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ codigo: 'erro_servidor' })
  })

  it('falha de rede vira ApiError sem_conexao com mensagem em português', async () => {
    simularFetch(new TypeError('Failed to fetch'))

    const erro = await api.eu().catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ codigo: 'sem_conexao', status: 0 })
    expect((erro as ApiError).message).toMatch(/internet/)
    expect((erro as ApiError).message).not.toContain('Failed to fetch')
  })
})

describe('sessão', () => {
  it('nunca monta Authorization nem Cookie: a sessão é só dos cookies httpOnly', async () => {
    const fetchFalso = simularFetch(json({ usuario: {}, perfil: {} }))

    await api.login('a@b.com', 'senha-1234')
    await api.eu()
    await api.logout().catch(() => {})

    for (const [, opcoes] of fetchFalso.mock.calls) {
      const cabecalhos = Object.keys(
        (opcoes?.headers as Record<string, string> | undefined) ?? {},
      ).map((nome) => nome.toLowerCase())
      expect(cabecalhos).not.toContain('authorization')
      expect(cabecalhos).not.toContain('cookie')
      expect(opcoes?.credentials).toBe('same-origin')
    }
  })
})
