import { describe, expect, it } from 'vitest'
import {
  compararCatalogo,
  lerCatalogo,
  type ProdutoNoBanco,
  type ProdutoParaBanco,
} from '../../database/seeds/lib/catalogo.js'

const produto = (
  sku: string,
  extras: Record<string, unknown> = {},
): Record<string, unknown> => ({
  sku,
  nome: 'Marca - Produto',
  tamanho: '50ml',
  preco: 100,
  exclusivoProfissional: false,
  ...extras,
})

const catalogo = (...produtos: Array<Record<string, unknown>>) => ({ produtos })

describe('lerCatalogo', () => {
  it('lê um produto público e um exclusivo de profissional', () => {
    const r = lerCatalogo(
      catalogo(
        produto('marca-produto-50ml-0'),
        produto('marca-outro-30g-1', {
          preco: null,
          exclusivoProfissional: true,
        }),
      ),
    )

    expect(r.problemas).toEqual([])
    expect(r.produtos).toEqual<ProdutoParaBanco[]>([
      {
        sku: 'marca-produto-50ml-0',
        nome: 'Marca - Produto',
        tamanho: '50ml',
        preco: 100,
        exclusivo_profissional: false,
      },
      {
        sku: 'marca-outro-30g-1',
        nome: 'Marca - Produto',
        tamanho: '50ml',
        preco: null,
        exclusivo_profissional: true,
      },
    ])
  })

  it('exclusivoProfissional ausente vale false', () => {
    const { exclusivoProfissional, ...semCampo } = produto('marca-x-1ml-0')
    void exclusivoProfissional

    const r = lerCatalogo(catalogo(semCampo))

    expect(r.problemas).toEqual([])
    expect(r.produtos[0]?.exclusivo_profissional).toBe(false)
  })

  it('preço que já é exato não conta como arredondado, mesmo com ruído de ponto flutuante', () => {
    // 71.1 * 100 dá 7110.000000000001 em ponto flutuante, mas o valor é exato
    const r = lerCatalogo(
      catalogo(
        produto('a-b-1ml-0', { preco: 71.1 }),
        produto('a-c-1ml-1', { preco: 67.15 }),
      ),
    )

    expect(r.problemas).toEqual([])
    expect(r.arredondados).toEqual([])
    expect(r.produtos.map((p) => p.preco)).toEqual([71.1, 67.15])
  })

  it('preço com mais de 2 casas é arredondado e listado', () => {
    const r = lerCatalogo(catalogo(produto('a-b-1ml-0', { preco: 10.126 })))

    expect(r.produtos[0]?.preco).toBe(10.13)
    expect(r.arredondados).toEqual([
      { sku: 'a-b-1ml-0', de: 10.126, para: 10.13 },
    ])
  })

  it.each([
    ['sem a lista de produtos', {}],
    ['produtos que não é lista', { produtos: 'x' }],
    ['JSON que não é objeto', 'texto'],
    ['nulo', null],
  ])('recusa %s', (_nome, json) => {
    const r = lerCatalogo(json)
    expect(r.problemas).toHaveLength(1)
    expect(r.produtos).toEqual([])
  })

  it.each([
    ['sku ausente', produto('x', { sku: undefined })],
    ['sku com maiúscula', produto('Marca-x-1ml-0')],
    ['sku com acento', produto('marca-ção-1ml-0')],
    ['sku sem o índice final', produto('marca-x-1ml')],
    ['sku com espaço', produto('marca x-1ml-0')],
    ['item que não é objeto', 'texto' as unknown as Record<string, unknown>],
  ])('problema: %s', (_nome, item) => {
    const r = lerCatalogo(catalogo(item))
    expect(r.problemas.length).toBeGreaterThan(0)
    expect(r.produtos).toEqual([])
  })

  it('sku repetido é problema', () => {
    const r = lerCatalogo(
      catalogo(produto('marca-x-1ml-0'), produto('marca-x-1ml-0')),
    )
    expect(r.problemas).toEqual(['marca-x-1ml-0: sku repetido.'])
  })

  it.each([
    ['nome vazio', { nome: '   ' }],
    ['nome que não é texto', { nome: 5 }],
    ['preço negativo', { preco: -1 }],
    ['preço em texto', { preco: '10' }],
    ['preço infinito', { preco: Infinity }],
    ['exclusivo que não é booleano', { exclusivoProfissional: 'sim' }],
    ['tamanho que não é texto', { tamanho: 10 }],
  ])('problema: %s', (_nome, extras) => {
    const r = lerCatalogo(catalogo(produto('marca-x-1ml-0', extras)))
    expect(r.problemas.length).toBeGreaterThan(0)
  })

  it('exclusivo de profissional com preço público é problema (regra do banco)', () => {
    const r = lerCatalogo(
      catalogo(
        produto('marca-x-1ml-0', { exclusivoProfissional: true, preco: 50 }),
      ),
    )
    expect(r.problemas).toEqual([
      'marca-x-1ml-0: exclusivo de profissional não pode ter preço público.',
    ])
  })

  it('preço zero é aceito (o banco permite >= 0)', () => {
    const r = lerCatalogo(catalogo(produto('marca-x-1ml-0', { preco: 0 })))
    expect(r.problemas).toEqual([])
    expect(r.produtos[0]?.preco).toBe(0)
  })
})

describe('compararCatalogo', () => {
  const base: ProdutoParaBanco = {
    sku: 'a-b-1ml-0',
    nome: 'A - B',
    tamanho: '1ml',
    preco: 10,
    exclusivo_profissional: false,
  }
  const noBanco = (extras: Partial<ProdutoNoBanco> = {}): ProdutoNoBanco => ({
    ...base,
    ativo: true,
    ...extras,
  })

  it('banco vazio: tudo é novo', () => {
    const r = compararCatalogo([base], [])
    expect(r.novos).toEqual([base])
    expect(r.alterados).toEqual([])
    expect(r.iguais).toBe(0)
    expect(r.ausentes).toEqual([])
  })

  it('igual ao banco: nada a fazer', () => {
    const r = compararCatalogo([base], [noBanco()])
    expect(r).toEqual({ novos: [], alterados: [], iguais: 1, ausentes: [] })
  })

  it('preço do banco como texto ("10.00") ou número com ruído conta como igual', () => {
    expect(
      compararCatalogo(
        [base],
        [noBanco({ preco: '10.00' as unknown as number })],
      ).iguais,
    ).toBe(1)
    expect(
      compararCatalogo(
        [{ ...base, preco: 71.1 }],
        [noBanco({ preco: 71.10000000000001 })],
      ).iguais,
    ).toBe(1)
  })

  it('aponta os campos que mudaram, só eles', () => {
    const r = compararCatalogo(
      [{ ...base, nome: 'A - B novo', preco: 12.5 }],
      [noBanco()],
    )
    expect(r.alterados).toHaveLength(1)
    expect(r.alterados[0]?.campos).toEqual(['nome', 'preco'])
    expect(r.alterados[0]?.novo.nome).toBe('A - B novo')
  })

  it('preço que passa de nulo para valor (e o contrário) é alteração', () => {
    expect(
      compararCatalogo([{ ...base, preco: null }], [noBanco()]).alterados[0]
        ?.campos,
    ).toEqual(['preco'])
    expect(
      compararCatalogo([base], [noBanco({ preco: null })]).alterados[0]?.campos,
    ).toEqual(['preco'])
  })

  it('`ativo` não entra na comparação: produto desativado no banco continua igual', () => {
    const r = compararCatalogo([base], [noBanco({ ativo: false })])
    expect(r.iguais).toBe(1)
    expect(r.alterados).toEqual([])
  })

  it('o que está no banco e sumiu do JSON aparece como ausente', () => {
    const r = compararCatalogo(
      [base],
      [noBanco(), noBanco({ sku: 'velho-1ml-9', nome: 'Velho' })],
    )
    expect(r.iguais).toBe(1)
    expect(r.ausentes.map((p) => p.sku)).toEqual(['velho-1ml-9'])
  })

  it('sku diferente é produto novo, nunca renomeação', () => {
    const r = compararCatalogo([{ ...base, sku: 'a-b-1ml-1' }], [noBanco()])
    expect(r.novos.map((p) => p.sku)).toEqual(['a-b-1ml-1'])
    expect(r.ausentes.map((p) => p.sku)).toEqual(['a-b-1ml-0'])
  })
})
