import { describe, expect, it } from 'vitest'
import bannerImagemFonte from '../components/tulipia/BannerImagem.tsx?raw'
import bannerProdutoFonte from '../components/tulipia/BannerProduto.tsx?raw'
import queridinhosFonte from '../components/tulipia/QueridinhosDestaque.tsx?raw'
import { ALL_PRODUCTS, findProductById } from '../data/tulipiaProducts'
import paginaFonte from '../pages/Tulipia.tsx?raw'
import { dadosDoCartao } from './bannerProduto'

const SKU_FLORATY = 'floraty-creme-emoliente-para-cravos-200g-1'
const SKU_KIT_ESTETICISTA = 'kit-esteticista-para-limpeza-de-pele-kit-63'
const SKU_EXOGENETIC = 'exogenetic-pdrn-creme-facial-30g-57'

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
  it('os queridinhos usam o banner do Kit Esteticista, e o do Floraty saiu da página', () => {
    expect(paginaFonte).toMatch(
      /SKU_BANNER_QUERIDINHOS = 'kit-esteticista-para-limpeza-de-pele-kit-63'/,
    )
    expect(paginaFonte).toContain('banner-queridinhos-kit-esteticista-desktop')
    expect(paginaFonte).not.toContain('banner-queridinhos-floraty')
    expect(queridinhosFonte).not.toMatch(/floraty|BannerImagem/i)
    expect(queridinhosFonte).toMatch(/>\s*Queridinhos\s*</)
  })

  it('os dois skus dos banners existem no catálogo', () => {
    expect(findProductById(SKU_KIT_ESTETICISTA)).toBeDefined()
    expect(findProductById(SKU_EXOGENETIC)).toBeDefined()
    expect(findProductById(SKU_EXOGENETIC)?.exclusivoProfissional).toBe(false)
  })

  it('Últimos Lançamentos vem logo depois dos queridinhos, antes dos banners de linha', () => {
    const queridinhos = paginaFonte.indexOf('id="tulipia-queridinhos"')
    const lancamentos = paginaFonte.indexOf('id="tulipia-lancamentos"')
    const linhas = paginaFonte.indexOf('proskinBanner || dermoEsteticBanner')
    expect(queridinhos).toBeGreaterThan(-1)
    expect(lancamentos).toBeGreaterThan(queridinhos)
    expect(linhas).toBeGreaterThan(lancamentos)
    expect(paginaFonte.match(/>\s*Últimos Lançamentos\s*</g)).toHaveLength(1)
    expect(paginaFonte).toContain('banner-lancamento-exogenetic-pdrn-desktop')
    expect(paginaFonte).toMatch(/sku=\{SKU_BANNER_LANCAMENTO\}/)
  })

  it('os dois banners de produto usam <picture> (BannerImagem) com a proporção real, sem corte', () => {
    expect(paginaFonte.match(/<BannerProduto/g)).toHaveLength(2)
    expect(paginaFonte.match(/proporcao="aspect-\[1920\/802\]"/g)).toHaveLength(
      2,
    )
    expect(bannerProdutoFonte).toMatch(/<BannerImagem/)
    expect(bannerImagemFonte).toMatch(/<picture>/)
    // só a classe conta (o comentário do componente cita object-cover)
    expect(bannerImagemFonte).not.toMatch(/className=\{`[^`]*object-cover/)
  })

  it('o card do Exogenetic fica embaixo da arte, que já tem texto à direita', () => {
    expect(paginaFonte).toMatch(/cartao="abaixo"/)
    expect(bannerProdutoFonte).toMatch(/cartao = 'sobre'/)
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
