import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api'

// Respostas em sequência, uma por chamada de fetch: o envio do comprovante faz
// três (URL de envio, PUT do arquivo e confirmação). Nenhum teste chega ao
// backend nem ao Storage.
function simularSequencia(respostas: Array<Response | Error>) {
  const fetchFalso = vi.fn<typeof fetch>()
  for (const resposta of respostas) {
    fetchFalso.mockImplementationOnce(() =>
      resposta instanceof Error
        ? Promise.reject(resposta)
        : Promise.resolve(resposta),
    )
  }
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const URL_ASSINADA =
  'https://exemplo.supabase.co/storage/v1/object/upload/sign/b/p.pdf?token=TOKEN-SECRETO'

function arquivoDe(
  tamanho = 1000,
  nome = 'diploma.pdf',
  tipo = 'application/pdf',
) {
  return new File([new Uint8Array(tamanho)], nome, { type: tipo })
}

const respostasDeSucesso = () => [
  json({ caminho: 'u-1/abc.pdf', urlDeEnvio: URL_ASSINADA }),
  new Response('{}', { status: 200 }),
  json({ comprovante: { id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' } }, 201),
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('enviarComprovante', () => {
  it('pede a URL, envia o arquivo direto para ela e confirma, nessa ordem', async () => {
    const arquivo = arquivoDe()
    const fetchFalso = simularSequencia(respostasDeSucesso())

    const comprovante = await api.enviarComprovante(arquivo)

    expect(comprovante).toEqual({
      id: 'c-1',
      enviadoEm: '2026-10-22T10:00:00Z',
    })
    expect(fetchFalso).toHaveBeenCalledTimes(3)

    const [pedido, envio, confirmacao] = fetchFalso.mock.calls
    expect(pedido?.[0]).toBe('/api/comprovantes/url-de-envio')
    expect(pedido?.[1]?.body).toBe(
      JSON.stringify({ tipo: 'application/pdf', tamanho: 1000 }),
    )

    // O arquivo vai para a URL assinada, sem cookies nem Authorization
    expect(envio?.[0]).toBe(URL_ASSINADA)
    expect(envio?.[1]).toMatchObject({
      method: 'PUT',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/pdf' },
      body: arquivo,
    })

    expect(confirmacao?.[0]).toBe('/api/comprovantes/confirmar')
    expect(confirmacao?.[1]?.body).toBe(
      JSON.stringify({ caminho: 'u-1/abc.pdf' }),
    )
  })

  it('o arquivo nunca vai no corpo de uma chamada ao nosso backend', async () => {
    const fetchFalso = simularSequencia(respostasDeSucesso())

    await api.enviarComprovante(arquivoDe())

    for (const [url, opcoes] of fetchFalso.mock.calls) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        expect(typeof opcoes?.body).toBe('string')
      }
    }
  })

  it('JPG sem tipo no navegador é enviado como image/jpeg (vale a extensão)', async () => {
    const fetchFalso = simularSequencia(respostasDeSucesso())

    await api.enviarComprovante(arquivoDe(500, 'foto.JPG', ''))

    expect(fetchFalso.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ tipo: 'image/jpeg', tamanho: 500 }),
    )
    expect(fetchFalso.mock.calls[1]?.[1]?.headers).toEqual({
      'Content-Type': 'image/jpeg',
    })
  })

  it('HEIC é recusado antes de qualquer chamada, com mensagem em português', async () => {
    const fetchFalso = simularSequencia([])

    const erro = await api
      .enviarComprovante(arquivoDe(500, 'IMG_0001.HEIC', 'image/heic'))
      .catch((e: unknown) => e)

    expect(erro).toMatchObject({ codigo: 'tipo_nao_aceito' })
    expect((erro as Error).message).toBe(
      'Tipo de arquivo não aceito. Envie JPG, PNG ou PDF.',
    )
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it.each([
    [
      'tipo não aceito',
      () => arquivoDe(10, 'planilha.xlsx', 'application/vnd.ms-excel'),
      'tipo_nao_aceito',
    ],
    ['arquivo vazio', () => arquivoDe(0), 'arquivo_vazio'],
    [
      'maior que 10 MB',
      () => arquivoDe(10 * 1024 * 1024 + 1),
      'arquivo_grande',
    ],
  ])('recusa %s antes de qualquer chamada', async (_nome, criar, codigo) => {
    const fetchFalso = simularSequencia([])

    const erro = await api.enviarComprovante(criar()).catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ codigo })
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('aceita exatamente 10 MB', async () => {
    simularSequencia(respostasDeSucesso())

    await expect(
      api.enviarComprovante(arquivoDe(10 * 1024 * 1024)),
    ).resolves.toBeDefined()
  })

  it('falha ao pedir a URL (ex.: conta homecare, 403): para aí', async () => {
    const fetchFalso = simularSequencia([
      json(
        {
          erro: {
            codigo: 'comprovante_nao_se_aplica',
            mensagem: 'O comprovante é só para contas de profissionais.',
          },
        },
        403,
      ),
    ])

    const erro = await api
      .enviarComprovante(arquivoDe())
      .catch((e: unknown) => e)

    expect(erro).toMatchObject({
      codigo: 'comprovante_nao_se_aplica',
      status: 403,
    })
    expect(fetchFalso).toHaveBeenCalledTimes(1)
  })

  it('falha de rede no envio do arquivo: não confirma e não vaza a URL', async () => {
    const fetchFalso = simularSequencia([
      json({ caminho: 'u-1/abc.pdf', urlDeEnvio: URL_ASSINADA }),
      new TypeError('Failed to fetch'),
    ])

    const erro = await api
      .enviarComprovante(arquivoDe())
      .catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ codigo: 'falha_no_envio', status: 0 })
    expect((erro as ApiError).message).not.toContain('TOKEN-SECRETO')
    expect((erro as ApiError).message).not.toContain('supabase')
    expect(fetchFalso).toHaveBeenCalledTimes(2)
  })

  it('o Storage recusar o envio (ex.: token vencido, 403): não confirma', async () => {
    const fetchFalso = simularSequencia([
      json({ caminho: 'u-1/abc.pdf', urlDeEnvio: URL_ASSINADA }),
      new Response('{"error":"expired"}', { status: 403 }),
    ])

    const erro = await api
      .enviarComprovante(arquivoDe())
      .catch((e: unknown) => e)

    expect(erro).toMatchObject({ codigo: 'falha_no_envio', status: 403 })
    expect((erro as ApiError).message).not.toContain('expired')
    expect(fetchFalso).toHaveBeenCalledTimes(2)
  })

  it('o backend recusar o arquivo na confirmação: o erro sobe com a mensagem dele', async () => {
    simularSequencia([
      json({ caminho: 'u-1/abc.pdf', urlDeEnvio: URL_ASSINADA }),
      new Response('{}', { status: 200 }),
      json(
        {
          erro: {
            codigo: 'arquivo_invalido',
            mensagem: 'O arquivo enviado não é válido.',
          },
        },
        400,
      ),
    ])

    const erro = await api
      .enviarComprovante(arquivoDe())
      .catch((e: unknown) => e)

    expect(erro).toMatchObject({
      codigo: 'arquivo_invalido',
      message: 'O arquivo enviado não é válido.',
      status: 400,
    })
  })

  it('uma nova tentativa refaz as 3 etapas, com caminho novo', async () => {
    const fetchFalso = simularSequencia([
      json({ caminho: 'u-1/primeiro.pdf', urlDeEnvio: URL_ASSINADA }),
      new TypeError('Failed to fetch'),
      json({ caminho: 'u-1/segundo.pdf', urlDeEnvio: URL_ASSINADA }),
      new Response('{}', { status: 200 }),
      json({ comprovante: { id: 'c-1', enviadoEm: 'x' } }, 201),
    ])
    const arquivo = arquivoDe()

    await api.enviarComprovante(arquivo).catch(() => {})
    await api.enviarComprovante(arquivo)

    expect(fetchFalso).toHaveBeenCalledTimes(5)
    expect(fetchFalso.mock.calls[4]?.[1]?.body).toBe(
      JSON.stringify({ caminho: 'u-1/segundo.pdf' }),
    )
  })
})

describe('listarComprovantes', () => {
  it('GET /api/comprovantes devolve a lista', async () => {
    const fetchFalso = simularSequencia([
      json({ comprovantes: [{ id: 'c-1', enviadoEm: 'x' }] }),
    ])

    await expect(api.listarComprovantes()).resolves.toEqual({
      comprovantes: [{ id: 'c-1', enviadoEm: 'x' }],
    })
    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/comprovantes')
    expect(fetchFalso.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' })
  })
})
