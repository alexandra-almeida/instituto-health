import { describe, expect, it } from 'vitest'
import footerFonte from '../components/Footer.tsx?raw'
import footerSimplesFonte from '../components/FooterSimple.tsx?raw'
import iconesFonte from '../components/icons.tsx?raw'
import indexFonte from '../../index.html?raw'
import contatoFonte from '../data/contact.ts?raw'

describe('redes sociais do site', () => {
  it('o Facebook não aparece nos rodapés, nos ícones, nos contatos nem no index.html', () => {
    for (const fonte of [
      footerFonte,
      footerSimplesFonte,
      iconesFonte,
      indexFonte,
      contatoFonte,
    ]) {
      expect(fonte).not.toMatch(/facebook/i)
    }
  })

  it('os dois rodapés continuam com Instagram e WhatsApp', () => {
    for (const fonte of [footerFonte, footerSimplesFonte]) {
      expect(fonte).toContain('aria-label="Instagram"')
      expect(fonte).toContain('aria-label="WhatsApp"')
    }
  })
})
