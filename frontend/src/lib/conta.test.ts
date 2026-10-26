import { describe, expect, it } from 'vitest'
import {
  formatarData,
  podeEnviarComprovante,
  resumoDosEnviados,
  rotuloDoPerfil,
} from './conta'

describe('rotuloDoPerfil', () => {
  it.each([
    [{ tipo: 'profissional', status: 'pendente' }, 'Profissional, em análise'],
    [{ tipo: 'profissional', status: 'aprovado' }, 'Profissional, aprovado'],
    [
      { tipo: 'profissional', status: 'recusado' },
      'Profissional, comprovante não aprovado',
    ],
    // Home Care nasce aprovado e o status não aparece
    [{ tipo: 'homecare', status: 'aprovado' }, 'Home Care'],
    [{ tipo: 'homecare', status: 'pendente' }, 'Home Care'],
  ] as const)('%j vira "%s"', (perfil, esperado) => {
    expect(rotuloDoPerfil(perfil)).toBe(esperado)
  })
})

describe('podeEnviarComprovante', () => {
  it.each([
    ['profissional', 'pendente', true],
    ['profissional', 'recusado', true],
    ['profissional', 'aprovado', false],
    ['homecare', 'aprovado', false],
    ['homecare', 'pendente', false],
  ] as const)('%s %s: %s', (tipo, status, esperado) => {
    expect(podeEnviarComprovante({ tipo, status })).toBe(esperado)
  })
})

describe('formatarData', () => {
  it('formata em dia/mês/ano', () => {
    expect(formatarData('2026-10-22T10:00:00Z')).toBe('22/10/2026')
  })

  it('usa o dia de Brasília, não o de UTC', () => {
    // 01:30 UTC de 23/10 ainda é 22/10 à noite em Brasília (UTC-3)
    expect(formatarData('2026-10-23T01:30:00Z')).toBe('22/10/2026')
    expect(formatarData('2026-10-23T03:00:00Z')).toBe('23/10/2026')
  })

  it.each(['', 'ontem', '2026-13-45'])(
    'data inválida (%j) vira null',
    (iso) => {
      expect(formatarData(iso)).toBeNull()
    },
  )
})

describe('resumoDosEnviados', () => {
  it('nenhum comprovante: null', () => {
    expect(resumoDosEnviados([])).toBeNull()
  })

  it('um comprovante', () => {
    expect(resumoDosEnviados([{ enviadoEm: '2026-10-22T10:00:00Z' }])).toBe(
      'Comprovante enviado em 22/10/2026.',
    )
  })

  it('vários: conta e mostra o mais recente, qualquer que seja a ordem', () => {
    const lista = [
      { enviadoEm: '2026-10-20T10:00:00Z' },
      { enviadoEm: '2026-10-24T10:00:00Z' },
      { enviadoEm: '2026-10-22T10:00:00Z' },
    ]
    expect(resumoDosEnviados(lista)).toBe(
      '3 comprovantes enviados, o último em 24/10/2026.',
    )
    expect(resumoDosEnviados([...lista].reverse())).toBe(
      '3 comprovantes enviados, o último em 24/10/2026.',
    )
  })

  it('data inválida não quebra: a frase sai sem a data', () => {
    expect(resumoDosEnviados([{ enviadoEm: 'lixo' }])).toBe(
      'Comprovante enviado.',
    )
  })
})
