import { beforeEach, describe, expect, it, vi } from 'vitest'

// Só o Storage da SDK é simulado, no formato REAL das respostas: o teste real
// contra o Supabase mostrou que `exists` devolve data=false COM um erro quando o
// arquivo não existe (e não data=false sem erro), e é isso que este arquivo
// protege.
const bucketFalso = vi.hoisted(() => ({
  exists: vi.fn(),
  info: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('../src/lib/supabase.js', () => ({
  supabaseAdmin: { storage: { from: () => bucketFalso } },
}))

const { comprovantesRepository } =
  await import('../src/repositories/comprovantes.repository.js')

beforeEach(() => {
  vi.resetAllMocks()
})

describe('obterInfo', () => {
  it('arquivo ausente (a SDK devolve data=false com erro): null, sem lançar', async () => {
    bucketFalso.exists.mockResolvedValue({
      data: false,
      error: new Error('Object not found'),
    })

    await expect(
      comprovantesRepository.obterInfo('u/x.pdf'),
    ).resolves.toBeNull()
    expect(bucketFalso.info).not.toHaveBeenCalled()
  })

  it('arquivo ausente sem erro junto: também null', async () => {
    bucketFalso.exists.mockResolvedValue({ data: false, error: null })

    await expect(
      comprovantesRepository.obterInfo('u/x.pdf'),
    ).resolves.toBeNull()
  })

  it('arquivo existente: devolve tamanho e tipo guardados', async () => {
    bucketFalso.exists.mockResolvedValue({ data: true, error: null })
    bucketFalso.info.mockResolvedValue({
      data: { size: 85, contentType: 'application/pdf' },
      error: null,
    })

    await expect(comprovantesRepository.obterInfo('u/x.pdf')).resolves.toEqual({
      tamanho: 85,
      tipo: 'application/pdf',
    })
  })

  it('metadados sem tamanho ou tipo viram 0 e texto vazio (a confirmação recusa)', async () => {
    bucketFalso.exists.mockResolvedValue({ data: true, error: null })
    bucketFalso.info.mockResolvedValue({ data: {}, error: null })

    await expect(comprovantesRepository.obterInfo('u/x.pdf')).resolves.toEqual({
      tamanho: 0,
      tipo: '',
    })
  })

  it('falha de verdade ao ler os metadados lança, sem repetir o detalhe do Supabase', async () => {
    bucketFalso.exists.mockResolvedValue({ data: true, error: null })
    bucketFalso.info.mockResolvedValue({
      data: null,
      error: new Error('detalhe interno com caminho u/x.pdf'),
    })

    const erro = await comprovantesRepository
      .obterInfo('u/x.pdf')
      .catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).not.toContain('u/x.pdf')
  })

  it('falha de rede no exists (a SDK lança): sobe como erro, não como arquivo ausente', async () => {
    bucketFalso.exists.mockRejectedValue(new Error('rede caiu'))

    await expect(comprovantesRepository.obterInfo('u/x.pdf')).rejects.toThrow()
  })
})
