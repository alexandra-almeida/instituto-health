import { describe, expect, it } from 'vitest'
import { PROCEDIMENTOS } from '../data/procedimentos'
import homeFonte from '../pages/Home.tsx?raw'

// Endereços (URL e sitemap) dos procedimentos cujo nome já mudou de pontuação:
// o slug fica congelado, senão os links antigos quebram.
const SLUGS_CONGELADOS: Record<string, string> = {
  'Procedimento Estético Injetável de Microvasos (PEIM)':
    'procedimento-estetico-injetavel-de-microvasos-peim',
  'Clareamento de Manchas: Face, Mãos e Braços':
    'clareamento-de-manchas-face-maos-e-bracos',
  'Toxina Botulínica (Botox®)': 'toxina-botulinica-botox',
  'Alopecia Androgenética: Masculina e Feminina':
    'alopecia-androgenetica-masculina-e-feminina',
}

describe('procedimentos', () => {
  it.each(Object.entries(SLUGS_CONGELADOS))(
    'o slug de "%s" continua %s',
    (nome, slug) => {
      expect(PROCEDIMENTOS.find((p) => p.nome === nome)?.slug).toBe(slug)
    },
  )

  it('os slugs são únicos', () => {
    const slugs = PROCEDIMENTOS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('nenhum nome de procedimento tem travessão', () => {
    expect(PROCEDIMENTOS.filter((p) => /[—–]/.test(p.nome))).toEqual([])
  })

  it('a vitrine da Home só usa nomes que existem no catálogo', () => {
    const nomes = [...homeFonte.matchAll(/\{ nome: '([^']+)', Icon:/g)].map(
      (m) => m[1],
    )
    expect(nomes.length).toBeGreaterThan(0)
    for (const nome of nomes) {
      expect(PROCEDIMENTOS.some((p) => p.nome === nome)).toBe(true)
    }
  })
})
