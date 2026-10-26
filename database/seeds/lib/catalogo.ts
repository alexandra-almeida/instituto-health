// Lógica PURA (sem rede) da carga do catálogo: validar o JSON e comparar com o
// que está no banco. Fica separada do script para poder ser testada
// (backend/tests/seedCatalogo.test.ts e catalogo.test.ts).

export interface ProdutoParaBanco {
  sku: string
  nome: string
  tamanho: string
  /** preço público em reais, 2 casas; nulo nos exclusivos de profissional */
  preco: number | null
  exclusivo_profissional: boolean
}

export interface ProdutoNoBanco extends ProdutoParaBanco {
  ativo: boolean
}

export interface ResultadoDaLeitura {
  produtos: ProdutoParaBanco[]
  problemas: string[]
  /** preços que de fato mudaram ao arredondar para 2 casas (valor diferente) */
  arredondados: Array<{ sku: string; de: number; para: number }>
}

// nome-tamanho-N, em minúsculas e sem acentos (CLAUDE.md)
const PADRAO_DE_SKU = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/

const emDuasCasas = (valor: number) =>
  Math.round((valor + Number.EPSILON) * 100) / 100

function objeto(valor: unknown): Record<string, unknown> | null {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null
}

// Lê frontend/src/data/tulipia-produtos.json (já convertido de texto em objeto)
// e devolve os produtos prontos para o banco, mais o que estiver errado. Quem
// chama NÃO deve gravar nada se `problemas` não estiver vazio.
export function lerCatalogo(json: unknown): ResultadoDaLeitura {
  const problemas: string[] = []
  const arredondados: ResultadoDaLeitura['arredondados'] = []
  const produtos: ProdutoParaBanco[] = []

  const lista = objeto(json)?.produtos
  if (!Array.isArray(lista)) {
    return {
      produtos,
      problemas: ['O JSON não tem a lista "produtos".'],
      arredondados,
    }
  }

  const vistos = new Set<string>()
  lista.forEach((bruto, indice) => {
    const item = objeto(bruto)
    const onde = `produto ${indice}`
    if (!item) {
      problemas.push(`${onde}: não é um objeto.`)
      return
    }

    const { sku, nome, tamanho, preco, exclusivoProfissional } = item
    if (typeof sku !== 'string' || !PADRAO_DE_SKU.test(sku)) {
      problemas.push(`${onde}: sku ausente ou fora do padrão nome-tamanho-N.`)
      return
    }
    if (vistos.has(sku)) {
      problemas.push(`${sku}: sku repetido.`)
      return
    }
    vistos.add(sku)

    if (typeof nome !== 'string' || nome.trim() === '') {
      problemas.push(`${sku}: nome vazio.`)
    }
    if (tamanho !== undefined && typeof tamanho !== 'string') {
      problemas.push(`${sku}: tamanho não é texto.`)
    }
    if (
      exclusivoProfissional !== undefined &&
      typeof exclusivoProfissional !== 'boolean'
    ) {
      problemas.push(`${sku}: exclusivoProfissional não é verdadeiro ou falso.`)
    }
    const exclusivo = exclusivoProfissional === true

    let precoFinal: number | null = null
    if (preco !== null && preco !== undefined) {
      if (typeof preco !== 'number' || !Number.isFinite(preco) || preco < 0) {
        problemas.push(`${sku}: preço inválido.`)
      } else {
        precoFinal = emDuasCasas(preco)
        // Só conta como arredondado se o VALOR mudou: 71.1 já é exato, mesmo
        // que a conta 71.1 * 100 dê ruído de ponto flutuante
        if (Math.abs(precoFinal - preco) > 1e-9) {
          arredondados.push({ sku, de: preco, para: precoFinal })
        }
      }
    }
    // Regra de negócio (CLAUDE.md e o check do banco): exclusivo de profissional
    // nunca tem preço público
    if (exclusivo && precoFinal !== null) {
      problemas.push(
        `${sku}: exclusivo de profissional não pode ter preço público.`,
      )
    }

    produtos.push({
      sku,
      nome: typeof nome === 'string' ? nome : '',
      tamanho: typeof tamanho === 'string' ? tamanho : '',
      preco: precoFinal,
      exclusivo_profissional: exclusivo,
    })
  })

  return { produtos, problemas, arredondados }
}

export type CampoDoProduto =
  'nome' | 'tamanho' | 'preco' | 'exclusivo_profissional'

export interface Alteracao {
  sku: string
  campos: CampoDoProduto[]
  novo: ProdutoParaBanco
}

export interface ResultadoDaComparacao {
  novos: ProdutoParaBanco[]
  alterados: Alteracao[]
  iguais: number
  /** estão no banco e não estão mais no JSON (a carga NUNCA apaga) */
  ausentes: ProdutoNoBanco[]
}

// numeric do Postgres pode chegar como número ou texto; compara em centavos
const centavos = (valor: number | string | null) =>
  valor === null ? null : Math.round(Number(valor) * 100)

// Compara o catálogo do JSON com o do banco. `ativo` NÃO entra na comparação:
// é decisão de quem administra (tirar da venda) e a carga não a desfaz.
export function compararCatalogo(
  doJson: ProdutoParaBanco[],
  doBanco: ProdutoNoBanco[],
): ResultadoDaComparacao {
  const porSku = new Map(doBanco.map((p) => [p.sku, p]))
  const novos: ProdutoParaBanco[] = []
  const alterados: Alteracao[] = []
  let iguais = 0

  for (const produto of doJson) {
    const atual = porSku.get(produto.sku)
    if (!atual) {
      novos.push(produto)
      continue
    }
    const campos: CampoDoProduto[] = []
    if (atual.nome !== produto.nome) campos.push('nome')
    if (atual.tamanho !== produto.tamanho) campos.push('tamanho')
    if (centavos(atual.preco) !== centavos(produto.preco)) campos.push('preco')
    if (atual.exclusivo_profissional !== produto.exclusivo_profissional) {
      campos.push('exclusivo_profissional')
    }
    if (campos.length === 0) iguais++
    else alterados.push({ sku: produto.sku, campos, novo: produto })
  }

  const skusDoJson = new Set(doJson.map((p) => p.sku))
  const ausentes = doBanco.filter((p) => !skusDoJson.has(p.sku))

  return { novos, alterados, iguais, ausentes }
}
