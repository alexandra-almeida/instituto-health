import { describe, expect, it } from 'vitest'
import {
  CATEGORIAS_DESCARTAVEIS,
  DESCARTAVEIS,
  MARCAS_DESCARTAVEIS,
} from '../data/descartaveis'
import raw from '../data/descartaveis.json'
import {
  MENSAGEM_ATACADO,
  filtrarDescartaveis,
  linkDoWhatsapp,
  mensagemDoProduto,
  normalizarBusca,
  paraCarrinho,
} from './descartaveis'

// Os 52 sku de hoje. O sku é FIXO (CLAUDE.md): se este teste falhar porque um
// sku mudou ou sumiu, o erro está na mudança. Sku NOVO entra no FIM desta lista,
// com o próximo número, e só então o teste volta a passar.
const SKUS_CONGELADOS = [
  'desc-luva-de-vinil-sem-po-p-0',
  'desc-luva-de-vinil-sem-po-m-1',
  'desc-luva-de-vinil-sem-po-g-2',
  'desc-luva-vinilflex-sem-po-p-3',
  'desc-luva-vinilflex-sem-po-m-4',
  'desc-luva-vinilflex-sem-po-g-5',
  'desc-luva-nitrilica-rosa-pp-6',
  'desc-luva-nitrilica-rosa-p-7',
  'desc-luva-nitrilica-rosa-m-8',
  'desc-luva-de-latex-com-po-pp-9',
  'desc-luva-de-latex-com-po-p-10',
  'desc-luva-de-latex-com-po-m-11',
  'desc-luva-de-latex-com-po-g-12',
  'desc-abaixador-de-lingua-13',
  'desc-mascara-de-tnt-tripla-branca-com-elastico-14',
  'desc-touca-de-tnt-branca-sanfonada-15',
  'desc-lencol-de-maca-com-elastico-16',
  'desc-lencol-hospitalar-50x50-17',
  'desc-lencol-hospitalar-70x50-18',
  'desc-papel-toalha-interfolha-2-dobras-100-20x21-19',
  'desc-papel-toalha-interfolha-2-dobras-extra-luxo-20x21-20',
  'desc-papel-higienico-folha-dupla-premium-30-m-21',
  'desc-papel-higienico-folha-dupla-30-m-qualite-22',
  'desc-papel-higienico-folha-dupla-30-m-personal-vip-23',
  'desc-copo-descartavel-50-ml-branco-24',
  'desc-copo-descartavel-180-ml-branco-25',
  'desc-filtro-de-cafe-de-papel-103-26',
  'desc-filtro-de-cafe-de-papel-102-27',
  'desc-sabonete-liquido-5-l-erva-doce-28',
  'desc-sabonete-liquido-5-l-frutas-vermelhas-29',
  'desc-sabonete-liquido-5-l-pistache-30',
  'desc-sabonete-liquido-500-ml-com-pump-ameixa-dourada-31',
  'desc-cloro-gel-5-l-32',
  'desc-desinfetante-2-l-33',
  'desc-desinfetante-5-l-algas-34',
  'desc-limpador-perfumado-120-ml-35',
  'desc-sabao-em-po-multiacao-800-g-36',
  'desc-sabao-em-po-primavera-800-g-37',
  'desc-agua-sanitaria-5-l-gopabo-38',
  'desc-agua-sanitaria-5-l-harcclin-39',
  'desc-agua-sanitaria-5-l-triex-40',
  'desc-agua-sanitaria-2-l-41',
  'desc-agua-sanitaria-1-l-42',
  'desc-saco-plastico-virgem-35x45-espessura-0-6-43',
  'desc-saco-plastico-virgem-40x60-espessura-0-12-44',
  'desc-bobina-picotada-reforcada-20x30-45',
  'desc-bobina-picotada-reforcada-25x35-46',
  'desc-bobina-picotada-reforcada-30x40-47',
  'desc-saco-de-lixo-20-l-40x59-preto-48',
  'desc-saco-de-lixo-30-l-espessura-0-04-49',
  'desc-saco-de-lixo-50-l-espessura-0-04-50',
  'desc-saco-de-lixo-100-l-75x90-51',
]

const todosOsSkus = DESCARTAVEIS.flatMap((p) => p.variacoes.map((v) => v.sku))

describe('dados dos descartáveis', () => {
  it('tem 41 produtos e 52 variações', () => {
    expect(DESCARTAVEIS).toHaveLength(41)
    expect(todosOsSkus).toHaveLength(52)
  })

  it('os sku são exatamente os congelados, na mesma ordem (novos só no fim)', () => {
    expect(todosOsSkus.slice(0, SKUS_CONGELADOS.length)).toEqual(
      SKUS_CONGELADOS,
    )
  })

  it('todo sku é único, tem o prefixo desc- e termina em -N', () => {
    expect(new Set(todosOsSkus).size).toBe(todosOsSkus.length)
    for (const sku of todosOsSkus) {
      expect(sku).toMatch(/^desc-[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/)
    }
  })

  it('o número final do sku nunca se repete', () => {
    const numeros = todosOsSkus.map((s) => Number(s.split('-').pop()))
    expect(new Set(numeros).size).toBe(numeros.length)
  })

  it('o texto "A CONFIRMAR" não aparece em nenhum lugar do JSON', () => {
    expect(JSON.stringify(raw)).not.toMatch(/confirmar/i)
  })

  it('o preço é um número positivo e igual em todas as variações do produto', () => {
    for (const produto of DESCARTAVEIS) {
      for (const v of produto.variacoes) {
        expect(v.preco).toBeGreaterThan(0)
        expect(v.preco).toBe(produto.preco)
      }
    }
  })

  it('só produto com várias variações tem rótulo, e todas têm rótulo', () => {
    for (const produto of DESCARTAVEIS) {
      if (produto.variacoes.length > 1) {
        expect(produto.rotuloDaVariacao).toBeTruthy()
        for (const v of produto.variacoes) expect(v.rotulo).toBeTruthy()
      } else {
        expect(produto.rotuloDaVariacao).toBeNull()
        expect(produto.variacoes[0].rotulo).toBeNull()
      }
    }
  })

  it('as luvas têm tamanhos e o sabonete tem fragrâncias', () => {
    const vinil = DESCARTAVEIS.find((p) => p.nome === 'Luva de Vinil Sem Pó')
    const sabonete = DESCARTAVEIS.find((p) => p.nome === 'Sabonete Líquido 5 L')
    expect(vinil?.rotuloDaVariacao).toBe('Tamanho')
    expect(vinil?.variacoes.map((v) => v.rotulo)).toEqual(['P', 'M', 'G'])
    expect(sabonete?.rotuloDaVariacao).toBe('Fragrância')
    expect(sabonete?.variacoes.map((v) => v.rotulo)).toEqual([
      'Erva Doce',
      'Frutas Vermelhas',
      'Pistache',
    ])
  })

  it('o mesmo nome com marcas diferentes continua em produtos separados', () => {
    const aguas = DESCARTAVEIS.filter((p) => p.nome === 'Água Sanitária 5 L')
    expect(aguas.map((p) => p.marca).sort()).toEqual([
      'Gopabo',
      'Harcclin',
      'Triex',
    ])
  })

  it('13 produtos sem marca e 8 sem embalagem confirmadas', () => {
    expect(DESCARTAVEIS.filter((p) => p.marca === null)).toHaveLength(13)
    expect(DESCARTAVEIS.filter((p) => p.embalagem === null)).toHaveLength(8)
  })

  it('as listas de categorias e marcas vêm só do que está confirmado', () => {
    expect(CATEGORIAS_DESCARTAVEIS).toEqual([
      'Luvas',
      'Atendimento',
      'Papéis',
      'Copa',
      'Higiene e limpeza',
      'Sacos e embalagens',
    ])
    expect(MARCAS_DESCARTAVEIS).toHaveLength(16)
    expect(MARCAS_DESCARTAVEIS).not.toContain('A CONFIRMAR')
  })
})

describe('filtrarDescartaveis', () => {
  const sem = { categoria: '', marca: '', busca: '' }

  it('sem filtro devolve tudo', () => {
    expect(filtrarDescartaveis(DESCARTAVEIS, sem)).toHaveLength(41)
  })

  it('filtra por categoria', () => {
    expect(
      filtrarDescartaveis(DESCARTAVEIS, { ...sem, categoria: 'Luvas' }),
    ).toHaveLength(4)
  })

  it('filtra por marca', () => {
    const triex = filtrarDescartaveis(DESCARTAVEIS, { ...sem, marca: 'Triex' })
    expect(triex).toHaveLength(3)
    expect(triex.every((p) => p.marca === 'Triex')).toBe(true)
  })

  it('a busca ignora acento e maiúscula e olha o nome', () => {
    const agua = filtrarDescartaveis(DESCARTAVEIS, {
      ...sem,
      busca: 'AGUA san',
    })
    expect(agua).toHaveLength(5)
    expect(normalizarBusca('  Água  ')).toBe('agua')
  })

  it('combina categoria, marca e busca', () => {
    const r = filtrarDescartaveis(DESCARTAVEIS, {
      categoria: 'Higiene e limpeza',
      marca: 'Triex',
      busca: 'sanitaria',
    })
    expect(r.map((p) => p.nome)).toEqual([
      'Água Sanitária 5 L',
      'Água Sanitária 2 L',
    ])
  })

  it('busca sem resultado devolve lista vazia', () => {
    expect(filtrarDescartaveis(DESCARTAVEIS, { ...sem, busca: 'xyz' })).toEqual(
      [],
    )
  })
})

describe('WhatsApp', () => {
  it('o texto do bloco de atacado é o combinado', () => {
    expect(MENSAGEM_ATACADO).toBe(
      'Olá! Gostaria de um orçamento para compra em atacado/licitação.',
    )
  })

  it('o link usa o número e codifica a mensagem', () => {
    const link = linkDoWhatsapp('5516999999999', 'Olá! Quero 10 caixas & mais')
    expect(link).toBe(
      'https://wa.me/5516999999999?text=Ol%C3%A1!%20Quero%2010%20caixas%20%26%20mais',
    )
  })

  it('a mensagem do produto traz produto, marca, variação e quantidade', () => {
    const vinil = DESCARTAVEIS.find((p) => p.nome === 'Luva de Vinil Sem Pó')!
    const m = mensagemDoProduto(vinil, vinil.variacoes[1], 10)
    expect(m).toBe(
      [
        MENSAGEM_ATACADO,
        'Produto: Luva de Vinil Sem Pó (Vabene)',
        'Tamanho: M',
        'Quantidade: 10',
      ].join('\n'),
    )
  })

  it('sem variação escolhida vai "a definir"', () => {
    const vinil = DESCARTAVEIS.find((p) => p.nome === 'Luva de Vinil Sem Pó')!
    expect(mensagemDoProduto(vinil, null, 3)).toContain('Tamanho: a definir')
  })

  it('produto sem variação e sem marca não tem linha de variação nem marca', () => {
    const tnt = DESCARTAVEIS.find((p) => p.nome === 'Abaixador de Língua')!
    const m = mensagemDoProduto(tnt, null, 2)
    expect(m).toContain('Produto: Abaixador de Língua')
    expect(m).not.toContain('(')
    expect(m).not.toMatch(/Tamanho|Fragrância/)
  })
})

describe('paraCarrinho', () => {
  it('usa o sku da variação como productId e o rótulo como variação', () => {
    const vinil = DESCARTAVEIS.find((p) => p.nome === 'Luva de Vinil Sem Pó')!
    const item = paraCarrinho(vinil, vinil.variacoes[2])
    expect(item.productId).toBe('desc-luva-de-vinil-sem-po-g-2')
    expect(item.variant).toBe('G')
    expect(item.preco).toBe(19)
    expect(item.linha).toBe('Vabene')
    expect(item.exclusivoProfissional).toBe(false)
    expect(item.nome).toBe('Luva de Vinil Sem Pó')
  })

  it('produto sem variação não tem variant, e sem embalagem fica vazio', () => {
    const p = DESCARTAVEIS.find((x) => x.nome === 'Abaixador de Língua')!
    const item = paraCarrinho(p, p.variacoes[0])
    expect(item.variant).toBeNull()
    expect(item.tamanho).toBe('Pacote com 100')
    expect(item.linha).toBeNull()
  })
})
