// Lógica PURA (sem rede) da carga dos descartáveis para clínicas: validar o JSON
// (frontend/src/data/descartaveis.json) e convertê-lo nas linhas da tabela
// `produtos`, uma por VARIAÇÃO. Testada em backend/tests/seedDescartaveis.test.ts.
import { PADRAO_DE_SKU } from './catalogo.js'
import type { ProdutoParaBanco, ResultadoDaLeitura } from './catalogo.js'

// Todo sku dos descartáveis começa com isto, para nunca colidir com os da
// Tulípia (que seguem nome-tamanho-N e não usam este prefixo)
export const PREFIXO_DOS_DESCARTAVEIS = 'desc-'

const emDuasCasas = (valor: number) =>
  Math.round((valor + Number.EPSILON) * 100) / 100

function objeto(valor: unknown): Record<string, unknown> | null {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null
}

const textoOuNulo = (valor: unknown) =>
  valor === null || valor === undefined || typeof valor === 'string'

// Cada variação vira uma linha de `produtos`:
// - sku: o da variação;
// - nome: o do produto, mais a marca quando existe (assim as 3 águas sanitárias
//   de 5 L se distinguem);
// - tamanho: a variação (tamanho da luva, fragrância) e a embalagem confirmada;
// - preco: o preço único (descartável não tem preço de profissional);
// - exclusivo_profissional: sempre falso.
// Quem chama NÃO deve gravar nada se `problemas` não estiver vazio.
export function lerDescartaveis(json: unknown): ResultadoDaLeitura {
  const problemas: string[] = []
  const arredondados: ResultadoDaLeitura['arredondados'] = []
  const produtos: ProdutoParaBanco[] = []

  const lista = objeto(json)?.produtos
  if (!Array.isArray(lista)) {
    return {
      produtos,
      problemas: ['O JSON dos descartáveis não tem a lista "produtos".'],
      arredondados,
    }
  }

  const vistos = new Set<string>()
  lista.forEach((bruto, indice) => {
    const item = objeto(bruto)
    const onde = `descartável ${indice}`
    if (!item) {
      problemas.push(`${onde}: não é um objeto.`)
      return
    }

    const { nome, categoria, marca, embalagem, variacoes } = item
    if (typeof nome !== 'string' || nome.trim() === '') {
      problemas.push(`${onde}: nome vazio.`)
      return
    }
    if (typeof categoria !== 'string' || categoria.trim() === '') {
      problemas.push(`${nome}: categoria vazia.`)
    }
    if (!textoOuNulo(marca) || marca === '') {
      problemas.push(`${nome}: marca precisa ser texto ou nula.`)
    }
    if (!textoOuNulo(embalagem) || embalagem === '') {
      problemas.push(`${nome}: embalagem precisa ser texto ou nula.`)
    }
    // "A CONFIRMAR" não pode chegar ao banco nem ao site
    for (const campo of [nome, marca, embalagem]) {
      if (typeof campo === 'string' && /confirmar/i.test(campo)) {
        problemas.push(`${nome}: tem texto "A CONFIRMAR"; deixe o campo nulo.`)
      }
    }
    if (!Array.isArray(variacoes) || variacoes.length === 0) {
      problemas.push(`${nome}: sem variações.`)
      return
    }

    variacoes.forEach((brutaDaVariacao, j) => {
      const v = objeto(brutaDaVariacao)
      if (!v) {
        problemas.push(`${nome}: variação ${j} não é um objeto.`)
        return
      }
      const { sku, rotulo, preco } = v
      if (typeof sku !== 'string' || !PADRAO_DE_SKU.test(sku)) {
        problemas.push(
          `${nome}: sku da variação ${j} ausente ou fora do padrão desc-nome-N.`,
        )
        return
      }
      if (!sku.startsWith(PREFIXO_DOS_DESCARTAVEIS)) {
        problemas.push(
          `${sku}: sku de descartável precisa começar com "${PREFIXO_DOS_DESCARTAVEIS}".`,
        )
      }
      if (vistos.has(sku)) {
        problemas.push(`${sku}: sku repetido.`)
        return
      }
      vistos.add(sku)

      if (!textoOuNulo(rotulo) || rotulo === '') {
        problemas.push(`${sku}: rótulo da variação precisa ser texto ou nulo.`)
      }
      if (variacoes.length > 1 && typeof rotulo !== 'string') {
        problemas.push(`${sku}: produto com várias variações exige rótulo.`)
      }

      // Todo descartável tem preço: não existe "sob consulta" aqui
      let precoFinal = 0
      if (typeof preco !== 'number' || !Number.isFinite(preco) || preco <= 0) {
        problemas.push(`${sku}: preço obrigatório e maior que zero.`)
      } else {
        precoFinal = emDuasCasas(preco)
        if (Math.abs(precoFinal - preco) > 1e-9) {
          arredondados.push({ sku, de: preco, para: precoFinal })
        }
      }

      const nomeNoBanco =
        typeof marca === 'string' ? `${nome} - ${marca}` : nome
      const tamanho = [rotulo, embalagem]
        .filter((x): x is string => typeof x === 'string' && x !== '')
        .join(' - ')
      produtos.push({
        sku,
        nome: nomeNoBanco,
        tamanho,
        preco: precoFinal,
        exclusivo_profissional: false,
      })
    })
  })

  return { produtos, problemas, arredondados }
}

// Garante que nenhum sku aparece em duas listas (ou duas vezes na junção). Cada
// lista já foi validada sozinha; isto pega a colisão ENTRE elas, por exemplo um
// sku da Tulípia que passasse a usar o prefixo dos descartáveis.
export function verificarColisaoDeSku(
  listas: ReadonlyArray<{ origem: string; produtos: ProdutoParaBanco[] }>,
): string[] {
  const origemDoSku = new Map<string, string>()
  const problemas: string[] = []
  for (const { origem, produtos } of listas) {
    for (const { sku } of produtos) {
      const anterior = origemDoSku.get(sku)
      if (anterior !== undefined && anterior !== origem) {
        problemas.push(
          `${sku}: o mesmo sku está em "${anterior}" e em "${origem}".`,
        )
      }
      origemDoSku.set(sku, origemDoSku.get(sku) ?? origem)
    }
  }
  return problemas
}
