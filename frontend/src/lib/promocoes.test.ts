import { describe, expect, it } from 'vitest'
import {
  PROMO_ESQUENTA_BLACK_SEMANA_1,
  PROMOCAO_ATUAL,
} from '../data/promocoes'
import { ALL_PRODUCTS, findProductById } from '../data/tulipiaProducts'
import { TULIPIA_VITRINE } from '../data/tulipiaVitrine'
import vitrineFonte from '../data/tulipiaVitrine.ts?raw'
import paginaFonte from '../pages/Tulipia.tsx?raw'
import { CHAVE_FILTRO_PROMOCAO, ordenarPelosSkus } from './promocao'

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

describe('PROMOCAO_ATUAL e a grade filtrada pela promoção', () => {
  const noFiltro = ALL_PRODUCTS.filter((p) =>
    PROMOCAO_ATUAL.skus.includes(p.id),
  )

  it('a promoção que está no ar tem faixa e banner', () => {
    expect(PROMOCAO_ATUAL.faixa).toBeTruthy()
    expect(PROMOCAO_ATUAL.hero).toBeTruthy()
  })

  it('o catálogo não traz os produtos na ordem da promoção (senão o teste não prova nada)', () => {
    expect(noFiltro.map((p) => p.id)).not.toEqual(PROMOCAO_ATUAL.skus)
  })

  it('a grade segue a ordem dos skus da promoção, começando pelo Marezi Nano Sabonete 300 ml', () => {
    const ordenados = ordenarPelosSkus(noFiltro, PROMOCAO_ATUAL.skus)
    expect(ordenados.map((p) => p.id)).toEqual(PROMOCAO_ATUAL.skus)
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
    expect(paginaFonte).toMatch(/ordem: PROMOCAO_ATUAL\.skus/)
    expect(paginaFonte.match(/ordem: /g)).toHaveLength(1)
    expect(vitrineFonte).not.toMatch(/ordem\??:/)
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
