import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lerCatalogo } from '../../database/seeds/lib/catalogo.js'

// Confere o catálogo REAL do site (frontend/src/data/tulipia-produtos.json) e
// as proteções da carga, sem precisar do banco. Se alguém editar o catálogo e
// quebrar uma regra, estes testes falham antes de a carga ser rodada.
const RAIZ = new URL('../../', import.meta.url)
const json: unknown = JSON.parse(
  readFileSync(
    new URL('frontend/src/data/tulipia-produtos.json', RAIZ),
    'utf8',
  ),
)

describe('catálogo do site (tulipia-produtos.json)', () => {
  const { produtos, problemas, arredondados } = lerCatalogo(json)

  it('não tem nenhum problema (sku no padrão e único, nome, preço, regra de exclusivo)', () => {
    expect(problemas).toEqual([])
  })

  it('tem produtos', () => {
    expect(produtos.length).toBeGreaterThan(100)
  })

  it('nenhum preço precisa ser arredondado: o JSON já guarda valores exatos em reais', () => {
    expect(arredondados).toEqual([])
  })

  it('todo exclusivo de profissional está sem preço público', () => {
    const exclusivos = produtos.filter((p) => p.exclusivo_profissional)
    expect(exclusivos.length).toBeGreaterThan(0)
    expect(exclusivos.every((p) => p.preco === null)).toBe(true)
  })

  it('todo produto NÃO exclusivo tem preço público (senão não poderia ser vendido)', () => {
    const semPreco = produtos
      .filter((p) => !p.exclusivo_profissional && p.preco === null)
      .map((p) => p.sku)
    expect(semPreco).toEqual([])
  })

  it('o preço de profissional nunca está no JSON do site', () => {
    const texto = JSON.stringify(json)
    expect(texto).not.toMatch(
      /profission[a-z]*Preco|precoProfissional|preco_profissional/i,
    )
    const campos = new Set(
      (json as { produtos: Array<Record<string, unknown>> }).produtos.flatMap(
        (p) => Object.keys(p),
      ),
    )
    expect([...campos].sort()).toEqual(
      [
        'categoria',
        'cuidado',
        'destaque',
        'exclusivoProfissional',
        'nome',
        'preco',
        'sku',
        'tamanho',
      ].sort(),
    )
  })
})

describe('proteção dos dados confidenciais da carga', () => {
  it('o .gitignore ignora database/seeds/dados/ (planilha de preço profissional)', () => {
    const gitignore = readFileSync(new URL('.gitignore', RAIZ), 'utf8')
    const linhas = gitignore.split(/\r?\n/).map((l) => l.trim())
    expect(linhas).toContain('database/seeds/dados/')
  })
})
