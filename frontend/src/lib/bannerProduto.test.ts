import { describe, expect, it } from 'vitest'
import queridinhosFonte from '../components/tulipia/QueridinhosDestaque.tsx?raw'
import { ALL_PRODUCTS, findProductById } from '../data/tulipiaProducts'
import paginaFonte from '../pages/Tulipia.tsx?raw'
import { dadosDoCartao } from './bannerProduto'

const SKU_FLORATY = 'floraty-creme-emoliente-para-cravos-200g-1'

describe('dadosDoCartao', () => {
  it('monta o card do Floraty pelo catálogo: exclusivo, sem preço', () => {
    const produto = findProductById(SKU_FLORATY)
    expect(produto).toBeDefined()
    expect(dadosDoCartao(produto!)).toEqual({
      marca: 'Floraty',
      nome: 'Creme Emoliente para Cravos',
      tamanho: '200g',
      exclusivo: true,
      preco: null,
    })
  })

  it('produto com preço público mostra o preço e não é exclusivo', () => {
    const publico = ALL_PRODUCTS.find(
      (p) => !p.exclusivoProfissional && p.preco !== null && p.linha !== null,
    )
    expect(publico).toBeDefined()
    const dados = dadosDoCartao(publico!)
    expect(dados.exclusivo).toBe(false)
    expect(dados.preco).toBe(publico!.preco)
    expect(dados.marca).toBe(publico!.linha)
  })

  it('produto sem linha usa o nome como marca e não repete o nome', () => {
    const semLinha = ALL_PRODUCTS.find((p) => p.linha === null)
    expect(semLinha).toBeDefined()
    const dados = dadosDoCartao(semLinha!)
    expect(dados.marca).toBe(semLinha!.displayName)
    expect(dados.nome).toBeNull()
  })

  it('exclusivo nunca mostra preço, mesmo que o catálogo tenha um', () => {
    const produto = findProductById(SKU_FLORATY)!
    expect(
      dadosDoCartao({ ...produto, preco: 99, exclusivoProfissional: true })
        .preco,
    ).toBeNull()
  })
})

describe('estrutura da página /tulipia', () => {
  it('o banner do Floraty aparece uma vez só, na página e não nos Queridinhos', () => {
    expect(paginaFonte.match(/<BannerProduto/g)).toHaveLength(1)
    expect(paginaFonte).toContain(SKU_FLORATY)
    expect(queridinhosFonte).not.toMatch(/floraty|BannerImagem/i)
    expect(queridinhosFonte).toMatch(/>\s*Queridinhos\s*</)
  })

  it('o bloco do Hidrasol saiu da página', () => {
    expect(paginaFonte).not.toMatch(/Hidrasol|LaunchBanner|Últimos Lançamentos/)
  })

  it('a faixa da promoção fica no fim da página, depois da grade, e o banner no topo', () => {
    const faixa = paginaFonte.indexOf('<PromoStrip')
    expect(paginaFonte.match(/<PromoStrip/g)).toHaveLength(1)
    expect(faixa).toBeGreaterThan(paginaFonte.indexOf('browsedProducts.map'))
    expect(faixa).toBeGreaterThan(paginaFonte.indexOf('<VocePodeGostar'))
    expect(paginaFonte.indexOf('<PromoHero')).toBeLessThan(
      paginaFonte.indexOf('<BannerProduto'),
    )
  })

  it('o clique na promoção limpa a busca e, com o filtro já ligado, só rola', () => {
    const inicio = paginaFonte.indexOf('function handlePromoClick')
    const clique = paginaFonte.slice(
      inicio,
      paginaFonte.indexOf('}\n\n', inicio),
    )
    expect(clique).toContain("setSearch('')")
    expect(clique).toMatch(/customFilter\?\.key !== CHAVE_FILTRO_PROMOCAO/)
  })
})
