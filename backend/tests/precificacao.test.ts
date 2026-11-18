import { describe, expect, it } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'
import {
  juntarItensRepetidos,
  precificarPedido,
  type ItemPedido,
} from '../src/modules/pedidos/precificacao.js'
import type { ProdutoParaPedido } from '../src/repositories/produtos.repository.js'

const base = {
  tamanho: '50ml',
  ativo: true,
  exclusivo_profissional: false,
  preco_cheio: null,
} as const

const NIACINE: ProdutoParaPedido = {
  ...base,
  sku: 'niacine-7',
  nome: 'Niacine+ Sérum',
  preco: '149.00',
}
const RESILIENCE: ProdutoParaPedido = {
  ...base,
  sku: 'resilience-19',
  nome: 'Resilience Sérum',
  preco: 139,
}
const EXCLUSIVO: ProdutoParaPedido = {
  ...base,
  sku: 'exclusivo-9',
  nome: 'Máscara Exclusiva',
  preco: null,
  preco_cheio: '200.00',
  exclusivo_profissional: true,
}
const EXCLUSIVO_SEM_PRECO: ProdutoParaPedido = {
  ...EXCLUSIVO,
  sku: 'exclusivo-10',
  nome: 'Exclusivo Sem Preço',
  preco_cheio: null,
}
const DESCARTAVEL: ProdutoParaPedido = {
  ...base,
  sku: 'desc-cloro-gel-5-l-32',
  nome: 'Cloro Gel 5 L',
  preco: '36.79',
}
const INATIVO: ProdutoParaPedido = {
  ...NIACINE,
  sku: 'inativo-1',
  nome: 'Produto Inativo',
  ativo: false,
}
const CATALOGO = [
  NIACINE,
  RESILIENCE,
  EXCLUSIVO,
  EXCLUSIVO_SEM_PRECO,
  DESCARTAVEL,
  INATIVO,
]

const item = (sku: string, quantidade = 1, variacao: string | null = null) => ({
  sku,
  quantidade,
  variacao,
})

function recusa(chamada: () => unknown) {
  try {
    chamada()
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroDeNegocio)
    return erro as ErroDeNegocio
  }
  throw new Error('deveria ter recusado')
}

describe('precificarPedido: cliente comum (preço público)', () => {
  it('soma preço público x quantidade, em centavos', () => {
    const r = precificarPedido(
      [item('niacine-7', 2), item('resilience-19', 1)],
      CATALOGO,
      false,
    )
    expect(r.tabelaDePrecos).toBe('publico')
    expect(r.itens.map((i) => i.precoUnitarioEmCentavos)).toEqual([
      14900, 13900,
    ])
    expect(r.subtotalEmCentavos).toBe(2 * 14900 + 13900)
  })

  it('exclusivo de profissional é recusado', () => {
    const erro = recusa(() =>
      precificarPedido([item('exclusivo-9')], CATALOGO, false),
    )
    expect(erro.codigo).toBe('produto_exclusivo')
    expect(erro.status).toBe(422)
  })

  it('descartável sai ao preço único', () => {
    const r = precificarPedido(
      [item('desc-cloro-gel-5-l-32', 3)],
      CATALOGO,
      false,
    )
    expect(r.subtotalEmCentavos).toBe(3 * 3679)
  })
})

describe('precificarPedido: profissional aprovado (30% sobre o preço cheio)', () => {
  it('Niacine+ 149,00 fica 104,30 e Resilience 139,00 fica 97,30 (os exemplos da Juliana)', () => {
    const r = precificarPedido(
      [item('niacine-7'), item('resilience-19')],
      CATALOGO,
      true,
    )
    expect(r.tabelaDePrecos).toBe('profissional')
    expect(r.itens.map((i) => i.precoUnitarioEmCentavos)).toEqual([10430, 9730])
    expect(r.subtotalEmCentavos).toBe(10430 + 9730)
  })

  it('pode comprar exclusivo, com 30% sobre o preço cheio', () => {
    const r = precificarPedido([item('exclusivo-9', 2)], CATALOGO, true)
    expect(r.itens[0]?.precoUnitarioEmCentavos).toBe(14000)
    expect(r.subtotalEmCentavos).toBe(28000)
  })

  it('descartável não tem desconto, nem para profissional', () => {
    const r = precificarPedido([item('desc-cloro-gel-5-l-32')], CATALOGO, true)
    expect(r.itens[0]?.precoUnitarioEmCentavos).toBe(3679)
  })

  it('pedido misto: desconto só nos itens Tulípia', () => {
    const r = precificarPedido(
      [item('niacine-7'), item('desc-cloro-gel-5-l-32', 2)],
      CATALOGO,
      true,
    )
    expect(r.subtotalEmCentavos).toBe(10430 + 2 * 3679)
  })
})

describe('precificarPedido: recusas', () => {
  it.each([
    ['sku que não existe', 'nao-existe-1', 'produto_indisponivel'],
    ['produto inativo', 'inativo-1', 'produto_indisponivel'],
  ])('%s', (_nome, sku, codigo) => {
    expect(
      recusa(() => precificarPedido([item(sku)], CATALOGO, true)).codigo,
    ).toBe(codigo)
  })

  it('exclusivo SEM preço cheio nunca é vendido, nem para profissional (sem outro valor)', () => {
    const erro = recusa(() =>
      precificarPedido([item('exclusivo-10')], CATALOGO, true),
    )
    expect(erro.codigo).toBe('produto_sem_preco')
  })

  it.each([0, -1, 100, 1.5])('quantidade %s é inválida', (quantidade) => {
    expect(
      recusa(() =>
        precificarPedido([item('niacine-7', quantidade)], CATALOGO, false),
      ).codigo,
    ).toBe('quantidade_invalida')
  })

  it('uma linha com problema recusa o pedido todo', () => {
    expect(() =>
      precificarPedido([item('niacine-7'), item('inativo-1')], CATALOGO, false),
    ).toThrow(ErroDeNegocio)
  })

  it('a mensagem nunca traz valor de preço', () => {
    const erro = recusa(() =>
      precificarPedido([item('exclusivo-10')], CATALOGO, true),
    )
    expect(erro.message).not.toMatch(/\d{2,}/)
  })
})

describe('juntarItensRepetidos', () => {
  it('soma o mesmo sku com a mesma variação e mantém variações diferentes', () => {
    const itens: ItemPedido[] = [
      item('a-1', 2),
      item('a-1', 3),
      item('a-1', 1, 'Cereja'),
      item('b-2', 1),
    ]
    expect(juntarItensRepetidos(itens)).toEqual([
      item('a-1', 5),
      item('a-1', 1, 'Cereja'),
      item('b-2', 1),
    ])
  })

  it('não altera a lista recebida', () => {
    const itens = [item('a-1', 2), item('a-1', 3)]
    juntarItensRepetidos(itens)
    expect(itens[0]?.quantidade).toBe(2)
  })

  it('a quantidade somada acima de 99 é recusada na precificação', () => {
    const somado = juntarItensRepetidos([
      item('niacine-7', 60),
      item('niacine-7', 60),
    ])
    expect(recusa(() => precificarPedido(somado, CATALOGO, false)).codigo).toBe(
      'quantidade_invalida',
    )
  })
})
