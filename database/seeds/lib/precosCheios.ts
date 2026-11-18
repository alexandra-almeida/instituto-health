// Lógica PURA (sem rede) da carga do preço cheio dos exclusivos de profissional:
// ler a planilha CSV, conferir contra o catálogo do banco e comparar com o que
// já está gravado. Os preços são confidenciais: nada aqui (nem as mensagens de
// erro) repete um valor de preço.
import { converterPreco, dividirLinha } from './precos.js'

export interface LinhaDePrecoCheio {
  sku: string
  /** inteiro, para comparar sem erro de ponto flutuante; nulo = linha SEM preço */
  centavos: number | null
}

export interface ResultadoDaPlanilhaDePrecosCheios {
  linhas: LinhaDePrecoCheio[]
  problemas: string[]
}

export interface CatalogoParaConferir {
  /** todos os skus de `produtos` */
  todos: ReadonlySet<string>
  /** só os exclusivos de profissional (`exclusivo_profissional = true`) */
  exclusivos: ReadonlySet<string>
}

// Lê a planilha (cabeçalho com as colunas "sku" e "preco_cheio"; o separador é
// ; ou , e as outras colunas, como categoria e produto, são ignoradas). Regras:
//  - todo sku existe em `produtos` e é EXCLUSIVO (o preço dos outros é o
//    público, no catálogo);
//  - nenhum sku repetido;
//  - preço preenchido precisa ser válido (até 2 casas, maior que zero); preço
//    VAZIO é aceito e quer dizer "sem preço": o produto não pode ser vendido;
//  - todo exclusivo do catálogo tem uma linha (mesmo vazia), para esquecer um
//    produto nunca passar em silêncio.
// Quem chama NÃO deve gravar nada se houver problemas.
export function lerPlanilhaDePrecosCheios(
  texto: string,
  catalogo: CatalogoParaConferir,
): ResultadoDaPlanilhaDePrecosCheios {
  const problemas: string[] = []
  const linhas: LinhaDePrecoCheio[] = []

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
  const colunaPreco = nomes.indexOf('preco_cheio')
  if (colunaSku === -1 || colunaPreco === -1) {
    return {
      linhas,
      problemas: ['O cabeçalho precisa ter as colunas "sku" e "preco_cheio".'],
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
    if (!catalogo.todos.has(sku)) {
      problemas.push(`linha ${numero}: o sku "${sku}" não existe em produtos.`)
      continue
    }
    if (!catalogo.exclusivos.has(sku)) {
      problemas.push(
        `linha ${numero}: o sku "${sku}" não é exclusivo de profissional (o preço dele é o público, no catálogo).`,
      )
      continue
    }
    if (vistos.has(sku)) {
      problemas.push(`linha ${numero}: o sku "${sku}" aparece mais de uma vez.`)
      continue
    }
    vistos.add(sku)

    const bruto = campos[colunaPreco] ?? ''
    if (bruto.trim() === '') {
      linhas.push({ sku, centavos: null })
      continue
    }
    const centavos = converterPreco(bruto)
    if (centavos === null) {
      problemas.push(
        `linha ${numero}: preço inválido para o sku "${sku}" (use números, no máximo 2 casas, maior que zero; deixe vazio se o produto ainda não tem preço).`,
      )
      continue
    }
    linhas.push({ sku, centavos })
  }

  for (const sku of catalogo.exclusivos) {
    if (!vistos.has(sku)) {
      problemas.push(
        `o exclusivo "${sku}" não tem linha na planilha (acrescente, mesmo com o preço vazio).`,
      )
    }
  }

  return { linhas, problemas }
}

export interface PrecoCheioNoBanco {
  sku: string
  /** numeric do Postgres: chega como número ou texto; nulo = sem preço */
  preco_cheio: number | string | null
}

export interface ResultadoDaComparacaoDePrecosCheios {
  /** planilha com preço, banco sem */
  novos: string[]
  /** planilha com preço diferente do banco */
  alterados: string[]
  iguais: number
  /** planilha vazia e banco vazio: seguem SEM preço (não podem ser vendidos) */
  semPreco: string[]
  /** planilha vazia, mas o banco TEM preço: a carga NUNCA apaga, o preço fica */
  vaziosComPrecoNoBanco: string[]
}

const emCentavos = (valor: number | string | null) =>
  valor === null ? null : Math.round(Number(valor) * 100)

export function compararPrecosCheios(
  linhas: LinhaDePrecoCheio[],
  noBanco: PrecoCheioNoBanco[],
): ResultadoDaComparacaoDePrecosCheios {
  const atuais = new Map(noBanco.map((p) => [p.sku, emCentavos(p.preco_cheio)]))
  const resultado: ResultadoDaComparacaoDePrecosCheios = {
    novos: [],
    alterados: [],
    iguais: 0,
    semPreco: [],
    vaziosComPrecoNoBanco: [],
  }

  for (const { sku, centavos } of linhas) {
    const atual = atuais.get(sku) ?? null
    if (centavos === null) {
      if (atual === null) resultado.semPreco.push(sku)
      else resultado.vaziosComPrecoNoBanco.push(sku)
    } else if (atual === null) resultado.novos.push(sku)
    else if (atual !== centavos) resultado.alterados.push(sku)
    else resultado.iguais++
  }
  return resultado
}

// Valor para a coluna numeric(10,2): centavos inteiros viram "129.90" (texto
// exato, sem passar por ponto flutuante)
export function centavosParaNumeric(centavos: number): string {
  const reais = Math.trunc(centavos / 100)
  const resto = String(centavos % 100).padStart(2, '0')
  return `${reais}.${resto}`
}
