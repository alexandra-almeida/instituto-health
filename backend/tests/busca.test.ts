import { describe, expect, it } from 'vitest'
import {
  filtroDeBusca,
  limparBusca,
  padraoDeBusca,
  TAMANHO_MAXIMO_DA_BUSCA,
} from '../src/lib/busca.js'

describe('limparBusca', () => {
  it('tira espaços das pontas e vazio vira "sem busca"', () => {
    expect(limparBusca('  ana  ')).toBe('ana')
    expect(limparBusca('   ')).toBeUndefined()
    expect(limparBusca(undefined)).toBeUndefined()
  })

  it('troca caracteres de controle por espaço e corta em 100', () => {
    expect(limparBusca('a\u0000b\nc')).toBe('a b c')
    expect(limparBusca('x'.repeat(500))).toHaveLength(TAMANHO_MAXIMO_DA_BUSCA)
  })
})

describe('padraoDeBusca', () => {
  it('busca por trecho, entre aspas', () => {
    expect(padraoDeBusca('ana')).toBe('"%ana%"')
  })

  it('escapa os curingas do LIKE: % e _ viram texto comum', () => {
    expect(padraoDeBusca('100%')).toBe('"%100\\\\%%"')
    expect(padraoDeBusca('a_b')).toBe('"%a\\\\_b%"')
  })

  it('escapa aspas e barras para não fechar o valor antes da hora', () => {
    expect(padraoDeBusca('a"b')).toBe('"%a\\"b%"')
    expect(padraoDeBusca('a\\b')).toBe('"%a\\\\\\\\b%"')
  })

  it('vírgula, parênteses e ponto ficam presos dentro das aspas', () => {
    const filtro = filtroDeBusca('x),email.eq.(y')
    // Um termo malicioso não consegue criar outra condição: continua sendo
    // só o texto do ilike de nome e de e-mail
    expect(filtro).toBe(
      'nome.ilike."%x),email.eq.(y%",email.ilike."%x),email.eq.(y%"',
    )
  })
})
