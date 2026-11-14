import { describe, expect, it } from 'vitest'
import appFonte from '../App.tsx?raw'
import headerFonte from '../components/Header.tsx?raw'
import robotsFonte from '../../public/robots.txt?raw'
import {
  ABAS,
  contagemDaSecao,
  dataOuTraco,
  faixaDaPagina,
  MOTIVO_MAXIMO,
  motivoDaRecusa,
  podeVerCadastros,
  POR_PAGINA,
  rotuloDaAba,
  rotuloDaAvaliacao,
} from './admin'

describe('podeVerCadastros: só admin enxerga a tela e o link', () => {
  it.each([
    [{ ehAdmin: true }, true],
    [{ ehAdmin: false }, false],
    [{}, false],
    [null, false],
    [undefined, false],
    // Só o booleano true vale: nada de texto ou número "verdadeiro"
    [{ ehAdmin: 'true' as unknown as boolean }, false],
    [{ ehAdmin: 1 as unknown as boolean }, false],
  ])('%j: %s', (perfil, esperado) => {
    expect(podeVerCadastros(perfil)).toBe(esperado)
  })
})

describe('contagens e rótulos', () => {
  it('contagem da seção, no singular e no plural', () => {
    expect(contagemDaSecao('Home Care', 12)).toBe('Home Care: 12 cadastros')
    expect(contagemDaSecao('Home Care', 1)).toBe('Home Care: 1 cadastro')
    expect(contagemDaSecao('Profissionais', 0)).toBe(
      'Profissionais: 0 cadastros',
    )
  })

  it('abas na ordem pedida, Pendentes primeiro', () => {
    expect(ABAS.map((a) => a.rotulo)).toEqual([
      'Pendentes',
      'Aprovados',
      'Recusados',
    ])
    expect(ABAS[0]?.status).toBe('pendente')
  })

  it('rótulo da aba leva a contagem quando ela é conhecida', () => {
    expect(rotuloDaAba('Pendentes', 3)).toBe('Pendentes (3)')
    expect(rotuloDaAba('Pendentes', 0)).toBe('Pendentes (0)')
    expect(rotuloDaAba('Pendentes', undefined)).toBe('Pendentes')
  })

  it('a paginação é de 20 em 20', () => {
    expect(POR_PAGINA).toBe(20)
    expect(faixaDaPagina(1, 20, 41)).toBe('1 a 20 de 41')
    expect(faixaDaPagina(3, 20, 41)).toBe('41 a 41 de 41')
    expect(faixaDaPagina(1, 20, 0)).toBe('Nenhum cadastro')
  })

  it('avaliação: quem, quando e o que foi', () => {
    expect(
      rotuloDaAvaliacao({
        decisao: 'aprovado',
        motivo: null,
        em: '2026-11-14T15:00:00Z',
        por: 'Bia',
      }),
    ).toBe('Aprovado por Bia em 14/11/2026')
    expect(
      rotuloDaAvaliacao({
        decisao: 'recusado',
        motivo: 'x',
        em: '2026-11-14T15:00:00Z',
        por: null,
      }),
    ).toBe('Recusado em 14/11/2026')
  })

  it('data inválida ou ausente vira texto, nunca "Invalid Date"', () => {
    expect(dataOuTraco(null)).toBe('Sem data')
    expect(dataOuTraco('lixo')).toBe('Sem data')
    expect(dataOuTraco('2026-11-14T15:00:00Z')).toBe('14/11/2026')
  })
})

describe('motivoDaRecusa: mesma regra do backend', () => {
  it.each([
    ['', false],
    ['   ', false],
    ['ab', false],
    ['  ab  ', false],
    ['abc', true],
    ['  Comprovante ilegível  ', true],
    ['x'.repeat(MOTIVO_MAXIMO), true],
    ['x'.repeat(MOTIVO_MAXIMO + 1), false],
  ])('%j válido? %s', (texto, valido) => {
    expect(motivoDaRecusa(texto).valido).toBe(valido)
  })

  it('devolve o texto sem os espaços das pontas', () => {
    expect(motivoDaRecusa('  Documento vencido ').limpo).toBe(
      'Documento vencido',
    )
  })
})

describe('rota /admin/cadastros', () => {
  it('só abre dentro da guarda de admin', () => {
    expect(appFonte).toMatch(
      /path="\/admin\/cadastros"[\s\S]{0,120}<RotaDeAdmin>\s*<AdminCadastros \/>\s*<\/RotaDeAdmin>/,
    )
  })

  it('fica fora dos buscadores (robots.txt)', () => {
    expect(robotsFonte).toMatch(/^Disallow: \/admin$/m)
  })

  it('o link "Cadastros" do header só entra para admin', () => {
    expect(headerFonte).toMatch(/podeVerCadastros\(perfil\)\s*\?/)
  })
})
