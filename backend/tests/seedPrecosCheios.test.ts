import { describe, expect, it } from 'vitest'
import {
  centavosParaNumeric,
  compararPrecosCheios,
  lerPlanilhaDePrecosCheios,
} from '../../database/seeds/lib/precosCheios.js'

// a-1 e a-2 e a-3 são exclusivos; p-1 é produto público; só os exclusivos
// entram na planilha
const CATALOGO = {
  todos: new Set(['a-1', 'a-2', 'a-3', 'p-1']),
  exclusivos: new Set(['a-1', 'a-2', 'a-3']),
}

const CABECALHO = 'categoria;produto;tamanho;preco_cheio;sku'

function planilha(...linhas: string[]) {
  return [CABECALHO, ...linhas].join('\n')
}

describe('lerPlanilhaDePrecosCheios', () => {
  it('lê a planilha do formato combinado: preço em reais, linha vazia sem preço', () => {
    const { linhas, problemas } = lerPlanilhaDePrecosCheios(
      planilha(
        'Ampolas;Produto A;5ml;129,90;a-1',
        'Kits;Produto B;kit;1.234,50;a-2',
        'Kits;Produto C;kit;;a-3',
      ),
      CATALOGO,
    )
    expect(problemas).toEqual([])
    expect(linhas).toEqual([
      { sku: 'a-1', centavos: 12990 },
      { sku: 'a-2', centavos: 123450 },
      { sku: 'a-3', centavos: null },
    ])
  })

  it('aceita BOM, final de linha do Windows e o separador vírgula com o preço entre aspas', () => {
    const texto = '﻿sku,preco_cheio\r\na-1,"129,90"\r\na-2,200\r\na-3,\r\n'
    const { linhas, problemas } = lerPlanilhaDePrecosCheios(texto, CATALOGO)
    expect(problemas).toEqual([])
    expect(linhas.map((l) => l.centavos)).toEqual([12990, 20000, null])
  })

  it('exige as colunas sku e preco_cheio', () => {
    for (const cab of ['sku;preco', 'produto;preco_cheio', '']) {
      const r = lerPlanilhaDePrecosCheios(`${cab}\na-1;10`, CATALOGO)
      expect(r.problemas.length).toBeGreaterThan(0)
    }
    expect(lerPlanilhaDePrecosCheios('', CATALOGO).problemas).toEqual([
      'A planilha está vazia.',
    ])
  })

  it('recusa sku que não existe, produto não exclusivo e sku repetido', () => {
    const { problemas } = lerPlanilhaDePrecosCheios(
      planilha(
        'X;Z;1;10;nao-existe-9',
        'X;P;1;10;p-1',
        'X;A;1;10;a-1',
        'X;A;1;11;a-1',
        'X;B;1;;a-2',
        'X;C;1;;a-3',
      ),
      CATALOGO,
    )
    expect(problemas).toHaveLength(3)
    expect(problemas[0]).toMatch(/nao-existe-9.*não existe/)
    expect(problemas[1]).toMatch(/p-1.*não é exclusivo/)
    expect(problemas[2]).toMatch(/a-1.*mais de uma vez/)
  })

  it('recusa preço inválido, zero e com mais de 2 casas (nunca arredonda em silêncio)', () => {
    const { problemas, linhas } = lerPlanilhaDePrecosCheios(
      planilha('X;A;1;abc;a-1', 'X;B;1;0;a-2', 'X;C;1;12,345;a-3'),
      CATALOGO,
    )
    expect(problemas).toHaveLength(3)
    expect(linhas).toEqual([])
  })

  it('todo exclusivo do catálogo precisa ter linha, mesmo vazia', () => {
    const { problemas } = lerPlanilhaDePrecosCheios(
      planilha('X;A;1;10;a-1', 'X;B;1;;a-2'),
      CATALOGO,
    )
    expect(problemas).toEqual([
      expect.stringMatching(/"a-3" não tem linha na planilha/),
    ])
  })

  it('aponta linha com número de campos errado', () => {
    const { problemas } = lerPlanilhaDePrecosCheios(
      planilha('X;A;1;129,90;a-1;sobrando', 'X;B;1;;a-2', 'X;C;1;;a-3'),
      CATALOGO,
    )
    expect(problemas[0]).toMatch(/linha 2: 6 colunas em vez de 5/)
  })

  it('NUNCA repete um valor de preço nas mensagens de erro', () => {
    const { problemas } = lerPlanilhaDePrecosCheios(
      planilha(
        'X;A;1;4567,89;a-1',
        'X;B;1;3333,33;a-1',
        'X;C;1;7777,77;p-1',
        'X;D;1;8888,88xx;a-2',
      ),
      CATALOGO,
    )
    const tudo = problemas.join(' ')
    for (const valor of ['4567', '3333', '7777', '8888']) {
      expect(tudo).not.toContain(valor)
    }
  })
})

describe('compararPrecosCheios', () => {
  const linhas = [
    { sku: 'a-1', centavos: 12990 },
    { sku: 'a-2', centavos: 5000 },
    { sku: 'a-3', centavos: null },
    { sku: 'a-4', centavos: null },
    { sku: 'a-5', centavos: 700 },
  ]

  it('separa novos, alterados, iguais, sem preço e vazios com preço no banco', () => {
    const r = compararPrecosCheios(linhas, [
      { sku: 'a-1', preco_cheio: null },
      { sku: 'a-2', preco_cheio: '50.00' },
      { sku: 'a-3', preco_cheio: null },
      { sku: 'a-4', preco_cheio: 88.5 },
      { sku: 'a-5', preco_cheio: '8.00' },
    ])
    expect(r.novos).toEqual(['a-1'])
    expect(r.iguais).toBe(1)
    expect(r.semPreco).toEqual(['a-3'])
    expect(r.vaziosComPrecoNoBanco).toEqual(['a-4'])
    expect(r.alterados).toEqual(['a-5'])
  })

  it('compara em centavos: 129.9 e "129.90" são o mesmo preço', () => {
    const r = compararPrecosCheios(
      [{ sku: 'a-1', centavos: 12990 }],
      [{ sku: 'a-1', preco_cheio: 129.9 }],
    )
    expect(r).toMatchObject({ novos: [], alterados: [], iguais: 1 })
    const r2 = compararPrecosCheios(
      [{ sku: 'a-1', centavos: 12990 }],
      [{ sku: 'a-1', preco_cheio: '129.90' }],
    )
    expect(r2.iguais).toBe(1)
  })

  it('segunda rodada depois de gravar: nada novo nem alterado', () => {
    const depois = compararPrecosCheios(
      linhas,
      linhas.map((l) => ({
        sku: l.sku,
        preco_cheio: l.centavos === null ? null : l.centavos / 100,
      })),
    )
    expect(depois.novos).toEqual([])
    expect(depois.alterados).toEqual([])
  })
})

describe('centavosParaNumeric', () => {
  it.each([
    [12990, '129.90'],
    [5, '0.05'],
    [100, '1.00'],
    [123450, '1234.50'],
    [3590, '35.90'],
    [7, '0.07'],
  ])('%i centavos viram "%s"', (centavos, esperado) => {
    expect(centavosParaNumeric(centavos)).toBe(esperado)
  })
})
