import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PromoHero from '../components/tulipia/PromoHero'
import PromoStrip from '../components/tulipia/PromoStrip'
import {
  PROMO_ESQUENTA_BLACK_SEMANA_1,
  PROMO_ESQUENTA_BLACK_SEMANA_2,
  PROMO_ESQUENTA_BLACK_SEMANA_3,
  PROMOCAO_ATUAL,
  PROMOCOES,
  ofertaDeHoje,
} from '../data/promocoes'

// o banner geral é o mesmo objeto nas semanas 2 e 3
const HERO_GERAL = PROMO_ESQUENTA_BLACK_SEMANA_3.hero
import { ALL_PRODUCTS, findProductById } from '../data/tulipiaProducts'
import { TULIPIA_VITRINE } from '../data/tulipiaVitrine'
import vitrineFonte from '../data/tulipiaVitrine.ts?raw'
import paginaFonte from '../pages/Tulipia.tsx?raw'
import {
  CHAVE_FILTRO_PROMOCAO,
  diaEmSaoPaulo,
  ordenarPelosSkus,
  promocaoVigente,
} from './promocao'

describe('PROMO_ESQUENTA_BLACK_SEMANA_1', () => {
  const { skus } = PROMO_ESQUENTA_BLACK_SEMANA_1

  it('tem os 16 produtos da semana 1', () => {
    expect(skus).toHaveLength(16)
  })

  it('não repete sku', () => {
    expect(new Set(skus).size).toBe(skus.length)
  })

  it.each(PROMO_ESQUENTA_BLACK_SEMANA_1.skus)(
    'o sku %s existe no catálogo',
    (sku) => {
      expect(findProductById(sku)).toBeDefined()
    },
  )
})

describe('PROMO_ESQUENTA_BLACK_SEMANA_2', () => {
  const semana2 = PROMO_ESQUENTA_BLACK_SEMANA_2

  it('tem os 10 produtos das máscaras, na ordem combinada', () => {
    expect(semana2.skus).toHaveLength(10)
    expect(semana2.skus[0]).toBe('chokola-mascara-de-chocolate-200g-28')
    expect(semana2.skus[9]).toBe('kit-life-c-profissional-kit-90')
    expect(new Set(semana2.skus).size).toBe(10)
  })

  it.each(PROMO_ESQUENTA_BLACK_SEMANA_2.skus)(
    'o sku %s existe no catálogo',
    (sku) => {
      expect(findProductById(sku)).toBeDefined()
    },
  )

  it('usa o banner geral (1920x565) e o rótulo das máscaras', () => {
    expect(semana2.rotuloFiltro).toBe('Esquenta Black: Máscaras até 30% OFF')
    expect(semana2.hero.proporcao).toBe('aspect-[1920/565]')
    expect(semana2.hero.src).toMatch(/banner-esquenta-black-geral-01-a-20/)
  })

  it('a faixa está fora do ar e as artes da semana 2 ficam guardadas', () => {
    expect(semana2.faixa).toBeNull()
    expect(semana2.reserva?.hero).toMatch(/semana-2-mascaras-desktop/)
    expect(semana2.reserva?.faixa).toMatchObject({
      largura: 2720,
      altura: 340,
    })
  })
})

describe('PROMO_ESQUENTA_BLACK_SEMANA_3', () => {
  const semana3 = PROMO_ESQUENTA_BLACK_SEMANA_3

  it('tem os 8 séruns, na ordem combinada', () => {
    expect(semana3.skus).toEqual([
      'skin-molecular-serum-de-vitamina-b12-30ml-18',
      'niacine-serum-de-niacinamida-20-30ml-7',
      'immortalite-c-nano-serum-de-vitamina-c-50ml-9',
      'resilience-serum-multirreparador-calmante-50ml-19',
      'dermo-estetic-serum-ultra-calmante-50ml-52',
      'hialux-serum-preenchedor-30ml-124',
      'black-secret-peeling-facial-2-fases-30g-cada-121',
      'age-matte-serum-antioleosidade-50ml-20',
    ])
    expect(new Set(semana3.skus).size).toBe(8)
  })

  it.each(PROMO_ESQUENTA_BLACK_SEMANA_3.skus)(
    'o sku %s existe no catálogo',
    (sku) => {
      expect(findProductById(sku)).toBeDefined()
    },
  )

  it('o rótulo, o período e a faixa (2720x340) são os da semana 3', () => {
    expect(semana3.rotuloFiltro).toBe('Esquenta Black: Séruns até 30% OFF')
    expect([semana3.inicio, semana3.fim]).toEqual(['2026-11-16', '2026-11-19'])
    expect(semana3.faixa).toMatchObject({ largura: 2720, altura: 340 })
    expect(semana3.faixa?.src).toMatch(/faixa-esquenta-black-semana-3-seruns/)
  })

  it('o banner é o geral, de 01 a 20/11', () => {
    expect(semana3.hero.src).toMatch(/banner-esquenta-black-geral-01-a-20/)
    expect([semana3.hero.inicio, semana3.hero.fim]).toEqual([
      '2026-11-01',
      '2026-11-20',
    ])
  })
})

describe('o que aparece em cada dia (fuso de São Paulo, extremos inclusive)', () => {
  // meio-dia em São Paulo (15h UTC) do dia pedido
  const dia = (d: string) => ofertaDeHoje(new Date(`${d}T15:00:00Z`))

  it('antes do início (31/10) nada aparece', () => {
    expect(dia('2026-10-31')).toEqual({
      promocao: null,
      hero: null,
      faixa: null,
    })
    // 31/10 às 23h59 em São Paulo ainda é antes
    expect(ofertaDeHoje(new Date('2026-11-01T02:59:59Z')).hero).toBeNull()
  })

  it('começa à meia-noite de 01/11 em São Paulo, com a semana 1', () => {
    const oferta = ofertaDeHoje(new Date('2026-11-01T03:00:00Z'))
    expect(oferta.promocao).toBe(PROMO_ESQUENTA_BLACK_SEMANA_1)
    expect(oferta.hero).toBe(PROMO_ESQUENTA_BLACK_SEMANA_1.hero)
  })

  it('a semana 1 vale até 08/11 e a semana 2 assume no dia 9', () => {
    expect(ofertaDeHoje(new Date('2026-11-09T02:59:59Z')).promocao).toBe(
      PROMO_ESQUENTA_BLACK_SEMANA_1,
    )
    expect(ofertaDeHoje(new Date('2026-11-09T03:00:00Z')).promocao).toBe(
      PROMO_ESQUENTA_BLACK_SEMANA_2,
    )
  })

  it('15/11: semana 2 (máscaras), banner geral e SEM faixa da semana 3', () => {
    const oferta = dia('2026-11-15')
    expect(oferta.promocao).toBe(PROMO_ESQUENTA_BLACK_SEMANA_2)
    expect(oferta.hero).toBe(HERO_GERAL)
    expect(oferta.faixa).toBeNull()
  })

  it.each(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'])(
    '%s: semana 3 (séruns) com banner geral e com a faixa da semana 3',
    (d) => {
      const oferta = dia(d)
      expect(oferta.promocao).toBe(PROMO_ESQUENTA_BLACK_SEMANA_3)
      expect(oferta.hero).toBe(HERO_GERAL)
      expect(oferta.faixa?.arte).toBe(PROMO_ESQUENTA_BLACK_SEMANA_3.faixa)
    },
  )

  it('20/11: sem faixa, mas com o banner geral (filtrando a última semana)', () => {
    const oferta = dia('2026-11-20')
    expect(oferta.faixa).toBeNull()
    expect(oferta.hero).toBe(HERO_GERAL)
    expect(oferta.promocao).toBe(PROMO_ESQUENTA_BLACK_SEMANA_3)
  })

  it('20/11 vale até 23h59 em São Paulo; a partir de 21/11 nada aparece', () => {
    expect(ofertaDeHoje(new Date('2026-11-21T02:59:59Z')).hero).toBe(HERO_GERAL)
    expect(ofertaDeHoje(new Date('2026-11-21T03:00:00Z'))).toEqual({
      promocao: null,
      hero: null,
      faixa: null,
    })
    expect(dia('2026-12-05').hero).toBeNull()
  })

  it('o dia de São Paulo, não o de Greenwich', () => {
    expect(diaEmSaoPaulo(new Date('2026-11-21T02:00:00Z'))).toBe('2026-11-20')
    expect(diaEmSaoPaulo(new Date('2026-11-21T03:00:00Z'))).toBe('2026-11-21')
  })

  it('promocaoVigente devolve a primeira que vale e null sem nenhuma', () => {
    const lista = [
      { inicio: '2026-01-01', fim: '2026-01-31', nome: 'a' },
      { inicio: '2026-01-15', fim: '2026-02-28', nome: 'b' },
    ]
    expect(promocaoVigente(lista, new Date('2026-01-20T15:00:00Z'))?.nome).toBe(
      'a',
    )
    expect(promocaoVigente(lista, new Date('2026-02-10T15:00:00Z'))?.nome).toBe(
      'b',
    )
    expect(promocaoVigente(lista, new Date('2026-03-01T15:00:00Z'))).toBeNull()
  })

  it('toda promoção tem datas válidas e início antes do fim', () => {
    for (const p of PROMOCOES) {
      for (const periodo of [p, p.hero]) {
        expect(periodo.inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(periodo.fim).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(periodo.inicio <= periodo.fim).toBe(true)
      }
    }
  })

  it('as semanas não se sobrepõem', () => {
    for (const [i, p] of PROMOCOES.entries()) {
      const anterior = PROMOCOES[i - 1]
      if (anterior) expect(anterior.fim < p.inicio).toBe(true)
    }
  })
})

describe('faixa e banner na página', () => {
  const comFaixa = {
    arte: PROMO_ESQUENTA_BLACK_SEMANA_3.faixa!,
    alt: PROMO_ESQUENTA_BLACK_SEMANA_3.alt,
  }
  const naoFaz = () => {}

  it('sem faixa vigente a faixa não renderiza nada (nem espaço)', () => {
    expect(
      renderToStaticMarkup(
        createElement(PromoStrip, { faixa: null, onClick: naoFaz }),
      ),
    ).toBe('')
  })

  it('a faixa vigente usa a proporção real da imagem, sem aspect fixo', () => {
    const html = renderToStaticMarkup(
      createElement(PromoStrip, { faixa: comFaixa, onClick: naoFaz }),
    )
    expect(html).toContain('aspect-ratio:2720 / 340')
    expect(html).toContain('width="2720"')
    expect(html).not.toMatch(/aspect-\[/)
  })

  it('a proporção da faixa muda de uma promoção para outra (2720x200 na semana 1)', () => {
    const html = renderToStaticMarkup(
      createElement(PromoStrip, {
        faixa: {
          arte: PROMO_ESQUENTA_BLACK_SEMANA_1.faixa!,
          alt: 'x',
        },
        onClick: naoFaz,
      }),
    )
    expect(html).toContain('aspect-ratio:2720 / 200')
  })

  it('sem banner vigente o banner principal não renderiza', () => {
    expect(
      renderToStaticMarkup(
        createElement(PromoHero, { hero: null, onClick: naoFaz }),
      ),
    ).toBe('')
  })

  it('o banner principal usa a proporção da própria arte', () => {
    const html = renderToStaticMarkup(
      createElement(PromoHero, { hero: HERO_GERAL, onClick: naoFaz }),
    )
    expect(html).toContain('aspect-[1920/565]')
    expect(html).not.toContain('aspect-[1920/837]')
  })

  it('a página só mostra a vitrine "Ofertas do mês" com promoção no ar', () => {
    expect(paginaFonte).toMatch(/ofertaDeHoje\(\)/)
    expect(paginaFonte).toMatch(
      /item\.key !== CHAVE_FILTRO_PROMOCAO \|\| promocao !== null/,
    )
  })
})

describe('PROMOCAO_ATUAL e a grade filtrada pela promoção', () => {
  const noFiltro = ALL_PRODUCTS.filter((p) =>
    PROMO_ESQUENTA_BLACK_SEMANA_1.skus.includes(p.id),
  )

  it('a promoção configurada tem banner e a mais recente é a semana 3', () => {
    expect(PROMOCAO_ATUAL.hero).toBeTruthy()
    expect(PROMOCAO_ATUAL).toBe(PROMO_ESQUENTA_BLACK_SEMANA_3)
  })

  it('o catálogo não traz os produtos na ordem da promoção (senão o teste não prova nada)', () => {
    expect(noFiltro.map((p) => p.id)).not.toEqual(
      PROMO_ESQUENTA_BLACK_SEMANA_1.skus,
    )
  })

  it('a grade segue a ordem dos skus da promoção, começando pelo Marezi Nano Sabonete 300 ml', () => {
    const ordenados = ordenarPelosSkus(
      noFiltro,
      PROMO_ESQUENTA_BLACK_SEMANA_1.skus,
    )
    expect(ordenados.map((p) => p.id)).toEqual(
      PROMO_ESQUENTA_BLACK_SEMANA_1.skus,
    )
    expect(ordenados[0].id).toBe('marezi-nano-sabonete-hidratante-300ml-41')
    expect(ordenados[0].nome).toMatch(/Marezi/i)
  })

  it('quem não está na lista vai para o fim, na ordem em que estava, e a lista original não muda', () => {
    const misturados = ALL_PRODUCTS.slice(0, 12)
    const copia = [...misturados]
    const skus = [misturados[7].id, misturados[3].id]
    const ordenados = ordenarPelosSkus(misturados, skus)
    expect(ordenados.slice(0, 2).map((p) => p.id)).toEqual(skus)
    expect(ordenados.slice(2)).toEqual(
      copia.filter((p) => !skus.includes(p.id)),
    )
    expect(misturados).toEqual(copia)
  })

  it('só o filtro da promoção define a ordem: vitrine e tipos de pele seguem a ordem do catálogo', () => {
    expect(paginaFonte).toMatch(/ordem: promocao\.skus/)
    expect(paginaFonte.match(/ordem: /g)).toHaveLength(1)
    // só o Corporal (lista por sku, na ordem combinada) tem ordem própria
    expect(vitrineFonte.match(/ordem\??:/g)).toHaveLength(2)
    expect(TULIPIA_VITRINE.filter((v) => v.ordem).map((v) => v.key)).toEqual([
      'corporal',
    ])
  })
})

describe('vitrine de ícones da /tulipia', () => {
  it('segue a ordem da Tulípia, só com os ícones que têm produto', () => {
    expect(TULIPIA_VITRINE.map((v) => v.label)).toEqual([
      'Mais Vendidos',
      'Ofertas do mês',
      'Alta Tecnologia',
      'Máscaras',
      'Séruns',
      'Sabonetes',
      'Protocolos',
      'Vitamina C',
      'Corporal',
    ])
  })

  it('"Ofertas do mês" usa a chave do filtro da promoção e os skus de PROMOCAO_ATUAL', () => {
    const ofertas = TULIPIA_VITRINE.find((v) => v.label === 'Ofertas do mês')
    expect(ofertas?.key).toBe(CHAVE_FILTRO_PROMOCAO)
    expect(
      ALL_PRODUCTS.filter((p) => ofertas?.match(p))
        .map((p) => p.id)
        .sort(),
    ).toEqual([...PROMOCAO_ATUAL.skus].sort())
  })

  it('"Alta Tecnologia" continua sendo a categoria Ampolas', () => {
    const alta = TULIPIA_VITRINE.find((v) => v.key === 'alta-tecnologia')
    const ids = ALL_PRODUCTS.filter((p) => alta?.match(p))
    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((p) => p.categoria === 'Ampolas')).toBe(true)
  })

  it('as chaves são únicas', () => {
    const chaves = TULIPIA_VITRINE.map((v) => v.key)
    expect(new Set(chaves).size).toBe(chaves.length)
  })
})
