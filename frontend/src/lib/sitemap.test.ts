import { describe, expect, it } from 'vitest'
import appFonte from '../App.tsx?raw'
import { PROCEDIMENTOS, findProcedimentoBySlug } from '../data/procedimentos'
import { ALL_PRODUCTS, findProductById } from '../data/tulipiaProducts'
import { SITE_URL, caminhosPublicos, montarSitemap } from './sitemap'

// Usa os dados REAIS do site: se um procedimento ou produto entrar, sair ou
// mudar de slug, o sitemap acompanha e estes testes continuam valendo.
const caminhos = caminhosPublicos({
  procedimentos: PROCEDIMENTOS,
  produtos: ALL_PRODUCTS,
})

const PAGINAS_FIXAS = [
  '/',
  '/procedimentos',
  '/tulipia',
  '/produtos-hospitalares',
  '/teleconsulta',
  '/cursos',
  '/sobre',
  '/politica-de-privacidade',
]

const PAGINAS_PRIVADAS = [
  '/carrinho',
  '/checkout',
  '/pedido-confirmado',
  '/cadastro',
  '/login',
  '/minha-conta',
  '/redefinir-senha',
]

describe('caminhosPublicos', () => {
  it('tem as 8 páginas fixas, um caminho por procedimento e um por produto', () => {
    expect(caminhos).toHaveLength(
      PAGINAS_FIXAS.length + PROCEDIMENTOS.length + ALL_PRODUCTS.length,
    )
    for (const pagina of PAGINAS_FIXAS) expect(caminhos).toContain(pagina)
  })

  it('não repete nenhum caminho', () => {
    expect(new Set(caminhos).size).toBe(caminhos.length)
  })

  it('nenhuma página de conta ou de compra entra', () => {
    for (const privada of PAGINAS_PRIVADAS) {
      expect(
        caminhos.some((c) => c === privada || c.startsWith(privada + '/')),
      ).toBe(false)
    }
  })

  it('todo caminho começa com uma barra, sem barra dupla e sem espaço', () => {
    for (const caminho of caminhos) {
      expect(caminho.startsWith('/')).toBe(true)
      expect(caminho).not.toContain('//')
      expect(caminho).not.toMatch(/\s/)
    }
  })

  it('cada procedimento aponta para um slug que a rota realmente abre', () => {
    const prefixo = '/procedimentos/'
    const slugs = caminhos
      .filter((c) => c.startsWith(prefixo))
      .map((c) => decodeURIComponent(c.slice(prefixo.length)))
    expect(slugs).toHaveLength(PROCEDIMENTOS.length)
    for (const slug of slugs) expect(findProcedimentoBySlug(slug)).toBeDefined()
  })

  it('cada produto aponta para um sku que a rota realmente abre (inclusive os exclusivos de profissional)', () => {
    const prefixo = '/tulipia/produto/'
    const ids = caminhos
      .filter((c) => c.startsWith(prefixo))
      .map((c) => decodeURIComponent(c.slice(prefixo.length)))
    expect(ids).toHaveLength(ALL_PRODUCTS.length)
    for (const id of ids) expect(findProductById(id)).toBeDefined()
    expect(ALL_PRODUCTS.some((p) => p.exclusivoProfissional)).toBe(true)
  })

  it('as páginas fixas e os dois padrões com :slug existem no App.tsx', () => {
    for (const pagina of PAGINAS_FIXAS) {
      expect(appFonte).toContain(`path="${pagina}"`)
    }
    expect(appFonte).toContain('path="/procedimentos/:slug"')
    expect(appFonte).toContain('path="/tulipia/produto/:slug"')
  })
})

describe('montarSitemap', () => {
  it('gera o XML do sitemap com o endereço completo de cada página', () => {
    const xml = montarSitemap(['/', '/sobre'])

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`)
    expect(xml).toContain(`<loc>${SITE_URL}/sobre</loc>`)
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  it('o domínio é o próprio, sem o endereço antigo da Vercel', () => {
    const xml = montarSitemap(caminhos)

    expect(SITE_URL).toBe('https://healthinstituto.com.br')
    expect(xml).not.toContain('vercel.app')
    expect(xml.match(/<loc>/g)).toHaveLength(caminhos.length)
  })

  it('escapa caracteres especiais do XML', () => {
    const xml = montarSitemap(['/a?x=1&y=2'])

    expect(xml).toContain(
      '<loc>https://healthinstituto.com.br/a?x=1&amp;y=2</loc>',
    )
  })
})
