import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComprovantesRepository } from '../src/repositories/comprovantes.repository.js'
import { TAMANHO_MAXIMO_BYTES } from '../src/modules/comprovantes/comprovantes.regras.js'
import {
  criarComprovantesService,
  type PerfilDaSessao,
} from '../src/modules/comprovantes/comprovantes.service.js'

// Repository simulado: nenhum teste aqui toca o banco nem o bucket de verdade
function criarFakes() {
  const comprovantes = {
    contarRegistros: vi.fn<ComprovantesRepository['contarRegistros']>(),
    listarPorPerfil: vi.fn<ComprovantesRepository['listarPorPerfil']>(),
    buscarPorCaminho: vi.fn<ComprovantesRepository['buscarPorCaminho']>(),
    inserir: vi.fn<ComprovantesRepository['inserir']>(),
    contarArquivosNaPasta:
      vi.fn<ComprovantesRepository['contarArquivosNaPasta']>(),
    criarUrlDeEnvio: vi.fn<ComprovantesRepository['criarUrlDeEnvio']>(),
    obterInfo: vi.fn<ComprovantesRepository['obterInfo']>(),
    lerPrimeirosBytes: vi.fn<ComprovantesRepository['lerPrimeirosBytes']>(),
    removerArquivo: vi.fn<ComprovantesRepository['removerArquivo']>(),
  }
  comprovantes.contarRegistros.mockResolvedValue(0)
  comprovantes.contarArquivosNaPasta.mockResolvedValue(0)
  comprovantes.buscarPorCaminho.mockResolvedValue(null)
  comprovantes.criarUrlDeEnvio.mockResolvedValue(
    'https://exemplo.supabase.co/envio?token=SEGREDO-DE-TESTE',
  )
  comprovantes.removerArquivo.mockResolvedValue()
  comprovantes.inserir.mockImplementation((_perfilId, caminho) =>
    Promise.resolve({
      id: 'c-1',
      enviadoEm: `2026-10-22T10:00:00Z#${caminho}`,
    }),
  )
  return { comprovantes, service: criarComprovantesService({ comprovantes }) }
}

const ID = '11111111-1111-4111-8111-111111111111'
const OUTRO_ID = '22222222-2222-4222-8222-222222222222'
const UUID = '3a3a3a3a-3b3b-4c3c-8d3d-3e3e3e3e3e3e'

const profissional: PerfilDaSessao = {
  id: ID,
  tipo: 'profissional',
  status: 'pendente',
}

const PDF = Uint8Array.from('%PDF-1.7\n', (c) => c.charCodeAt(0))
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('gerarUrlDeEnvio', () => {
  it('gera o caminho <id da sessão>/<uuid>.<extensão> e devolve a URL', async () => {
    const { service, comprovantes } = criarFakes()

    const resultado = await service.gerarUrlDeEnvio(profissional, {
      tipo: 'application/pdf',
      tamanho: 1000,
    })

    expect(resultado.caminho).toMatch(new RegExp(`^${ID}/[0-9a-f-]{36}\\.pdf$`))
    expect(comprovantes.criarUrlDeEnvio).toHaveBeenCalledWith(resultado.caminho)
    expect(resultado.urlDeEnvio).toContain('token=')
  })

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['application/pdf', 'pdf'],
  ] as const)(
    'a extensão de %s é %s, vinda do tipo',
    async (tipo, extensao) => {
      const { service } = criarFakes()

      const { caminho } = await service.gerarUrlDeEnvio(profissional, {
        tipo,
        tamanho: 1,
      })

      expect(caminho.endsWith(`.${extensao}`)).toBe(true)
    },
  )

  it('cada pedido recebe um caminho diferente', async () => {
    const { service } = criarFakes()
    const entrada = { tipo: 'image/png', tamanho: 10 } as const

    const a = await service.gerarUrlDeEnvio(profissional, entrada)
    const b = await service.gerarUrlDeEnvio(profissional, entrada)

    expect(a.caminho).not.toBe(b.caminho)
  })

  it('profissional recusado também pode reenviar', async () => {
    const { service } = criarFakes()

    await expect(
      service.gerarUrlDeEnvio(
        { ...profissional, status: 'recusado' },
        { tipo: 'image/png', tamanho: 10 },
      ),
    ).resolves.toBeDefined()
  })

  it('homecare: 403, sem tocar no Storage', async () => {
    const { service, comprovantes } = criarFakes()

    await expect(
      service.gerarUrlDeEnvio(
        { ...profissional, tipo: 'homecare', status: 'aprovado' },
        { tipo: 'image/png', tamanho: 10 },
      ),
    ).rejects.toMatchObject({
      codigo: 'comprovante_nao_se_aplica',
      status: 403,
    })
    expect(comprovantes.criarUrlDeEnvio).not.toHaveBeenCalled()
  })

  it('profissional já aprovado: 409', async () => {
    const { service, comprovantes } = criarFakes()

    await expect(
      service.gerarUrlDeEnvio(
        { ...profissional, status: 'aprovado' },
        { tipo: 'image/png', tamanho: 10 },
      ),
    ).rejects.toMatchObject({ codigo: 'conta_ja_aprovada', status: 409 })
    expect(comprovantes.criarUrlDeEnvio).not.toHaveBeenCalled()
  })

  it('5 comprovantes registrados: 429', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.contarRegistros.mockResolvedValue(5)

    await expect(
      service.gerarUrlDeEnvio(profissional, { tipo: 'image/png', tamanho: 10 }),
    ).rejects.toMatchObject({ codigo: 'limite_de_comprovantes', status: 429 })
    expect(comprovantes.criarUrlDeEnvio).not.toHaveBeenCalled()
  })

  it('10 arquivos na pasta: 429', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.contarArquivosNaPasta.mockResolvedValue(10)

    await expect(
      service.gerarUrlDeEnvio(profissional, { tipo: 'image/png', tamanho: 10 }),
    ).rejects.toMatchObject({ status: 429 })
  })

  it('4 registrados e 9 na pasta ainda passam', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.contarRegistros.mockResolvedValue(4)
    comprovantes.contarArquivosNaPasta.mockResolvedValue(9)

    await expect(
      service.gerarUrlDeEnvio(profissional, { tipo: 'image/png', tamanho: 10 }),
    ).resolves.toBeDefined()
  })

  it('a URL assinada (credencial) nunca vai para o log', async () => {
    const { service } = criarFakes()
    const aviso = vi.spyOn(console, 'warn')
    const erro = vi.spyOn(console, 'error')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    await service.gerarUrlDeEnvio(profissional, {
      tipo: 'image/png',
      tamanho: 10,
    })

    for (const espiao of [aviso, erro, log]) {
      expect(JSON.stringify(espiao.mock.calls)).not.toContain(
        'SEGREDO-DE-TESTE',
      )
    }
  })
})

describe('confirmar', () => {
  const caminho = `${ID}/${UUID}.pdf`

  function prepararArquivoValido(
    comprovantes: ReturnType<typeof criarFakes>['comprovantes'],
  ) {
    comprovantes.obterInfo.mockResolvedValue({
      tamanho: 2000,
      tipo: 'application/pdf',
    })
    comprovantes.lerPrimeirosBytes.mockResolvedValue(PDF)
  }

  it('arquivo no bucket e válido: grava uma vez para o perfil da sessão', async () => {
    const { service, comprovantes } = criarFakes()
    prepararArquivoValido(comprovantes)

    const resultado = await service.confirmar(profissional, { caminho })

    expect(resultado.criado).toBe(true)
    expect(comprovantes.inserir).toHaveBeenCalledTimes(1)
    expect(comprovantes.inserir).toHaveBeenCalledWith(ID, caminho)
    expect(comprovantes.removerArquivo).not.toHaveBeenCalled()
  })

  it('confirmar de novo devolve o mesmo registro sem gravar outra vez', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.buscarPorCaminho.mockResolvedValue({
      id: 'c-1',
      enviadoEm: '2026-10-22T10:00:00Z',
    })

    const resultado = await service.confirmar(profissional, { caminho })

    expect(resultado).toEqual({
      comprovante: { id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' },
      criado: false,
    })
    expect(comprovantes.inserir).not.toHaveBeenCalled()
    expect(comprovantes.obterInfo).not.toHaveBeenCalled()
  })

  it.each([
    ['arquivo de outra pessoa', `${OUTRO_ID}/${UUID}.pdf`],
    ['com ../', `${ID}/../${OUTRO_ID}/${UUID}.pdf`],
    ['subpasta extra', `${ID}/x/${UUID}.pdf`],
    ['nome que não é uuid', `${ID}/meu-diploma.pdf`],
    ['extensão não aceita', `${ID}/${UUID}.exe`],
    ['extensão heic (não aceita)', `${ID}/${UUID}.heic`],
    ['extensão dupla', `${ID}/${UUID}.pdf.exe`],
    ['com query', `${ID}/${UUID}.pdf?x=1`],
    ['sem pasta', `${UUID}.pdf`],
    [
      'caminho do bucket inteiro',
      `comprovantes-profissionais/${ID}/${UUID}.pdf`,
    ],
    ['uuid em maiúsculas', `${ID}/${UUID.toUpperCase()}.pdf`],
  ])(
    'recusa caminho inválido (%s) sem tocar no Storage',
    async (_nome, invalido) => {
      const { service, comprovantes } = criarFakes()

      await expect(
        service.confirmar(profissional, { caminho: invalido }),
      ).rejects.toMatchObject({ codigo: 'caminho_invalido', status: 400 })
      expect(comprovantes.obterInfo).not.toHaveBeenCalled()
      expect(comprovantes.removerArquivo).not.toHaveBeenCalled()
      expect(comprovantes.inserir).not.toHaveBeenCalled()
    },
  )

  it('arquivo que não está no bucket: 400 e nada é gravado nem apagado', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.obterInfo.mockResolvedValue(null)

    await expect(
      service.confirmar(profissional, { caminho }),
    ).rejects.toMatchObject({ codigo: 'arquivo_nao_encontrado', status: 400 })
    expect(comprovantes.inserir).not.toHaveBeenCalled()
    expect(comprovantes.removerArquivo).not.toHaveBeenCalled()
  })

  it.each([
    [
      'grande demais',
      { tamanho: TAMANHO_MAXIMO_BYTES + 1, tipo: 'application/pdf' },
    ],
    ['vazio', { tamanho: 0, tipo: 'application/pdf' }],
    ['tipo guardado diferente da extensão', { tamanho: 10, tipo: 'image/png' }],
    ['sem tipo guardado', { tamanho: 10, tipo: '' }],
    ['tipo fora da lista', { tamanho: 10, tipo: 'text/html' }],
  ])('arquivo %s: apaga do bucket e responde 400', async (_nome, info) => {
    const { service, comprovantes } = criarFakes()
    comprovantes.obterInfo.mockResolvedValue(info)
    comprovantes.lerPrimeirosBytes.mockResolvedValue(PDF)

    await expect(
      service.confirmar(profissional, { caminho }),
    ).rejects.toMatchObject({ codigo: 'arquivo_invalido', status: 400 })
    expect(comprovantes.removerArquivo).toHaveBeenCalledWith(caminho)
    expect(comprovantes.inserir).not.toHaveBeenCalled()
  })

  it('aceita tipo guardado com parâmetros e em maiúsculas', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.obterInfo.mockResolvedValue({
      tamanho: 10,
      tipo: 'Application/PDF; charset=binary',
    })
    comprovantes.lerPrimeirosBytes.mockResolvedValue(PDF)

    await expect(
      service.confirmar(profissional, { caminho }),
    ).resolves.toMatchObject({ criado: true })
  })

  it('conteúdo que não é do tipo declarado (png rotulado como pdf): apaga e 400', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.obterInfo.mockResolvedValue({
      tamanho: 10,
      tipo: 'application/pdf',
    })
    comprovantes.lerPrimeirosBytes.mockResolvedValue(PNG)

    await expect(
      service.confirmar(profissional, { caminho }),
    ).rejects.toMatchObject({ codigo: 'arquivo_invalido' })
    expect(comprovantes.removerArquivo).toHaveBeenCalledWith(caminho)
    expect(comprovantes.inserir).not.toHaveBeenCalled()
  })

  it('se não conseguir apagar o arquivo inválido, ainda responde 400', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.obterInfo.mockResolvedValue({ tamanho: 0, tipo: '' })
    comprovantes.removerArquivo.mockRejectedValue(new Error('falhou'))

    await expect(
      service.confirmar(profissional, { caminho }),
    ).rejects.toMatchObject({ codigo: 'arquivo_invalido' })
    expect(console.warn).toHaveBeenCalled()
  })

  it('5 registrados: 429, sem consultar o Storage', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.contarRegistros.mockResolvedValue(5)

    await expect(
      service.confirmar(profissional, { caminho }),
    ).rejects.toMatchObject({ status: 429 })
    expect(comprovantes.obterInfo).not.toHaveBeenCalled()
  })

  it('homecare e aprovado não confirmam, sem tocar no Storage', async () => {
    const { service, comprovantes } = criarFakes()

    await expect(
      service.confirmar({ ...profissional, tipo: 'homecare' }, { caminho }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      service.confirmar({ ...profissional, status: 'aprovado' }, { caminho }),
    ).rejects.toMatchObject({ status: 409 })
    expect(comprovantes.obterInfo).not.toHaveBeenCalled()
    expect(comprovantes.inserir).not.toHaveBeenCalled()
  })
})

describe('listar', () => {
  it('lista só os comprovantes do perfil pedido, sem caminho', async () => {
    const { service, comprovantes } = criarFakes()
    comprovantes.listarPorPerfil.mockResolvedValue([
      { id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' },
    ])

    const resposta = await service.listar(ID)

    expect(comprovantes.listarPorPerfil).toHaveBeenCalledWith(ID)
    expect(resposta).toEqual({
      comprovantes: [{ id: 'c-1', enviadoEm: '2026-10-22T10:00:00Z' }],
    })
    expect(JSON.stringify(resposta)).not.toContain('/')
  })
})
