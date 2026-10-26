// Lógica PURA (sem rede) da carga dos preços de profissional: ler a planilha
// CSV, comparar com o banco e achar o que ficou sem preço. Os preços são
// confidenciais: nada aqui (nem as mensagens de erro) repete um valor de preço.

export interface LinhaDePreco {
  sku: string
  /** inteiro, para comparar sem erro de ponto flutuante */
  centavos: number
}

export interface ResultadoDaPlanilha {
  linhas: LinhaDePreco[]
  problemas: string[]
}

// Aceita "129,90", "129.90", "1.299,90", "R$ 129,90" e "129". Mais de 2 casas
// ou valor zero é recusado (não arredondamos preço em silêncio).
export function converterPreco(bruto: string): number | null {
  let texto = bruto.replace(/R\$|\s| /g, '')
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.')
  const partes = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(texto)
  if (!partes) return null
  const reais = Number(partes[1])
  const centavosTexto = (partes[2] ?? '').padEnd(2, '0')
  const total = reais * 100 + Number(centavosTexto)
  return total > 0 ? total : null
}

// Divide uma linha pelo separador, entendendo campos entre aspas
function dividirLinha(linha: string, separador: string): string[] {
  const campos: string[] = []
  let atual = ''
  let entreAspas = false
  for (const caractere of linha) {
    if (caractere === '"') entreAspas = !entreAspas
    else if (caractere === separador && !entreAspas) {
      campos.push(atual)
      atual = ''
    } else atual += caractere
  }
  campos.push(atual)
  return campos.map((campo) => campo.trim())
}

// Lê a planilha (cabeçalho com as colunas "sku" e "preco"; o separador é ; ou ,
// e outras colunas são ignoradas). `skusDoBanco` são os produtos que existem:
// sku desconhecido é erro. Quem chama NÃO deve gravar se houver problemas.
export function lerPlanilhaDePrecos(
  texto: string,
  skusDoBanco: ReadonlySet<string>,
): ResultadoDaPlanilha {
  const problemas: string[] = []
  const linhas: LinhaDePreco[] = []

  const registros = texto
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((linha, indice) => ({ linha, numero: indice + 1 }))
    .filter(({ linha }) => linha.trim() !== '')

  const cabecalho = registros[0]
  if (!cabecalho) return { linhas, problemas: ['A planilha está vazia.'] }

  const separador = cabecalho.linha.includes(';') ? ';' : ','
  const nomes = dividirLinha(cabecalho.linha, separador).map((n) =>
    n.toLowerCase(),
  )
  const colunaSku = nomes.indexOf('sku')
  const colunaPreco = nomes.indexOf('preco')
  if (colunaSku === -1 || colunaPreco === -1) {
    return {
      linhas,
      problemas: ['O cabeçalho precisa ter as colunas "sku" e "preco".'],
    }
  }

  const vistos = new Set<string>()
  for (const { linha, numero } of registros.slice(1)) {
    const campos = dividirLinha(linha, separador)
    if (campos.length !== nomes.length) {
      problemas.push(
        `linha ${numero}: ${campos.length} colunas em vez de ${nomes.length}. Se o preço usa vírgula, use ; como separador ou coloque o preço entre aspas.`,
      )
      continue
    }
    const sku = campos[colunaSku] ?? ''
    if (!skusDoBanco.has(sku)) {
      problemas.push(`linha ${numero}: o sku "${sku}" não existe em produtos.`)
      continue
    }
    if (vistos.has(sku)) {
      problemas.push(`linha ${numero}: o sku "${sku}" aparece mais de uma vez.`)
      continue
    }
    vistos.add(sku)

    const centavos = converterPreco(campos[colunaPreco] ?? '')
    if (centavos === null) {
      problemas.push(
        `linha ${numero}: preço inválido para o sku "${sku}" (use números, no máximo 2 casas, maior que zero).`,
      )
      continue
    }
    linhas.push({ sku, centavos })
  }

  return { linhas, problemas }
}

export interface PrecoNoBanco {
  sku: string
  preco: number | string
}

export interface ResultadoDaComparacaoDePrecos {
  novos: string[]
  alterados: string[]
  iguais: number
  /** têm preço no banco e não estão na planilha (a carga NUNCA apaga) */
  ausentesNaPlanilha: string[]
}

export function compararPrecos(
  linhas: LinhaDePreco[],
  noBanco: PrecoNoBanco[],
): ResultadoDaComparacaoDePrecos {
  const atuais = new Map(
    noBanco.map((p) => [p.sku, Math.round(Number(p.preco) * 100)]),
  )
  const novos: string[] = []
  const alterados: string[] = []
  let iguais = 0

  for (const { sku, centavos } of linhas) {
    const atual = atuais.get(sku)
    if (atual === undefined) novos.push(sku)
    else if (atual !== centavos) alterados.push(sku)
    else iguais++
  }

  const naPlanilha = new Set(linhas.map((l) => l.sku))
  const ausentesNaPlanilha = noBanco
    .map((p) => p.sku)
    .filter((sku) => !naPlanilha.has(sku))

  return { novos, alterados, iguais, ausentesNaPlanilha }
}

// Produtos que um profissional não conseguiria comprar por falta de preço: os
// exclusivos de profissional ativos sem linha de preço (nem no banco nem na
// planilha). Os não exclusivos têm preço público e não entram aqui.
export function semPrecoProfissional(
  produtos: Array<{
    sku: string
    nome: string
    exclusivo_profissional: boolean
    ativo: boolean
  }>,
  skusComPreco: ReadonlySet<string>,
) {
  return produtos.filter(
    (p) => p.exclusivo_profissional && p.ativo && !skusComPreco.has(p.sku),
  )
}
