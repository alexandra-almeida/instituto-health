import { describe, expect, it } from 'vitest'
import {
  CABECALHO_DA_PLANILHA,
  compararLogistica,
  converterPesoEmGramas,
  desejarLogistica,
  gerarPlanilha,
  ITENS_DOS_KITS,
  lerPlanilhaDeMedidas,
  pesoEstimado,
  pesoEstimadoDaTulipia,
  pesoEstimadoDoDescartavel,
  SKUS_LIQUIDOS,
  type LogisticaNoBanco,
} from '../../database/seeds/lib/logistica.js'
import { CAIXAS } from '../src/modules/frete/caixas.js'

describe('pesoEstimadoDaTulipia', () => {
  it.each([
    ['50ml', 91],
    ['30ml', 69],
    ['300ml', 406],
    ['150g', 218],
    ['1kg', 1240],
    ['500g', 660],
  ])('%s fica em %i g', (tamanho, esperado) => {
    expect(pesoEstimadoDaTulipia('x-1', tamanho)).toBe(esperado)
  })

  it('ampolas: N x (ml x 1,1 + 6 g) + 60 g da caixa, nos dois formatos de texto', () => {
    expect(pesoEstimadoDaTulipia('x-1', '5 ampolas de 4ml')).toBe(112)
    expect(pesoEstimadoDaTulipia('x-1', '3 ampolas de 5ml')).toBe(95)
    expect(pesoEstimadoDaTulipia('x-1', '4ml - 5 ampolas')).toBe(112)
  })

  it('sachês, unidade e "cada"', () => {
    expect(pesoEstimadoDaTulipia('x-1', '3 sachês')).toBe(90)
    expect(pesoEstimadoDaTulipia('x-1', '1 un')).toBe(40)
    expect(pesoEstimadoDaTulipia('x-1', '30g cada')).toBe(120)
  })

  it('kit: 230 g por item, pelo número de itens do kit (ou 3 se não souber)', () => {
    expect(
      pesoEstimadoDaTulipia(
        'kit-esteticista-para-limpeza-de-pele-kit-63',
        'kit',
      ),
    ).toBe(6 * 230)
    expect(pesoEstimadoDaTulipia('kit-desconhecido-999', 'kit')).toBe(3 * 230)
  })

  it('tamanho que não reconhece vira 200 g (a cotação nunca trava)', () => {
    expect(pesoEstimadoDaTulipia('x-1', 'tamanho estranho')).toBe(200)
  })

  it('todos os kits mapeados têm de 2 a 6 itens', () => {
    for (const itens of Object.values(ITENS_DOS_KITS)) {
      expect(itens).toBeGreaterThanOrEqual(2)
      expect(itens).toBeLessThanOrEqual(6)
    }
  })
})

describe('pesoEstimadoDoDescartavel', () => {
  it.each([
    ['Água Sanitária 5 L - Gopabo', 'Galão 5 L', 5300],
    ['Desinfetante 2 L - Candura', 'Frasco 2 L', 2160],
    ['Água Sanitária 1 L - Candura', 'Frasco 1 L', 1120],
    ['Limpador Perfumado 120 ml - Coala', 'Frasco 120 ml', 185],
    ['Sabão em Pó Primavera 800 g - Tixan', 'Caixa 800 g', 840],
    ['Saco Plástico Virgem 35x45', 'Pacote 1 kg', 1050],
    ['Bobina Picotada Reforçada 25x35 - Lider', 'Bobina aprox. 1,3 kg', 1400],
    ['Papel Toalha Interfolha 2 Dobras', 'Pacote com 1000 folhas', 2200],
    ['Papel Higiênico Folha Dupla 30 m', 'Pacote com 16 rolos', 1120],
    ['Luva de Vinil Sem Pó - Vabene', 'P - Caixa com 100', 450],
    ['Máscara de TNT Tripla Branca com Elástico', 'Pacote com 50', 250],
    ['Saco de Lixo 30 L Espessura 0,04', '', 400],
    ['Lençol Hospitalar 50x50 - Classpel', '', 400],
  ])('%s (%s) fica em %i g', (nome, tamanho, esperado) => {
    expect(pesoEstimadoDoDescartavel(nome, tamanho)).toBe(esperado)
  })

  it('sem nenhuma pista: 500 g', () => {
    expect(pesoEstimadoDoDescartavel('Produto qualquer', '')).toBe(500)
  })
})

describe('pesoEstimado', () => {
  it('descartável (prefixo desc-) usa a regra dos descartáveis; o resto, a da Tulípia', () => {
    expect(
      pesoEstimado({
        sku: 'desc-cloro-gel-5-l-32',
        nome: 'Cloro Gel 5 L',
        tamanho: 'Galão 5 L',
      }),
    ).toBe(5300)
    expect(
      pesoEstimado({ sku: 'a-b-50ml-1', nome: 'A - B', tamanho: '50ml' }),
    ).toBe(91)
  })

  it('fica sempre entre 1 g e 30 kg', () => {
    expect(pesoEstimado({ sku: 'a-1', nome: 'x', tamanho: '99kg' })).toBe(30000)
  })
})

describe('líquidos', () => {
  it('são 13 skus, todos descartáveis, sem repetir', () => {
    expect(SKUS_LIQUIDOS.size).toBe(13)
    for (const sku of SKUS_LIQUIDOS) expect(sku.startsWith('desc-')).toBe(true)
  })

  it('incluem o sabonete de 500 ml e o limpador de 120 ml; sabão em pó e luvas ficam fora', () => {
    expect(
      SKUS_LIQUIDOS.has(
        'desc-sabonete-liquido-500-ml-com-pump-ameixa-dourada-31',
      ),
    ).toBe(true)
    expect(SKUS_LIQUIDOS.has('desc-limpador-perfumado-120-ml-35')).toBe(true)
    expect(SKUS_LIQUIDOS.has('desc-sabao-em-po-multiacao-800-g-36')).toBe(false)
    expect(SKUS_LIQUIDOS.has('desc-luva-de-vinil-sem-po-p-0')).toBe(false)
  })
})

describe('planilha da Bia', () => {
  const produtos = [
    {
      sku: 'desc-cloro-gel-5-l-32',
      nome: 'Cloro Gel 5 L',
      tamanho: 'Galão 5 L',
    },
    { sku: 'a-b-50ml-1', nome: 'A - B; com ponto e vírgula', tamanho: '50ml' },
  ]

  it('gera caixas e produtos, com a coluna liquido e sem ";" dentro dos campos', () => {
    const texto = gerarPlanilha(produtos, [...CAIXAS])
    const linhas = texto.trim().split('\r\n')
    expect(linhas[0]).toBe(CABECALHO_DA_PLANILHA)
    expect(linhas).toHaveLength(1 + CAIXAS.length + produtos.length)
    const colunas = CABECALHO_DA_PLANILHA.split(';').length
    for (const l of linhas) expect(l.split(';')).toHaveLength(colunas)
    expect(texto).toMatch(
      /produto;desc-cloro-gel-5-l-32;Cloro Gel 5 L;Galão 5 L;sim;5300;/,
    )
    expect(texto).toMatch(/caixa;Pequena;Caixa Pequena;;;100;;20;15;10;1000;/)
  })

  const SKUS = new Set(['desc-cloro-gel-5-l-32', 'a-b-50ml-1'])
  const base = (...linhas: string[]) =>
    [CABECALHO_DA_PLANILHA, ...linhas].join('\n')

  it('lê só os pesos reais preenchidos dos produtos (ignora caixas e linhas vazias)', () => {
    const lida = lerPlanilhaDeMedidas(
      base(
        'caixa;Pequena;Caixa Pequena;;;100;;20;15;10;1000;',
        'produto;desc-cloro-gel-5-l-32;Cloro;Galão 5 L;sim;5300;5.450;;;;;',
        'produto;a-b-50ml-1;AB;50ml;;91;;;;;;',
      ),
      SKUS,
    )
    expect(lida.problemas).toEqual([])
    expect([...lida.pesosReais]).toEqual([['desc-cloro-gel-5-l-32', 5450]])
  })

  it('recusa sku desconhecido, repetido e peso inválido, sem repetir o valor', () => {
    const lida = lerPlanilhaDeMedidas(
      base(
        'produto;nao-existe-1;X;;;1;123;;;;;',
        'produto;a-b-50ml-1;AB;50ml;;91;abc;;;;;',
        'produto;a-b-50ml-1;AB;50ml;;91;80;;;;;',
        'produto;desc-cloro-gel-5-l-32;C;;;1;0;;;;;',
      ),
      SKUS,
    )
    expect(lida.problemas).toHaveLength(4)
    expect(lida.problemas.join(' ')).not.toMatch(/123|abc/)
  })

  it('o cabeçalho precisa ter tipo, codigo e peso_real_g', () => {
    expect(lerPlanilhaDeMedidas('a;b\n1;2', SKUS).problemas).toHaveLength(1)
    expect(lerPlanilhaDeMedidas('', SKUS).problemas).toEqual([
      'A planilha está vazia.',
    ])
  })

  it.each([
    ['350', 350],
    ['350,5', 351],
    ['1.250', 1250],
    ['1.250,5', 1251],
    ['  80 g', 80],
  ])('converterPesoEmGramas("%s") = %i', (bruto, esperado) => {
    expect(converterPesoEmGramas(bruto)).toBe(esperado)
  })

  it.each(['', '0', '-5', 'abc', '30001', '1,2,3'])(
    '"%s" é inválido',
    (bruto) => {
      expect(converterPesoEmGramas(bruto)).toBeNull()
    },
  )
})

describe('desejarLogistica e compararLogistica', () => {
  const produtos = [
    { sku: 'a-b-50ml-1', nome: 'A - B', tamanho: '50ml' },
    {
      sku: 'desc-cloro-gel-5-l-32',
      nome: 'Cloro Gel 5 L',
      tamanho: 'Galão 5 L',
    },
  ]

  it('peso real vira medido; sem peso real vale a estimativa; liquido pela lista', () => {
    expect(desejarLogistica(produtos, new Map([['a-b-50ml-1', 100]]))).toEqual([
      { sku: 'a-b-50ml-1', pesoG: 100, origemDoPeso: 'medido', liquido: false },
      {
        sku: 'desc-cloro-gel-5-l-32',
        pesoG: 5300,
        origemDoPeso: 'estimado',
        liquido: true,
      },
    ])
  })

  const linha = (
    sku: string,
    o: Partial<LogisticaNoBanco> = {},
  ): LogisticaNoBanco => ({
    sku,
    peso_g: 91,
    origem_do_peso: 'estimado',
    liquido: false,
    so_retirada: false,
    ...o,
  })

  it('separa novos, alterados e iguais', () => {
    const r = compararLogistica(desejarLogistica(produtos, new Map()), [
      linha('desc-cloro-gel-5-l-32', { peso_g: 5300, liquido: false }),
    ])
    expect(r.novos.map((n) => n.sku)).toEqual(['a-b-50ml-1'])
    expect(r.alterados).toEqual([
      expect.objectContaining({
        sku: 'desc-cloro-gel-5-l-32',
        campos: ['liquido'],
      }),
    ])
    expect(r.iguais).toBe(0)
  })

  it('NUNCA troca um peso medido por estimado', () => {
    const r = compararLogistica(desejarLogistica(produtos, new Map()), [
      linha('a-b-50ml-1', { peso_g: 130, origem_do_peso: 'medido' }),
      linha('desc-cloro-gel-5-l-32', { peso_g: 5300, liquido: true }),
    ])
    expect(r.alterados).toEqual([])
    expect(r.iguais).toBe(2)
    expect(r.medidosPreservados).toEqual(['a-b-50ml-1'])
  })

  it('peso real novo sobrescreve o estimado do banco', () => {
    const r = compararLogistica(
      desejarLogistica(produtos, new Map([['a-b-50ml-1', 100]])),
      [
        linha('a-b-50ml-1'),
        linha('desc-cloro-gel-5-l-32', { peso_g: 5300, liquido: true }),
      ],
    )
    expect(r.alterados).toEqual([
      expect.objectContaining({
        sku: 'a-b-50ml-1',
        campos: ['peso_g', 'origem_do_peso'],
      }),
    ])
  })

  it('so_retirada fica fora da carga: a válvula ligada à mão não é desfeita', () => {
    const r = compararLogistica(desejarLogistica(produtos, new Map()), [
      linha('a-b-50ml-1', { so_retirada: true }),
      linha('desc-cloro-gel-5-l-32', {
        peso_g: 5300,
        liquido: true,
        so_retirada: true,
      }),
    ])
    expect(r.alterados).toEqual([])
    expect(r.iguais).toBe(2)
  })

  it('segunda rodada depois de gravar: nada novo nem alterado', () => {
    const desejado = desejarLogistica(produtos, new Map())
    const noBanco = desejado.map((d) =>
      linha(d.sku, {
        peso_g: d.pesoG,
        origem_do_peso: d.origemDoPeso,
        liquido: d.liquido,
      }),
    )
    const r = compararLogistica(desejado, noBanco)
    expect(r.novos).toEqual([])
    expect(r.alterados).toEqual([])
  })
})
