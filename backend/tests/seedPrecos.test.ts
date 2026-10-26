import { describe, expect, it } from 'vitest'
import {
  compararPrecos,
  converterPreco,
  lerPlanilhaDePrecos,
  semPrecoProfissional,
} from '../../database/seeds/lib/precos.js'

const SKUS = new Set(['a-b-1ml-0', 'c-d-2g-1', 'e-f-3g-2'])

describe('converterPreco (devolve centavos)', () => {
  it.each([
    ['129,90', 12990],
    ['129.90', 12990],
    ['1.299,90', 129990],
    ['R$ 129,90', 12990],
    ['R$129', 12900],
    ['129', 12900],
    ['0,5', 50],
    ['0.05', 5],
    ['  35,9  ', 3590],
    ['1.234,5', 123450],
  ])('"%s" vira %i centavos', (bruto, esperado) => {
    expect(converterPreco(bruto)).toBe(esperado)
  })

  it.each([
    '',
    'abc',
    '0',
    '0,00',
    '-5',
    '12,345',
    '12.345',
    '1,2,3',
    '10 reais',
    '9999999999',
  ])('"%s" é inválido', (bruto) => {
    expect(converterPreco(bruto)).toBeNull()
  })

  it('não arredonda em silêncio: 3 casas é recusado', () => {
    expect(converterPreco('10,999')).toBeNull()
  })
})

describe('lerPlanilhaDePrecos', () => {
  it('lê com ; e vírgula decimal (padrão do Excel brasileiro)', () => {
    const r = lerPlanilhaDePrecos(
      'sku;preco\na-b-1ml-0;129,90\nc-d-2g-1;35,9\n',
      SKUS,
    )

    expect(r.problemas).toEqual([])
    expect(r.linhas).toEqual([
      { sku: 'a-b-1ml-0', centavos: 12990 },
      { sku: 'c-d-2g-1', centavos: 3590 },
    ])
  })

  it('lê com vírgula como separador e ponto decimal', () => {
    const r = lerPlanilhaDePrecos('sku,preco\na-b-1ml-0,129.90\n', SKUS)
    expect(r.problemas).toEqual([])
    expect(r.linhas).toEqual([{ sku: 'a-b-1ml-0', centavos: 12990 }])
  })

  it('aceita preço com vírgula decimal entre aspas quando o separador é vírgula', () => {
    const r = lerPlanilhaDePrecos('sku,preco\na-b-1ml-0,"1.299,90"\n', SKUS)
    expect(r.problemas).toEqual([])
    expect(r.linhas[0]?.centavos).toBe(129990)
  })

  it('ignora BOM, linhas em branco, CRLF, maiúsculas no cabeçalho e colunas extras', () => {
    const texto =
      '﻿Nome;SKU;Preco\r\nA B;a-b-1ml-0;10,00\r\n\r\nC D;c-d-2g-1;20,00\r\n'
    const r = lerPlanilhaDePrecos(texto, SKUS)

    expect(r.problemas).toEqual([])
    expect(r.linhas.map((l) => l.sku)).toEqual(['a-b-1ml-0', 'c-d-2g-1'])
  })

  it('vírgula decimal sem aspas num arquivo separado por vírgula é erro claro', () => {
    const r = lerPlanilhaDePrecos('sku,preco\na-b-1ml-0,129,90\n', SKUS)
    expect(r.linhas).toEqual([])
    expect(r.problemas[0]).toMatch(/3 colunas em vez de 2/)
    expect(r.problemas[0]).toMatch(/use ;/)
  })

  it.each([
    ['arquivo vazio', ''],
    ['só espaços', '  \n \n'],
    ['sem a coluna preco', 'sku;valor\na-b-1ml-0;10\n'],
    ['sem a coluna sku', 'codigo;preco\na-b-1ml-0;10\n'],
  ])('%s: problema e nenhuma linha', (_nome, texto) => {
    const r = lerPlanilhaDePrecos(texto, SKUS)
    expect(r.problemas).toHaveLength(1)
    expect(r.linhas).toEqual([])
  })

  it('sku que não existe em produtos é problema', () => {
    const r = lerPlanilhaDePrecos('sku;preco\nnao-existe-1ml-9;10\n', SKUS)
    expect(r.problemas).toEqual([
      'linha 2: o sku "nao-existe-1ml-9" não existe em produtos.',
    ])
  })

  it('sku repetido é problema', () => {
    const r = lerPlanilhaDePrecos(
      'sku;preco\na-b-1ml-0;10\na-b-1ml-0;20\n',
      SKUS,
    )
    expect(r.problemas).toEqual([
      'linha 3: o sku "a-b-1ml-0" aparece mais de uma vez.',
    ])
    expect(r.linhas).toHaveLength(1)
  })

  it('preço inválido é problema, e a mensagem NÃO repete o valor digitado', () => {
    const r = lerPlanilhaDePrecos('sku;preco\na-b-1ml-0;777,777\n', SKUS)
    expect(r.problemas).toHaveLength(1)
    expect(r.problemas[0]).toMatch(/preço inválido para o sku "a-b-1ml-0"/)
    expect(r.problemas[0]).not.toContain('777')
  })

  it('número de colunas errado em uma linha é problema só dela', () => {
    const r = lerPlanilhaDePrecos('sku;preco\na-b-1ml-0\nc-d-2g-1;20\n', SKUS)
    expect(r.problemas).toHaveLength(1)
    expect(r.problemas[0]).toMatch(/^linha 2:/)
    expect(r.linhas.map((l) => l.sku)).toEqual(['c-d-2g-1'])
  })

  it('o arquivo de exemplo do repositório usa skus que não existem (não vira preço de verdade por engano)', () => {
    const r = lerPlanilhaDePrecos('sku;preco\nexemplo-de-sku-0;123,45\n', SKUS)
    expect(r.linhas).toEqual([])
    expect(r.problemas).toHaveLength(1)
  })
})

describe('compararPrecos', () => {
  it('banco vazio: tudo é novo', () => {
    const r = compararPrecos([{ sku: 'a-b-1ml-0', centavos: 1000 }], [])
    expect(r).toEqual({
      novos: ['a-b-1ml-0'],
      alterados: [],
      iguais: 0,
      ausentesNaPlanilha: [],
    })
  })

  it('separa novos, alterados, iguais e ausentes na planilha, sem expor valores', () => {
    const r = compararPrecos(
      [
        { sku: 'a-b-1ml-0', centavos: 1000 },
        { sku: 'c-d-2g-1', centavos: 2500 },
        { sku: 'e-f-3g-2', centavos: 999 },
      ],
      [
        { sku: 'a-b-1ml-0', preco: 10 },
        { sku: 'c-d-2g-1', preco: '30.00' },
        { sku: 'velho-1ml-9', preco: 5 },
      ],
    )

    expect(r.iguais).toBe(1)
    expect(r.alterados).toEqual(['c-d-2g-1'])
    expect(r.novos).toEqual(['e-f-3g-2'])
    expect(r.ausentesNaPlanilha).toEqual(['velho-1ml-9'])
    // o resultado só tem skus e contagem, nenhum preço
    expect(JSON.stringify(r)).not.toMatch(/2500|30\.00|999/)
  })
})

describe('semPrecoProfissional', () => {
  const produtos = [
    { sku: 'a-b-1ml-0', nome: 'A', exclusivo_profissional: true, ativo: true },
    { sku: 'c-d-2g-1', nome: 'C', exclusivo_profissional: true, ativo: true },
    { sku: 'e-f-3g-2', nome: 'E', exclusivo_profissional: false, ativo: true },
    { sku: 'g-h-4g-3', nome: 'G', exclusivo_profissional: true, ativo: false },
  ]

  it('lista os exclusivos ativos sem preço', () => {
    const r = semPrecoProfissional(produtos, new Set(['a-b-1ml-0']))
    expect(r.map((p) => p.sku)).toEqual(['c-d-2g-1'])
  })

  it('não lista não exclusivos (têm preço público) nem inativos', () => {
    const r = semPrecoProfissional(produtos, new Set())
    expect(r.map((p) => p.sku)).toEqual(['a-b-1ml-0', 'c-d-2g-1'])
  })

  it('com todos os preços, não sobra ninguém', () => {
    const r = semPrecoProfissional(produtos, new Set(['a-b-1ml-0', 'c-d-2g-1']))
    expect(r).toEqual([])
  })
})
