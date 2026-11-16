import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AtalhosDaPagina from '../components/tulipia/AtalhosDaPagina'
import atalhosFonte from '../components/tulipia/AtalhosDaPagina.tsx?raw'
import paginaFonte from '../pages/Tulipia.tsx?raw'

const naoFaz = () => {}

function desenhar(extra: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    createElement(AtalhosDaPagina, {
      publico: 'homecare',
      onPublico: naoFaz,
      onQueridinhos: naoFaz,
      onLancamentos: naoFaz,
      ...extra,
    }),
  )
}

function rotulos(html: string) {
  return [...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map((m) => m[1])
}

describe('linha de atalhos da /tulipia', () => {
  it('tem os 5 atalhos, na ordem combinada, quando há promoção', () => {
    expect(rotulos(desenhar({ onOfertas: naoFaz }))).toEqual([
      'Profissional',
      'Home Care',
      'Queridinhos',
      'Lançamentos',
      'Ofertas',
    ])
  })

  it('sem promoção no ar, "Ofertas" some junto (ficam 4)', () => {
    expect(rotulos(desenhar())).toEqual([
      'Profissional',
      'Home Care',
      'Queridinhos',
      'Lançamentos',
    ])
  })

  it('marca o modo atual (aria-pressed) e troca com o estado recebido', () => {
    const homeCare = desenhar({ publico: 'homecare' })
    expect(homeCare).toMatch(/aria-pressed="true"[^>]*>Home Care/)
    expect(homeCare).toMatch(/aria-pressed="false"[^>]*>Profissional/)
    const profissional = desenhar({ publico: 'profissional' })
    expect(profissional).toMatch(/aria-pressed="true"[^>]*>Profissional/)
  })

  it('no celular rola na horizontal e os botões têm 40px ou mais', () => {
    expect(atalhosFonte).toMatch(/overflow-x-auto/)
    expect(atalhosFonte).toMatch(/min-h-10/)
    expect(atalhosFonte).toMatch(/shrink-0/)
    expect(atalhosFonte).toMatch(/whitespace-nowrap/)
  })

  it('a página usa o mesmo estado do seletor e só passa Ofertas com promoção', () => {
    expect(paginaFonte).toMatch(/publico=\{audience\}/)
    expect(paginaFonte).toMatch(/onPublico=\{setAudience\}/)
    expect(paginaFonte).toMatch(
      /onOfertas=\{promocao \? handlePromoClick : undefined\}/,
    )
    // o seletor que já existia continua na página
    expect(paginaFonte).toMatch(/aria-pressed=\{audience === option\}/)
  })

  it('os atalhos rolam até as seções que existem na página', () => {
    expect(paginaFonte).toContain("rolarAteSecao('tulipia-queridinhos')")
    expect(paginaFonte).toContain("rolarAteSecao('tulipia-lancamentos')")
    expect(paginaFonte).toContain('id="tulipia-queridinhos"')
    expect(paginaFonte).toContain('id="tulipia-lancamentos"')
  })

  it('ficam no topo, antes do banner da promoção', () => {
    expect(paginaFonte.indexOf('<AtalhosDaPagina')).toBeLessThan(
      paginaFonte.indexOf('<PromoHero'),
    )
  })
})
