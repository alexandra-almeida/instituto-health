import { describe, expect, it } from 'vitest'
import { PROMO_ESQUENTA_BLACK_SEMANA_2 } from '../data/promocoes'
import { TULIPIA_LINE_BANNERS } from '../data/tulipiaLineBanners'
import { ALL_PRODUCTS, findProductById } from '../data/tulipiaProducts'
import { SKUS_CORPORAIS, TULIPIA_VITRINE } from '../data/tulipiaVitrine'
import { avisoDosExclusivos } from './exclusivos'
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

// O que o modo Home Care mostra: só os produtos públicos
const publico = (p: { exclusivoProfissional: boolean }) =>
  !p.exclusivoProfissional

describe('Corporal na vitrine', () => {
  const corporal = TULIPIA_VITRINE.find((v) => v.key === 'corporal')
  const doFiltro = ALL_PRODUCTS.filter((p) => corporal?.match(p))

  it('vem depois dos 8 ícones que já existiam, com o ícone PersonStanding', () => {
    expect(TULIPIA_VITRINE).toHaveLength(9)
    expect(TULIPIA_VITRINE[8]?.key).toBe('corporal')
    expect(corporal?.label).toBe('Corporal')
    expect(corporal?.Icon.displayName ?? '').toMatch(/PersonStanding/)
  })

  it('são 13 skus, sem repetir, e todos existem no catálogo', () => {
    expect(SKUS_CORPORAIS).toHaveLength(13)
    expect(new Set(SKUS_CORPORAIS).size).toBe(13)
    for (const sku of SKUS_CORPORAIS) expect(findProductById(sku)).toBeDefined()
  })

  it('Profissional vê os 13 e Home Care vê só os 2 Firm Flaccid', () => {
    expect(doFiltro).toHaveLength(13)
    const homeCare = doFiltro.filter(publico)
    expect(homeCare.map((p) => p.id).sort()).toEqual([
      'firm-flaccid-nano-fluido-remineralizante-300ml-4',
      'firm-flaccid-nano-fluido-remineralizante-60ml-2',
    ])
  })

  it('não mexe no campo categoria: o filtro é por sku', () => {
    const categorias = new Set(doFiltro.map((p) => p.categoria))
    expect(categorias.size).toBeGreaterThan(1)
  })

  it('a ordem da grade é a da lista', () => {
    expect(corporal?.ordem).toBe(SKUS_CORPORAIS)
  })
})

describe('aviso dos exclusivos em Home Care', () => {
  it('nada escondido: sem aviso', () => {
    expect(avisoDosExclusivos(5, 0)).toBeNull()
    expect(avisoDosExclusivos(0, 0)).toBeNull()
  })

  it('tudo escondido: diz que são exclusivos', () => {
    expect(avisoDosExclusivos(0, 10)).toBe(
      'Estes produtos são exclusivos para profissionais.',
    )
  })

  it('alguns escondidos: "Mais N", no singular e no plural', () => {
    expect(avisoDosExclusivos(2, 1)).toBe(
      'Mais 1 produto exclusivo para profissionais.',
    )
    expect(avisoDosExclusivos(2, 11)).toBe(
      'Mais 11 produtos exclusivos para profissionais.',
    )
  })

  it('Corporal em Home Care: 2 à mostra e "Mais 11 produtos exclusivos"', () => {
    const corporal = TULIPIA_VITRINE.find((v) => v.key === 'corporal')
    const doFiltro = ALL_PRODUCTS.filter((p) => corporal?.match(p))
    expect(
      avisoDosExclusivos(
        doFiltro.filter(publico).length,
        doFiltro.filter((p) => !publico(p)).length,
      ),
    ).toBe('Mais 11 produtos exclusivos para profissionais.')
  })

  it('Marezi em Home Care: 1 à mostra e "Mais 4 produtos exclusivos"', () => {
    const marezi = TULIPIA_LINE_BANNERS.find((b) => b.key === 'marezi')
    const daLinha = ALL_PRODUCTS.filter((p) => marezi?.match(p))
    expect(
      avisoDosExclusivos(
        daLinha.filter(publico).length,
        daLinha.filter((p) => !publico(p)).length,
      ),
    ).toBe('Mais 4 produtos exclusivos para profissionais.')
  })

  it('a promoção das máscaras em Home Care não tem nada público: só o aviso', () => {
    const daPromo = ALL_PRODUCTS.filter((p) =>
      PROMO_ESQUENTA_BLACK_SEMANA_2.skus.includes(p.id),
    )
    expect(daPromo.filter(publico)).toHaveLength(0)
    expect(avisoDosExclusivos(0, daPromo.length)).toBe(
      'Estes produtos são exclusivos para profissionais.',
    )
  })

  it('a página mostra o aviso com o botão "Ver como profissional", para qualquer filtro', () => {
    expect(paginaFonte).toMatch(/avisoDosExclusivos\(/)
    expect(paginaFonte).toMatch(/>\s*Ver como profissional\s*</)
    expect(paginaFonte).toMatch(/setAudience\('profissional'\)/)
    // vale para filtro livre, categoria, linha e cuidado
    const inicio = paginaFonte.indexOf('function combinaComOFiltro')
    const corpo = paginaFonte.slice(
      inicio,
      paginaFonte.indexOf('const filtrando'),
    )
    for (const modo of ['customFilter', 'categoria', 'cuidado', 'linha']) {
      expect(corpo).toContain(modo)
    }
  })
})

describe('grade com filtro ligado', () => {
  it('parte de todos os produtos do público, inclusive os queridinhos do destaque', () => {
    const inicio = paginaFonte.indexOf('const browsedProducts')
    const corpo = paginaFonte.slice(
      inicio,
      paginaFonte.indexOf('const showAlsoLike'),
    )
    expect(paginaFonte).toMatch(/const filterPool = useMemo/)
    // só a visão "Todos" sem filtro usa a grade sem os destaques editoriais
    expect(corpo.match(/gridPool/g)).toHaveLength(2)
    expect(corpo.match(/filterPool\.filter/g)).toHaveLength(4)
  })

  it('os Firm Flaccid (queridinhos) entram no Corporal de Home Care', () => {
    const firm = ALL_PRODUCTS.filter((p) => /^firm-flaccid/.test(p.id))
    expect(firm.length).toBe(2)
    expect(firm.every((p) => p.destaque && !p.exclusivoProfissional)).toBe(true)
  })
})
