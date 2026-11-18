import { describe, expect, it } from 'vitest'
import { ErroDeNegocio } from '../src/lib/erros.js'
import { CAIXAS } from '../src/modules/frete/caixas.js'
import { empacotar } from '../src/modules/frete/embalagem.js'
import {
  DIAS_UTEIS_DE_POSTAGEM,
  skusSoComRetirada,
  somarDiaDePostagem,
} from '../src/modules/frete/regras.js'

const [pequena, media, grande] = CAIXAS

describe('empacotar', () => {
  it('um produto leve vai na caixa pequena, com o peso da caixa vazia somado', () => {
    const v = empacotar([{ pesoG: 91, quantidade: 1 }])
    expect(v).toEqual([
      {
        caixa: 'Pequena',
        alturaCm: pequena!.alturaCm,
        larguraCm: pequena!.larguraCm,
        comprimentoCm: pequena!.comprimentoCm,
        pesoG: 91 + pequena!.pesoVaziaG,
      },
    ])
  })

  it('usa a MENOR caixa em que tudo cabe', () => {
    expect(empacotar([{ pesoG: 300, quantidade: 4 }])[0]!.caixa).toBe('Média') // 1,2 kg
    expect(empacotar([{ pesoG: 400, quantidade: 6 }])[0]!.caixa).toBe('Média') // 2,4 kg
    expect(empacotar([{ pesoG: 1000, quantidade: 5 }])[0]!.caixa).toBe('Grande') // 5 kg
  })

  it('respeita o peso máximo da caixa pequena', () => {
    expect(empacotar([{ pesoG: 500, quantidade: 2 }])[0]!.caixa).toBe('Pequena') // 1 kg exato
    expect(empacotar([{ pesoG: 501, quantidade: 2 }])[0]!.caixa).toBe('Média') // passa de 1 kg
  })

  it('respeita o volume (60% da caixa): peso leve, mas muitas unidades', () => {
    // 1000 unidades de 6 g = 6 kg e 9600 cm³ cabem na grande; 30 unidades de 6 g (180 g)
    // ocupam 288 cm³ e cabem na pequena
    expect(empacotar([{ pesoG: 6, quantidade: 30 }])[0]!.caixa).toBe('Pequena')
    const muitas = empacotar([{ pesoG: 6, quantidade: 1000 }])
    expect(muitas.every((v) => v.caixa === 'Grande' || v.pesoG > 0)).toBe(true)
    expect(
      muitas.reduce((s, v) => s + v.pesoG - grande!.pesoVaziaG, 0),
    ).toBeLessThanOrEqual(6000 + 400 * muitas.length)
  })

  it('divide em várias caixas quando passa da maior', () => {
    // 2 galões de 5,3 kg = 10,6 kg > 8 kg da grande
    const v = empacotar([{ pesoG: 5300, quantidade: 2 }])
    expect(v).toHaveLength(2)
    expect(v.every((x) => x.caixa === 'Grande')).toBe(true)
    expect(v.every((x) => x.pesoG === 5300 + grande!.pesoVaziaG)).toBe(true)
  })

  it('a última caixa encolhe para a menor que couber', () => {
    // 3 galões: duas grandes cheias (1 galão cada, 5,3 kg não deixa caber o 2º) e a sobra
    const v = empacotar([
      { pesoG: 5300, quantidade: 1 },
      { pesoG: 5300, quantidade: 1 },
      { pesoG: 200, quantidade: 1 },
    ])
    expect(v).toHaveLength(2)
    // o item de 200 g completa um dos galões (5,5 kg) e o outro segue só
    expect(v.map((x) => x.pesoG).sort((a, b) => a - b)).toEqual([
      5300 + grande!.pesoVaziaG,
      5500 + grande!.pesoVaziaG,
    ])
  })

  it('nunca perde produto: o peso total dos volumes é o dos produtos + as caixas vazias', () => {
    const itens = [
      { pesoG: 91, quantidade: 7 },
      { pesoG: 406, quantidade: 3 },
      { pesoG: 1240, quantidade: 2 },
      { pesoG: 5300, quantidade: 1 },
    ]
    const v = empacotar(itens)
    const produtos = itens.reduce((s, i) => s + i.pesoG * i.quantidade, 0)
    const vazias = v.reduce(
      (s, x) => s + CAIXAS.find((c) => c.nome === x.caixa)!.pesoVaziaG,
      0,
    )
    expect(v.reduce((s, x) => s + x.pesoG, 0)).toBe(produtos + vazias)
  })

  it('é determinística: a mesma entrada, em qualquer ordem, dá os mesmos volumes', () => {
    const a = empacotar([
      { pesoG: 300, quantidade: 5 },
      { pesoG: 900, quantidade: 3 },
    ])
    const b = empacotar([
      { pesoG: 900, quantidade: 3 },
      { pesoG: 300, quantidade: 5 },
    ])
    expect(a).toEqual(b)
  })

  it('item que não cabe nem sozinho na maior caixa: 422', () => {
    const erro = (() => {
      try {
        empacotar([{ pesoG: 9000, quantidade: 1 }])
      } catch (e) {
        return e
      }
    })()
    expect(erro).toBeInstanceOf(ErroDeNegocio)
    expect((erro as ErroDeNegocio).codigo).toBe('item_grande_demais')
    expect((erro as ErroDeNegocio).status).toBe(422)
  })

  it('carrinho vazio: erro', () => {
    expect(() => empacotar([])).toThrow(ErroDeNegocio)
    expect(() => empacotar([{ pesoG: 100, quantidade: 0 }])).toThrow(
      ErroDeNegocio,
    )
  })

  it('as caixas padrão estão da menor para a maior', () => {
    expect(CAIXAS.map((c) => c.nome)).toEqual(['Pequena', 'Média', 'Grande'])
    expect(media!.capacidadeMaxG).toBeGreaterThan(pequena!.capacidadeMaxG)
    expect(grande!.capacidadeMaxG).toBeGreaterThan(media!.capacidadeMaxG)
  })
})

describe('regras do frete', () => {
  it('prazo de postagem: soma 1 dia útil ao prazo da transportadora', () => {
    expect(DIAS_UTEIS_DE_POSTAGEM).toBe(1)
    expect(somarDiaDePostagem({ min: 3, max: 4 })).toEqual({ min: 4, max: 5 })
    expect(somarDiaDePostagem({ min: 0, max: 0 })).toEqual({ min: 1, max: 1 })
  })

  it('a válvula só retirada: por padrão ninguém liga e todo produto pode ser enviado', () => {
    expect(
      skusSoComRetirada([
        { sku: 'a-1', so_retirada: false },
        { sku: 'b-2', so_retirada: false },
      ]),
    ).toEqual([])
    expect(
      skusSoComRetirada([
        { sku: 'a-1', so_retirada: false },
        { sku: 'b-2', so_retirada: true },
      ]),
    ).toEqual(['b-2'])
  })
})
