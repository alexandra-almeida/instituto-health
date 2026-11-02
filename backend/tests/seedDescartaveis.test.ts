import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  compararCatalogo,
  lerCatalogo,
  type ProdutoNoBanco,
  type ProdutoParaBanco,
} from '../../database/seeds/lib/catalogo.js'
import {
  PREFIXO_DOS_DESCARTAVEIS,
  lerDescartaveis,
  verificarColisaoDeSku,
} from '../../database/seeds/lib/descartaveis.js'

const lerJson = (caminho: string) =>
  JSON.parse(readFileSync(new URL(caminho, import.meta.url), 'utf8')) as unknown

const variacao = (sku: string, rotulo: string | null, preco: number) => ({
  sku,
  rotulo,
  preco,
})

const descartavel = (extras: Record<string, unknown> = {}) => ({
  nome: 'Luva de Vinil Sem Pó',
  categoria: 'Luvas',
  marca: 'Vabene',
  embalagem: 'Caixa com 100',
  rotuloDaVariacao: 'Tamanho',
  variacoes: [
    variacao('desc-luva-p-0', 'P', 19),
    variacao('desc-luva-m-1', 'M', 19),
  ],
  ...extras,
})

const lista = (...produtos: Array<Record<string, unknown>>) => ({ produtos })

describe('lerDescartaveis', () => {
  it('cada variação vira uma linha com nome + marca e tamanho = variação + embalagem', () => {
    const r = lerDescartaveis(lista(descartavel()))

    expect(r.problemas).toEqual([])
    expect(r.produtos).toEqual<ProdutoParaBanco[]>([
      {
        sku: 'desc-luva-p-0',
        nome: 'Luva de Vinil Sem Pó - Vabene',
        tamanho: 'P - Caixa com 100',
        preco: 19,
        exclusivo_profissional: false,
      },
      {
        sku: 'desc-luva-m-1',
        nome: 'Luva de Vinil Sem Pó - Vabene',
        tamanho: 'M - Caixa com 100',
        preco: 19,
        exclusivo_profissional: false,
      },
    ])
  })

  it('sem marca e sem embalagem: nome puro e tamanho vazio', () => {
    const r = lerDescartaveis(
      lista(
        descartavel({
          marca: null,
          embalagem: null,
          rotuloDaVariacao: null,
          variacoes: [variacao('desc-abaixador-2', null, 11)],
        }),
      ),
    )

    expect(r.problemas).toEqual([])
    expect(r.produtos[0]).toMatchObject({
      sku: 'desc-abaixador-2',
      nome: 'Luva de Vinil Sem Pó',
      tamanho: '',
      preco: 11,
    })
  })

  it('nunca marca como exclusivo de profissional', () => {
    const r = lerDescartaveis(lista(descartavel()))
    expect(r.produtos.every((p) => p.exclusivo_profissional === false)).toBe(
      true,
    )
  })

  it('arredonda para 2 casas e avisa só quando o valor mudou', () => {
    const r = lerDescartaveis(
      lista(
        descartavel({
          variacoes: [
            variacao('desc-a-0', 'P', 19.999),
            variacao('desc-a-1', 'M', 71.1),
          ],
        }),
      ),
    )

    expect(r.problemas).toEqual([])
    expect(r.produtos.map((p) => p.preco)).toEqual([20, 71.1])
    expect(r.arredondados).toEqual([{ sku: 'desc-a-0', de: 19.999, para: 20 }])
  })

  it.each([
    [
      'preço ausente',
      variacao('desc-a-0', 'P', undefined as unknown as number),
    ],
    ['preço zero', variacao('desc-a-0', 'P', 0)],
    ['preço negativo', variacao('desc-a-0', 'P', -1)],
    ['preço em texto', variacao('desc-a-0', 'P', '19' as unknown as number)],
  ])('%s: problema (descartável sempre tem preço)', (_nome, v) => {
    const r = lerDescartaveis(
      lista(descartavel({ variacoes: [v, variacao('desc-a-1', 'M', 1)] })),
    )
    expect(r.problemas.join(' ')).toContain('preço obrigatório')
  })

  it('sku sem o prefixo desc- é problema', () => {
    const r = lerDescartaveis(
      lista(
        descartavel({
          variacoes: [
            variacao('luva-vinil-p-0', 'P', 19),
            variacao('luva-vinil-m-1', 'M', 19),
          ],
        }),
      ),
    )
    expect(r.problemas.join(' ')).toContain(PREFIXO_DOS_DESCARTAVEIS)
  })

  it.each([
    'desc-sem-numero',
    'DESC-Maiuscula-1',
    'desc-com acento-1',
    'desc--duplo-1',
  ])('sku fora do padrão (%s) é problema', (sku) => {
    const r = lerDescartaveis(
      lista(
        descartavel({
          rotuloDaVariacao: null,
          variacoes: [variacao(sku, null, 5)],
        }),
      ),
    )
    expect(r.problemas.join(' ')).toContain('fora do padrão')
  })

  it('sku repetido (no mesmo ou em outro produto) é problema', () => {
    const r = lerDescartaveis(
      lista(
        descartavel(),
        descartavel({
          nome: 'Outro',
          variacoes: [
            variacao('desc-luva-p-0', 'P', 5),
            variacao('desc-outro-2', 'M', 5),
          ],
        }),
      ),
    )
    expect(r.problemas.join(' ')).toContain('desc-luva-p-0: sku repetido')
  })

  it('produto com várias variações exige rótulo em todas', () => {
    const r = lerDescartaveis(
      lista(
        descartavel({
          variacoes: [
            variacao('desc-a-0', 'P', 5),
            variacao('desc-a-1', null, 5),
          ],
        }),
      ),
    )
    expect(r.problemas.join(' ')).toContain('exige rótulo')
  })

  it.each(['marca', 'embalagem', 'nome'])(
    'o texto "A CONFIRMAR" em %s é recusado (nunca vai para o banco nem para o site)',
    (campo) => {
      const r = lerDescartaveis(
        lista(descartavel({ [campo]: 'A CONFIRMAR (caixa com 100?)' })),
      )
      expect(r.problemas.join(' ')).toContain('A CONFIRMAR')
    },
  )

  it('produto sem variações, JSON sem lista e item que não é objeto', () => {
    expect(
      lerDescartaveis(lista(descartavel({ variacoes: [] }))).problemas.join(
        ' ',
      ),
    ).toContain('sem variações')
    expect(lerDescartaveis({}).problemas[0]).toContain('não tem a lista')
    expect(
      lerDescartaveis(lista('texto' as unknown as Record<string, unknown>))
        .problemas[0],
    ).toContain('não é um objeto')
  })

  it('marca vazia ("") é recusada: o certo é nula', () => {
    const r = lerDescartaveis(lista(descartavel({ marca: '' })))
    expect(r.problemas.join(' ')).toContain('marca')
  })
})

describe('verificarColisaoDeSku', () => {
  const linha = (sku: string): ProdutoParaBanco => ({
    sku,
    nome: 'x',
    tamanho: '',
    preco: 1,
    exclusivo_profissional: false,
  })

  it('sem colisão entre as listas: nada a avisar', () => {
    expect(
      verificarColisaoDeSku([
        { origem: 'Tulípia', produtos: [linha('marca-a-50ml-0')] },
        { origem: 'Descartáveis', produtos: [linha('desc-a-0')] },
      ]),
    ).toEqual([])
  })

  it('o mesmo sku nas duas listas é problema, citando as duas origens', () => {
    const problemas = verificarColisaoDeSku([
      { origem: 'Tulípia', produtos: [linha('desc-a-0')] },
      { origem: 'Descartáveis', produtos: [linha('desc-a-0')] },
    ])
    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toContain('Tulípia')
    expect(problemas[0]).toContain('Descartáveis')
  })
})

describe('os JSON reais', () => {
  const descartaveis = lerDescartaveis(
    lerJson('../../frontend/src/data/descartaveis.json'),
  )
  const tulipia = lerCatalogo(
    lerJson('../../frontend/src/data/tulipia-produtos.json'),
  )

  it('descartaveis.json é válido: 52 variações, todas com preço, sem problemas', () => {
    expect(descartaveis.problemas).toEqual([])
    expect(descartaveis.produtos).toHaveLength(52)
    expect(
      descartaveis.produtos.every((p) => p.preco !== null && p.preco > 0),
    ).toBe(true)
    expect(descartaveis.arredondados).toEqual([])
  })

  it('todos os sku dos descartáveis têm o prefixo desc-', () => {
    expect(
      descartaveis.produtos.every((p) =>
        p.sku.startsWith(PREFIXO_DOS_DESCARTAVEIS),
      ),
    ).toBe(true)
  })

  it('nenhum sku dos descartáveis colide com os da Tulípia', () => {
    expect(
      verificarColisaoDeSku([
        { origem: 'Tulípia', produtos: tulipia.produtos },
        { origem: 'Descartáveis', produtos: descartaveis.produtos },
      ]),
    ).toEqual([])
    expect(
      tulipia.produtos.some((p) => p.sku.startsWith(PREFIXO_DOS_DESCARTAVEIS)),
    ).toBe(false)
  })

  it('juntando as duas listas, uma carga repetida não tem nada novo nem alterado', () => {
    const juntos = [...tulipia.produtos, ...descartaveis.produtos]
    const noBanco: ProdutoNoBanco[] = juntos.map((p) => ({ ...p, ativo: true }))

    const r = compararCatalogo(juntos, noBanco)

    expect(juntos).toHaveLength(149 + 52)
    expect(r.novos).toEqual([])
    expect(r.alterados).toEqual([])
    expect(r.iguais).toBe(juntos.length)
  })

  it('banco só com a Tulípia: os 52 descartáveis aparecem como novos', () => {
    const noBanco: ProdutoNoBanco[] = tulipia.produtos.map((p) => ({
      ...p,
      ativo: true,
    }))

    const r = compararCatalogo(
      [...tulipia.produtos, ...descartaveis.produtos],
      noBanco,
    )

    expect(r.novos).toHaveLength(52)
    expect(r.alterados).toEqual([])
    expect(r.ausentes).toEqual([])
  })
})
