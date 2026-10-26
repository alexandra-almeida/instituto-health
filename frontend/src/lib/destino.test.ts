import { describe, expect, it } from 'vitest'
import { destinoDoLogin, destinoSeguro } from './destino'

describe('destinoSeguro', () => {
  it.each([
    '/',
    '/carrinho',
    '/tulipia',
    '/tulipia/produto/hidrasol-protetor-solar-fluid-fps-60-50ml-147',
    '/checkout?etapa=2',
    '/tulipia#listagem',
  ])('aceita o caminho interno %s', (destino) => {
    expect(destinoSeguro(destino)).toBe(destino)
  })

  it.each([
    ['site externo com protocolo', 'https://site-falso.example'],
    ['http', 'http://site-falso.example/login'],
    ['protocolo relativo', '//site-falso.example'],
    ['protocolo relativo com caminho', '//site-falso.example/carrinho'],
    ['://  no meio do caminho', '/redir?url=https://site-falso.example'],
    ['sem barra inicial', 'carrinho'],
    ['só o domínio', 'site-falso.example'],
    ['barra invertida', '/\\site-falso.example'],
    ['barra e barra invertida', '/\\/site-falso.example'],
    ['tabulação escondendo as duas barras', '/\t/site-falso.example'],
    ['quebra de linha', '/\n/site-falso.example'],
    ['caractere de controle', '/carrinho\u0000'],
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['vazio', ''],
  ])('recusa %s e volta para "/"', (_nome, destino) => {
    expect(destinoSeguro(destino)).toBe('/')
  })

  it.each([undefined, null, 42, {}, ['/carrinho'], true])(
    'valor que não é texto (%j) volta para "/"',
    (valor) => {
      expect(destinoSeguro(valor)).toBe('/')
    },
  )

  it.each([
    '/login',
    '/login?destino=/carrinho',
    '/cadastro',
    '/redefinir-senha',
    '/login#x',
  ])('não volta para a página de acesso %s', (destino) => {
    expect(destinoSeguro(destino)).toBe('/')
  })

  it('não confunde páginas parecidas com as de acesso', () => {
    expect(destinoSeguro('/loginx')).toBe('/loginx')
    expect(destinoSeguro('/minha/login')).toBe('/minha/login')
  })
})

describe('destinoDoLogin', () => {
  it('sem destino vai para Minha Conta', () => {
    expect(destinoDoLogin(undefined)).toBe('/minha-conta')
    expect(destinoDoLogin(null)).toBe('/minha-conta')
  })

  it('destino interno válido é respeitado', () => {
    expect(destinoDoLogin('/carrinho')).toBe('/carrinho')
    expect(destinoDoLogin('/minha-conta')).toBe('/minha-conta')
  })

  it.each([
    'https://site-falso.example',
    '//site-falso.example',
    '/\\site-falso.example',
    '/login',
    '',
    42,
  ])(
    'destino informado mas inválido (%j) vai para "/", não para Minha Conta',
    (destino) => {
      expect(destinoDoLogin(destino)).toBe('/')
    },
  )
})
