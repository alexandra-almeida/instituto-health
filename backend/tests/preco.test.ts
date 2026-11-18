import { describe, expect, it } from 'vitest'
import {
  descontoDoProfissionalEmCentavos,
  ehDescartavel,
  emCentavos,
  emReais,
  precoCheioEmCentavos,
  precoDoProfissionalEmCentavos,
} from '../src/lib/preco.js'

describe('precoDoProfissionalEmCentavos (30% sobre o preço cheio)', () => {
  it('Niacine+: cheio 149,00 fica 104,30 (os 30% coincidem com a promoção)', () => {
    expect(precoDoProfissionalEmCentavos('niacine-7', 14900)).toBe(10430)
  })

  it('Resilience: cheio 139,00 fica 97,30 (e não 30% sobre o promocional 125,10)', () => {
    const cheio = emCentavos(139)
    expect(precoDoProfissionalEmCentavos('resilience-19', cheio)).toBe(9730)
    // 30% em cima do preço promocional daria outro valor, que nunca é usado
    expect(
      precoDoProfissionalEmCentavos('resilience-19', emCentavos(125.1)),
    ).toBe(8757)
  })

  it('arredonda o desconto no centavo, com o meio centavo para cima', () => {
    // 15,05 * 30% = 4,515 -> desconto de 4,52 (452 centavos)
    expect(descontoDoProfissionalEmCentavos('a-1', 1505)).toBe(452)
    expect(precoDoProfissionalEmCentavos('a-1', 1505)).toBe(1053)
    // 10,01 * 30% = 3,003 -> 3,00
    expect(descontoDoProfissionalEmCentavos('a-1', 1001)).toBe(300)
    // 0,01 * 30% = 0,003 -> 0
    expect(descontoDoProfissionalEmCentavos('a-1', 1)).toBe(0)
  })

  it('descartáveis (desc-) não têm desconto, nem para profissional', () => {
    expect(ehDescartavel('desc-luva-de-vinil-sem-po-p-0')).toBe(true)
    expect(ehDescartavel('niacine-7')).toBe(false)
    expect(precoDoProfissionalEmCentavos('desc-cloro-gel-5-l-32', 3679)).toBe(
      3679,
    )
    expect(
      descontoDoProfissionalEmCentavos('desc-cloro-gel-5-l-32', 3679),
    ).toBe(0)
  })

  it('o desconto nunca passa de 30% e o preço nunca fica negativo nem maior que o cheio', () => {
    for (let cheio = 1; cheio <= 5000; cheio += 7) {
      const preco = precoDoProfissionalEmCentavos('x-1', cheio)
      expect(preco).toBeGreaterThanOrEqual(0)
      expect(preco).toBeLessThanOrEqual(cheio)
      expect(cheio - preco).toBeLessThanOrEqual(Math.ceil(cheio * 0.3))
    }
  })

  it('trabalha só com inteiros: nenhum resultado tem fração de centavo', () => {
    for (const cheio of [3590, 7110, 12990, 64600, 19999]) {
      expect(
        Number.isInteger(precoDoProfissionalEmCentavos('x-1', cheio)),
      ).toBe(true)
    }
  })
})

describe('conversões de dinheiro', () => {
  it('numeric do Postgres (número ou texto) vira centavos exatos', () => {
    expect(emCentavos('129.90')).toBe(12990)
    expect(emCentavos(129.9)).toBe(12990)
    expect(emCentavos('71.10')).toBe(7110)
    expect(emCentavos(71.1)).toBe(7110)
    expect(emCentavos(0.07)).toBe(7)
    expect(emReais(10430)).toBe(104.3)
  })
})

describe('precoCheioEmCentavos', () => {
  it('usa o preço público e, nos exclusivos, o preço cheio', () => {
    expect(precoCheioEmCentavos({ preco: '149.00', preco_cheio: null })).toBe(
      14900,
    )
    expect(precoCheioEmCentavos({ preco: null, preco_cheio: 139 })).toBe(13900)
  })

  it('sem nenhum dos dois, não há preço (o produto não pode ser vendido)', () => {
    expect(precoCheioEmCentavos({ preco: null, preco_cheio: null })).toBeNull()
  })
})
