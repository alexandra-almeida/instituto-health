import { describe, expect, it } from 'vitest'
import {
  CATEGORIAS_DESCARTAVEIS,
  DESCARTAVEIS,
  FOTOS_DOS_DESCARTAVEIS,
  MARCAS_DESCARTAVEIS,
} from '../data/descartaveis'
import raw from '../data/descartaveis.json'
import {
  MENSAGEM_ATACADO,
  filtrarDescartaveis,
  fotoDoDescartavel,
  linkDoWhatsapp,
  mensagemDoProduto,
  normalizarBusca,
  paraCarrinho,
  slugDoProduto,
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

  it('11 produtos sem marca e 4 sem embalagem confirmadas', () => {
    expect(DESCARTAVEIS.filter((p) => p.marca === null)).toHaveLength(11)
    expect(DESCARTAVEIS.filter((p) => p.embalagem === null)).toHaveLength(4)
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

const LUVAS_VABENE = [
  'Luva de Vinil Sem Pó',
  'Luva Viniflex Sem Pó',
  'Luva Nitrílica Rosa',
  'Luva de Látex com Pó',
]

// Produtos com UMA foto para o produto inteiro (as luvas têm uma por tamanho)
const PRODUTOS_COM_UMA_FOTO = [
  'Abaixador de Língua',
  'Máscara de TNT Tripla Branca com Elástico',
  'Touca de TNT Branca Sanfonada',
  'Lençol de Maca com Elástico',
  'Lençol Hospitalar 50x50',
  'Lençol Hospitalar 70x50',
  'Papel Toalha Interfolha 2 Dobras 100% 20x21',
  'Papel Toalha Interfolha 2 Dobras Extra Luxo 20x21',
  'Papel Higiênico Folha Dupla Premium 30 m',
  // dois produtos com este nome (Qualite e Personal Vip)
  'Papel Higiênico Folha Dupla 30 m',
  'Papel Higiênico Folha Dupla 30 m',
  'Copo Descartável 50 ml Branco',
  'Copo Descartável 180 ml Branco',
  'Sabonete Líquido 500 ml com Pump Ameixa Dourada',
  'Cloro Gel 5 L',
  'Desinfetante 2 L',
  'Desinfetante 5 L Algas',
  'Limpador Perfumado 120 ml',
  'Sabão em Pó Multiação 800 g',
  'Sabão em Pó Primavera 800 g',
  'Saco Plástico Virgem 35x45 Espessura 0,6',
  'Saco Plástico Virgem 40x60 Espessura 0,12',
  'Filtro de Café de Papel 102',
  'Filtro de Café de Papel 103',
  'Água Sanitária 2 L',
  // dois produtos com este nome (Triex e Gopabo; a Harcclin ainda não tem foto)
  'Água Sanitária 5 L',
  'Água Sanitária 5 L',
]
// Os mesmos 3 arquivos que o importador liga à mão (FOTOS_COMPARTILHADAS)
const ARQUIVOS_COMPARTILHADOS = [
  'mascara-e-touca-tnt.webp',
  'lencol-hospitalar-rolo.webp',
  'saco-plastico-virgem.webp',
]

describe('marca e embalagem confirmadas das luvas', () => {
  it.each(LUVAS_VABENE)(
    '%s é Vabene e vem em "Caixa com 100", confirmado pela caixa',
    (nome) => {
      const luva = DESCARTAVEIS.find((p) => p.nome === nome)
      expect(luva?.marca).toBe('Vabene')
      expect(luva?.embalagem).toBe('Caixa com 100')
    },
  )

  it('só os 4 Lençóis e Sacos de Lixo seguem sem embalagem confirmada', () => {
    expect(
      DESCARTAVEIS.filter((p) => p.embalagem === null).map((p) => p.nome),
    ).toEqual([
      'Lençol Hospitalar 50x50',
      'Lençol Hospitalar 70x50',
      'Saco de Lixo 30 L Espessura 0,04',
      'Saco de Lixo 50 L Espessura 0,04',
    ])
  })
})

describe('Luva Nitrílica Rosa', () => {
  it('não tem a variação G (não está na lista de preços)', () => {
    const luva = DESCARTAVEIS.find((p) => p.nome === 'Luva Nitrílica Rosa')
    expect(luva?.variacoes.map((v) => v.rotulo)).toEqual(['PP', 'P', 'M'])
  })

  it('a foto do G não é servida (fica reservada fora da pasta de fotos)', () => {
    expect(
      [...FOTOS_DOS_DESCARTAVEIS.keys()].some((a) =>
        a.startsWith('luva-nitrilica-rosa-vabene-g'),
      ),
    ).toBe(false)
  })
})

describe('nome da Viniflex', () => {
  it('a grafia da marca é "Viniflex", e o sku antigo continua o mesmo', () => {
    expect(DESCARTAVEIS.some((p) => p.nome === 'Luva Vinilflex Sem Pó')).toBe(
      false,
    )
    const flex = DESCARTAVEIS.find((p) => p.nome === 'Luva Viniflex Sem Pó')
    expect(flex?.variacoes.map((v) => v.sku)).toEqual([
      'desc-luva-vinilflex-sem-po-p-3',
      'desc-luva-vinilflex-sem-po-m-4',
      'desc-luva-vinilflex-sem-po-g-5',
    ])
  })
})

type Bruto = {
  nome: string
  marca: string | null
  imagem?: string
  variacoes: Array<{ rotulo: string | null; imagem?: string }>
}

describe('fotos dos descartáveis', () => {
  const brutos = (raw as { produtos: Bruto[] }).produtos
  const comFoto = (p: {
    imagem?: string
    variacoes: Array<{ imagem?: string }>
  }) => Boolean(p.imagem) || p.variacoes.some((v) => v.imagem)

  it('as 4 luvas Vabene têm uma foto por tamanho', () => {
    const fotos = (nome: string) =>
      DESCARTAVEIS.find((p) => p.nome === nome)?.variacoes.map((v) =>
        Boolean(v.imagem),
      )
    expect(fotos('Luva de Vinil Sem Pó')).toEqual([true, true, true])
    expect(fotos('Luva Viniflex Sem Pó')).toEqual([true, true, true])
    // PP sem foto própria: usa a do P (ver fotoDoDescartavel)
    expect(fotos('Luva Nitrílica Rosa')).toEqual([false, true, true])
    expect(fotos('Luva de Látex com Pó')).toEqual([false, true, true, true])
    for (const nome of LUVAS_VABENE) {
      const luva = DESCARTAVEIS.find((p) => p.nome === nome)!
      expect(luva.imagem).toBeUndefined()
    }
  })

  it('as 4 luvas, os 27 produtos de uma foto só e o sabonete 5 L (foto por fragrância) são os únicos com foto', () => {
    expect(
      DESCARTAVEIS.filter(comFoto)
        .map((p) => p.nome)
        .sort(),
    ).toEqual(
      [
        ...LUVAS_VABENE,
        ...PRODUTOS_COM_UMA_FOTO,
        'Sabonete Líquido 5 L',
      ].sort(),
    )
    expect(DESCARTAVEIS.filter(comFoto)).toHaveLength(32)
  })

  it.each(PRODUTOS_COM_UMA_FOTO)(
    '%s tem uma foto do produto inteiro, a mesma em qualquer variação',
    (nome) => {
      // Nome repetido (águas sanitárias de 5 L): confere os que têm foto; os
      // que ainda não têm entram no teste da lista dos produtos sem foto
      const comImagem = DESCARTAVEIS.filter((p) => p.nome === nome && p.imagem)
      expect(comImagem.length).toBeGreaterThan(0)
      for (const produto of comImagem) {
        expect(produto.imagem).toEqual(expect.any(String))
        expect(fotoDoDescartavel(produto, produto.variacoes[0])).toBe(
          produto.imagem,
        )
        expect(fotoDoDescartavel(produto, null)).toBe(produto.imagem)
      }
    },
  )

  it('a foto da máscara e da touca é a mesma, e a dos dois lençóis também', () => {
    const imagem = (nome: string) =>
      DESCARTAVEIS.find((p) => p.nome === nome)?.imagem
    expect(imagem('Máscara de TNT Tripla Branca com Elástico')).toBe(
      imagem('Touca de TNT Branca Sanfonada'),
    )
    expect(imagem('Lençol Hospitalar 50x50')).toBe(
      imagem('Lençol Hospitalar 70x50'),
    )
    expect(imagem('Lençol Hospitalar 50x50')).toContain(
      'lencol-hospitalar-rolo',
    )
    expect(imagem('Lençol Hospitalar 50x50')).not.toBe(
      imagem('Lençol de Maca com Elástico'),
    )
  })

  it('cada fragrância do sabonete 5 L tem a sua foto, e antes de escolher aparece a da Erva Doce', () => {
    const sabonete = DESCARTAVEIS.find(
      (p) => p.nome === 'Sabonete Líquido 5 L',
    )!
    const [ervaDoce, frutasVermelhas, pistache] = sabonete.variacoes
    expect(ervaDoce.imagem).toContain('erva-doce')
    expect(frutasVermelhas.imagem).toContain('frutas-vermelhas')
    expect(pistache.imagem).toContain('pistache')
    expect(new Set(sabonete.variacoes.map((v) => v.imagem)).size).toBe(3)
    expect(fotoDoDescartavel(sabonete, null)).toBe(ervaDoce.imagem)
    expect(fotoDoDescartavel(sabonete, frutasVermelhas)).toBe(
      frutasVermelhas.imagem,
    )
    expect(fotoDoDescartavel(sabonete, pistache)).toBe(pistache.imagem)
  })

  it('os 9 produtos que ainda não têm foto são os esperados (para a Juliana ou o fabricante)', () => {
    expect(
      DESCARTAVEIS.filter((p) => !comFoto(p)).map(
        (p) => `${p.nome}${p.marca ? ` (${p.marca})` : ''}`,
      ),
    ).toEqual([
      'Água Sanitária 5 L (Harcclin)',
      'Água Sanitária 1 L (Candura)',
      'Bobina Picotada Reforçada 20x30 (Lider)',
      'Bobina Picotada Reforçada 25x35 (Lider)',
      'Bobina Picotada Reforçada 30x40 (Lider)',
      'Saco de Lixo 20 L 40x59 Preto',
      'Saco de Lixo 30 L Espessura 0,04',
      'Saco de Lixo 50 L Espessura 0,04',
      'Saco de Lixo 100 L 75x90',
    ])
  })

  it('os dois sacos plásticos virgens (Araplast) dividem a mesma foto', () => {
    const imagem = (nome: string) =>
      DESCARTAVEIS.find((p) => p.nome === nome)?.imagem
    expect(imagem('Saco Plástico Virgem 35x45 Espessura 0,6')).toBe(
      imagem('Saco Plástico Virgem 40x60 Espessura 0,12'),
    )
    expect(imagem('Saco Plástico Virgem 35x45 Espessura 0,6')).toContain(
      'saco-plastico-virgem',
    )
  })

  it('no card, o PP das luvas sem foto de PP mostra a foto do P', () => {
    for (const nome of ['Luva Nitrílica Rosa', 'Luva de Látex com Pó']) {
      const luva = DESCARTAVEIS.find((p) => p.nome === nome)!
      const pp = luva.variacoes[0]
      const p = luva.variacoes[1]
      expect(pp.imagem).toBeUndefined()
      expect(fotoDoDescartavel(luva, pp)).toBe(p.imagem)
    }
  })

  it('cada tamanho tem uma foto diferente', () => {
    const flex = DESCARTAVEIS.find((p) => p.nome === 'Luva Viniflex Sem Pó')!
    const urls = flex.variacoes.map((v) => v.imagem)
    expect(new Set(urls).size).toBe(3)
    expect(urls[1]).toContain('luva-viniflex-sem-po-vabene-m')
  })

  it('todo arquivo citado no JSON (do produto ou da variação) existe na pasta', () => {
    for (const p of brutos) {
      if (p.imagem) expect(FOTOS_DOS_DESCARTAVEIS.has(p.imagem)).toBe(true)
      for (const v of p.variacoes) {
        if (v.imagem) expect(FOTOS_DOS_DESCARTAVEIS.has(v.imagem)).toBe(true)
      }
    }
  })

  it('toda foto da pasta está ligada a um produto ou variação (nenhuma esquecida)', () => {
    const ligadas = new Set(
      brutos.flatMap((p) => [
        ...(p.imagem ? [p.imagem] : []),
        ...p.variacoes.flatMap((v) => (v.imagem ? [v.imagem] : [])),
      ]),
    )
    for (const arquivo of FOTOS_DOS_DESCARTAVEIS.keys()) {
      expect(ligadas.has(arquivo)).toBe(true)
    }
  })

  it('o nome do arquivo segue a regra do slug (importador e site concordam)', () => {
    const semExtensao = (a: string) => a.replace(/\.(webp|jpe?g|png)$/i, '')
    for (const p of brutos) {
      const bases = [
        slugDoProduto(p.nome, p.marca),
        slugDoProduto(p.nome, null),
      ]
      // Fotos compartilhadas por mais de um produto são ligadas à mão no importador
      if (p.imagem && !ARQUIVOS_COMPARTILHADOS.includes(p.imagem)) {
        expect(bases).toContain(semExtensao(p.imagem))
      }
      for (const v of p.variacoes) {
        if (!v.imagem) continue
        const sufixo = '-' + slugDoProduto(v.rotulo ?? '', null)
        expect(bases.map((b) => b + sufixo)).toContain(semExtensao(v.imagem))
      }
    }
  })
})

describe('fotoDoDescartavel', () => {
  const luva = (rotulo: string, imagem?: string) => ({ rotulo, imagem })
  const trio = {
    imagem: 'produto.webp',
    variacoes: [luva('P', 'p.webp'), luva('M', 'm.webp'), luva('G', 'g.webp')],
  }

  it('com a variação escolhida, mostra a foto dela', () => {
    expect(fotoDoDescartavel(trio, trio.variacoes[2])).toBe('g.webp')
    expect(fotoDoDescartavel(trio, trio.variacoes[0])).toBe('p.webp')
  })

  it('antes de escolher, mostra a do M', () => {
    expect(fotoDoDescartavel(trio, null)).toBe('m.webp')
  })

  it('sem foto do M, antes de escolher mostra a primeira que existir', () => {
    const semM = {
      variacoes: [luva('P'), luva('M'), luva('G', 'g.webp')],
    }
    expect(fotoDoDescartavel(semM, null)).toBe('g.webp')
  })

  it('tamanho sem foto própria mostra a do tamanho mais próximo (PP usa a do P)', () => {
    const semPP = {
      variacoes: [
        luva('PP'),
        luva('P', 'p.webp'),
        luva('M', 'm.webp'),
        luva('G', 'g.webp'),
      ],
    }
    expect(fotoDoDescartavel(semPP, semPP.variacoes[0])).toBe('p.webp')
    const semGG = {
      variacoes: [luva('M', 'm.webp'), luva('G', 'g.webp'), luva('GG')],
    }
    expect(fotoDoDescartavel(semGG, semGG.variacoes[2])).toBe('g.webp')
  })

  it('fragrância sem foto própria mostra a da primeira que tem', () => {
    const sabonete = {
      variacoes: [
        luva('Erva Doce', 'erva-doce.webp'),
        luva('Frutas Vermelhas'),
        luva('Pistache'),
      ],
    }
    expect(fotoDoDescartavel(sabonete, null)).toBe('erva-doce.webp')
    expect(fotoDoDescartavel(sabonete, sabonete.variacoes[2])).toBe(
      'erva-doce.webp',
    )
  })

  it('variação escolhida sem foto própria cai na foto padrão (M)', () => {
    const faltaP = {
      variacoes: [luva('P'), luva('M', 'm.webp'), luva('G', 'g.webp')],
    }
    expect(fotoDoDescartavel(faltaP, faltaP.variacoes[0])).toBe('m.webp')
  })

  it('produto com uma foto só continua como está, escolhida a variação ou não', () => {
    const umaFoto = {
      imagem: 'unica.webp',
      variacoes: [luva('P'), luva('M'), luva('G')],
    }
    expect(fotoDoDescartavel(umaFoto, null)).toBe('unica.webp')
    expect(fotoDoDescartavel(umaFoto, umaFoto.variacoes[2])).toBe('unica.webp')
  })

  it('sem nenhuma foto devolve undefined (o card usa o ícone da categoria)', () => {
    expect(
      fotoDoDescartavel({ variacoes: [luva('P'), luva('M')] }, null),
    ).toBeUndefined()
  })
})

describe('slugDoProduto', () => {
  it('nome mais marca, sem acento, em minúsculas e com hífens', () => {
    expect(slugDoProduto('Luva de Vinil Sem Pó', 'Vabene')).toBe(
      'luva-de-vinil-sem-po-vabene',
    )
    expect(slugDoProduto('Água Sanitária 5 L', 'Gopabo')).toBe(
      'agua-sanitaria-5-l-gopabo',
    )
  })

  it('sem marca confirmada, só o nome', () => {
    expect(slugDoProduto('Abaixador de Língua', null)).toBe(
      'abaixador-de-lingua',
    )
  })

  it('as águas sanitárias de 5 L têm slugs diferentes (uma foto por marca)', () => {
    const slugs = DESCARTAVEIS.filter(
      (p) => p.nome === 'Água Sanitária 5 L',
    ).map((p) => slugDoProduto(p.nome, p.marca))
    expect(new Set(slugs).size).toBe(3)
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

  it('o item leva a foto da variação escolhida', () => {
    const flex = DESCARTAVEIS.find((p) => p.nome === 'Luva Viniflex Sem Pó')!
    const item = paraCarrinho(flex, flex.variacoes[2])
    expect(item.imagem).toBe(flex.variacoes[2].imagem)
    expect(item.imagem).toContain('luva-viniflex-sem-po-vabene-g')
  })

  it('produto sem variação não tem variant, e sem embalagem fica vazio', () => {
    const p = DESCARTAVEIS.find((x) => x.nome === 'Abaixador de Língua')!
    const item = paraCarrinho(p, p.variacoes[0])
    expect(item.variant).toBeNull()
    expect(item.tamanho).toBe('Pacote com 100')
    expect(item.linha).toBeNull()
  })
})
