import { beforeEach, describe, expect, it, vi } from 'vitest'

// Só a SDK é simulada, no formato das respostas dela ({ data, error }). O que
// este arquivo protege: a linha é sempre a de id 1 e o erro nunca repete a
// mensagem do banco (só o código).
const tabelaFalsa = vi.hoisted(() => ({
  upsert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}))
vi.mock('../src/lib/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn(() => tabelaFalsa) },
}))

const { batimentosRepository } =
  await import('../src/repositories/batimentos.repository.js')

beforeEach(() => {
  vi.resetAllMocks()
  tabelaFalsa.select.mockReturnValue(tabelaFalsa)
  tabelaFalsa.eq.mockReturnValue(tabelaFalsa)
})

describe('registrar', () => {
  it('faz upsert da linha única (id 1) com a data em ISO', async () => {
    tabelaFalsa.upsert.mockResolvedValue({ error: null })
    const instante = new Date('2026-10-31T12:00:00.000Z')

    await batimentosRepository.registrar(instante)

    expect(tabelaFalsa.upsert).toHaveBeenCalledWith({
      id: 1,
      ultimo_em: '2026-10-31T12:00:00.000Z',
    })
  })

  it('erro do banco: lança só com o código, sem a mensagem', async () => {
    tabelaFalsa.upsert.mockResolvedValue({
      error: { code: '42P01', message: 'relation "batimentos" does not exist' },
    })

    const falha = batimentosRepository.registrar(new Date())

    await expect(falha).rejects.toThrow('Falha ao registrar batimento (42P01)')
    await expect(falha).rejects.not.toThrow('does not exist')
  })
})

describe('ler', () => {
  it('lê a linha de id 1 e devolve a data', async () => {
    tabelaFalsa.maybeSingle.mockResolvedValue({
      data: { ultimo_em: '2026-10-31T12:00:00+00:00' },
      error: null,
    })

    const lida = await batimentosRepository.ler()

    expect(tabelaFalsa.select).toHaveBeenCalledWith('ultimo_em')
    expect(tabelaFalsa.eq).toHaveBeenCalledWith('id', 1)
    expect(lida?.toISOString()).toBe('2026-10-31T12:00:00.000Z')
  })

  it('linha ausente: null', async () => {
    tabelaFalsa.maybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(batimentosRepository.ler()).resolves.toBeNull()
  })

  it('erro do banco: lança só com o código', async () => {
    tabelaFalsa.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'detalhe interno' },
    })

    await expect(batimentosRepository.ler()).rejects.toThrow(
      'Falha ao ler batimento (PGRST205)',
    )
  })
})
