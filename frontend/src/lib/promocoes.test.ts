import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PromoHero from '../components/tulipia/PromoHero'
import PromoStrip from '../components/tulipia/PromoStrip'
import {
  PROMO_ESQUENTA_BLACK_SEMANA_1,
  PROMO_ESQUENTA_BLACK_SEMANA_2,
  PROMOCAO_ATUAL,
  PROMOCOES,
  promocaoDeHoje,
} from '../data/promocoes'
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
    expect(semana2.heroProporcao).toBe('aspect-[1920/565]')
    expect(semana2.hero).toMatch(/banner-esquenta-black-geral-01-a-20/)
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

describe('período das promoções (fuso de São Paulo, extremos inclusive)', () => {
  const durante = new Date('2026-11-16T15:00:00Z')

  it('antes do início, nenhuma promoção está no ar', () => {
    expect(promocaoDeHoje(new Date('2026-10-31T12:00:00Z'))).toBeNull()
    // 31/10 às 23h59 em São Paulo ainda é antes
    expect(promocaoDeHoje(new Date('2026-11-01T02:59:59Z'))).toBeNull()
  })

  it('começa à meia-noite de 01/11 em São Paulo', () => {
    expect(promocaoDeHoje(new Date('2026-11-01T03:00:00Z'))).toBe(
      PROMO_ESQUENTA_BLACK_SEMANA_1,
    )
  })

  it('a semana 1 vale até 08/11 e a semana 2 assume no dia seguinte', () => {
    expect(promocaoDeHoje(new Date('2026-11-09T02:59:59Z'))).toBe(
      PROMO_ESQUENTA_BLACK_SEMANA_1,
    )
    expect(promocaoDeHoje(new Date('2026-11-09T03:00:00Z'))).toBe(
      PROMO_ESQUENTA_BLACK_SEMANA_2,
    )
  })

  it('durante o período, a semana 2 está no ar', () => {
    expect(promocaoDeHoje(durante)).toBe(PROMO_ESQUENTA_BLACK_SEMANA_2)
  })

  it('20/11 ainda vale até 23h59 em São Paulo; a partir de 21/11 some', () => {
    expect(promocaoDeHoje(new Date('2026-11-21T02:59:59Z'))).toBe(
      PROMO_ESQUENTA_BLACK_SEMANA_2,
    )
    expect(promocaoDeHoje(new Date('2026-11-21T03:00:00Z'))).toBeNull()
    expect(promocaoDeHoje(new Date('2026-12-05T12:00:00Z'))).toBeNull()
  })

  it('usa o dia de São Paulo, não o de Greenwich', () => {
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
      expect(p.inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.fim).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.inicio <= p.fim).toBe(true)
    }
  })
})

describe('faixa e banner da promoção na página', () => {
  const semFaixa = PROMO_ESQUENTA_BLACK_SEMANA_2
  const comFaixa = PROMO_ESQUENTA_BLACK_SEMANA_1
  const naoFaz = () => {}

  it('faixa nula não renderiza nada (nem espaço)', () => {
    expect(
      renderToStaticMarkup(
        createElement(PromoStrip, { promocao: semFaixa, onClick: naoFaz }),
      ),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        createElement(PromoStrip, { promocao: null, onClick: naoFaz }),
      ),
    ).toBe('')
  })

  it('faixa vigente usa a proporção real da imagem, sem aspect fixo', () => {
    const html = renderToStaticMarkup(
      createElement(PromoStrip, { promocao: comFaixa, onClick: naoFaz }),
    )
    expect(html).toContain('aspect-ratio:2720 / 200')
    expect(html).toContain('width="2720"')
    expect(html).not.toMatch(/aspect-\[/)
  })

  it('sem promoção o banner principal não renderiza', () => {
    expect(
      renderToStaticMarkup(
        createElement(PromoHero, { promocao: null, onClick: naoFaz }),
      ),
    ).toBe('')
  })

  it('o banner principal usa a proporção da própria promoção', () => {
    const html = renderToStaticMarkup(
      createElement(PromoHero, { promocao: semFaixa, onClick: naoFaz }),
    )
    expect(html).toContain('aspect-[1920/565]')
    expect(html).not.toContain('aspect-[1920/837]')
  })

  it('a página só mostra a vitrine "Ofertas do mês" com promoção no ar', () => {
    expect(paginaFonte).toMatch(/promocaoDeHoje\(\)/)
    expect(paginaFonte).toMatch(
      /item\.key !== CHAVE_FILTRO_PROMOCAO \|\| promocao !== null/,
    )
  })
})

describe('PROMOCAO_ATUAL e a grade filtrada pela promoção', () => {
  const noFiltro = ALL_PRODUCTS.filter((p) =>
    PROMO_ESQUENTA_BLACK_SEMANA_1.skus.includes(p.id),
  )

  it('a promoção configurada tem banner e a mais recente é a semana 2', () => {
    expect(PROMOCAO_ATUAL.hero).toBeTruthy()
    expect(PROMOCAO_ATUAL).toBe(PROMO_ESQUENTA_BLACK_SEMANA_2)
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
