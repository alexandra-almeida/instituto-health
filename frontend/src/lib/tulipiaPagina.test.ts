import { describe, expect, it } from 'vitest'
import { ALL_PRODUCTS } from '../data/tulipiaProducts'
import { TULIPIA_LINE_BANNERS } from '../data/tulipiaLineBanners'
import paginaFonte from '../pages/Tulipia.tsx?raw'

describe('banner da linha Marezi', () => {
  const marezi = TULIPIA_LINE_BANNERS.find((b) => b.key === 'marezi')

  it('existe, com a proporção real da arte (1920x350)', () => {
    expect(marezi).toBeDefined()
    expect(marezi?.aspectClass).toBe('aspect-[1920/350]')
  })

  it('o filtro pega os 5 produtos Marezi: 4 exclusivos e só 1 público', () => {
    const daLinha = ALL_PRODUCTS.filter((p) => marezi?.match(p))
    expect(daLinha).toHaveLength(5)
    expect(daLinha.filter((p) => !p.exclusivoProfissional)).toHaveLength(1)
  })

  it('fica no fim da página, depois da grade e antes da faixa', () => {
    const banner = paginaFonte.indexOf('mareziBanner && (')
    expect(banner).toBeGreaterThan(paginaFonte.indexOf('browsedProducts.map'))
    expect(banner).toBeLessThan(paginaFonte.indexOf('<PromoStrip'))
  })

  it('o clique aplica o filtro da linha (limpando a busca)', () => {
    expect(paginaFonte).toMatch(/applyCustomFilter\(mareziBanner\)/)
    const inicio = paginaFonte.indexOf('function applyCustomFilter')
    const corpo = paginaFonte.slice(
      inicio,
      paginaFonte.indexOf('}\n\n', inicio),
    )
    expect(corpo).toContain("setSearch('')")
  })

  it('o bloco do topo continua só com ProSkin, Dermo Estetic e Ampolas', () => {
    expect(paginaFonte).toMatch(
      /proskinBanner \|\| dermoEsteticBanner \|\| ampolasBanner/,
    )
  })
})
