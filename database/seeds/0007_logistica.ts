// Carga da logística dos produtos (tabela produtos_logistica, migração 0007) e
// geração da planilha que a Bia preenche com os pesos reais.
//
// Uso, dentro de backend/:
//   npm run seed:logistica -- --gerar-planilha       escreve docs/frete-medidas.csv
//                                                     (não usa o banco)
//   npm run seed:logistica                           simulação
//   npm run seed:logistica -- --aplicar              grava de verdade
//   npm run seed:logistica -- --arquivo=outra.csv    lê outra planilha de pesos
//
// Peso ESTIMADO pelo tamanho, até a Bia pesar; o peso real da planilha
// (peso_real_g) vira `medido`. `liquido = true` nos 13 líquidos descartáveis (a
// Bia precisa de embalagem vedada) e NADA é restrito: `so_retirada` nasce false
// em todos e a carga nunca mexe nele. A carga nunca apaga linha e nunca troca um
// peso `medido` por estimado. Não imprime chave nenhuma.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAIXAS } from '../../backend/src/modules/frete/caixas.js'
import { supabaseAdmin } from '../../backend/src/lib/supabase.js'
import { lerCatalogo } from './lib/catalogo.js'
import { lerDescartaveis } from './lib/descartaveis.js'
import {
  compararLogistica,
  desejarLogistica,
  gerarPlanilha,
  lerPlanilhaDeMedidas,
  SKUS_LIQUIDOS,
  type LogisticaNoBanco,
  type ProdutoParaEstimar,
} from './lib/logistica.js'

const aplicar = process.argv.includes('--aplicar')
const gerarSo = process.argv.includes('--gerar-planilha')
const argumentoDoArquivo = process.argv
  .find((a) => a.startsWith('--arquivo='))
  ?.slice('--arquivo='.length)
const RAIZ = fileURLToPath(new URL('../../', import.meta.url))
const planilha = argumentoDoArquivo
  ? resolve(process.cwd(), argumentoDoArquivo)
  : resolve(RAIZ, 'docs/frete-medidas.csv')
const TAMANHO_DO_LOTE = 100

const mostrar = (texto = '') => console.log(texto)

function listar(titulo: string, itens: string[], limite = 15) {
  if (itens.length === 0) return
  mostrar(`${titulo}:`)
  for (const item of itens.slice(0, limite)) mostrar(`  - ${item}`)
  if (itens.length > limite) mostrar(`  ... e mais ${itens.length - limite}`)
}

// Os produtos como o site os conhece (JSON); serve para gerar a planilha sem o
// banco
function produtosDosJson(): ProdutoParaEstimar[] {
  const ler = (relativo: string) =>
    JSON.parse(readFileSync(resolve(RAIZ, relativo), 'utf8')) as unknown
  const tulipia = lerCatalogo(ler('frontend/src/data/tulipia-produtos.json'))
  const descartaveis = lerDescartaveis(
    ler('frontend/src/data/descartaveis.json'),
  )
  return [...tulipia.produtos, ...descartaveis.produtos].map((p) => ({
    sku: p.sku,
    nome: p.nome,
    tamanho: p.tamanho,
  }))
}

async function lerTudo<T>(tabela: string, colunas: string): Promise<T[]> {
  const todos: T[] = []
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabaseAdmin
      .from(tabela)
      .select(colunas)
      .order('sku')
      .range(inicio, inicio + 999)
    if (error) {
      const dica =
        error.code === 'PGRST205' || error.code === '42P01'
          ? ' (a migração 0007 foi colada neste banco?)'
          : ''
      throw new Error(`Falha ao ler ${tabela} (${error.code})${dica}`)
    }
    todos.push(...(data as T[]))
    if (data.length < 1000) break
  }
  return todos
}

async function executar(): Promise<number> {
  if (gerarSo) {
    const produtos = produtosDosJson()
    writeFileSync(
      resolve(RAIZ, 'docs/frete-medidas.csv'),
      `﻿${gerarPlanilha(produtos, [...CAIXAS])}`,
      'utf8',
    )
    mostrar(
      `Planilha gerada: docs/frete-medidas.csv (${produtos.length} produtos e ${CAIXAS.length} caixas).`,
    )
    return 0
  }

  const produtos = await lerTudo<ProdutoParaEstimar>(
    'produtos',
    'sku, nome, tamanho',
  )
  const skus = new Set(produtos.map((p) => p.sku))

  const ausentes = [...SKUS_LIQUIDOS].filter((sku) => !skus.has(sku))
  if (ausentes.length > 0) {
    mostrar(
      'A lista de líquidos tem sku que não existe em produtos e NADA foi gravado:',
    )
    for (const sku of ausentes) mostrar(`  - ${sku}`)
    return 1
  }

  let pesosReais = new Map<string, number>()
  if (existsSync(planilha)) {
    const lida = lerPlanilhaDeMedidas(readFileSync(planilha, 'utf8'), skus)
    if (lida.problemas.length > 0) {
      mostrar('A planilha tem problemas e NADA foi gravado:')
      for (const problema of lida.problemas) mostrar(`  - ${problema}`)
      return 1
    }
    pesosReais = lida.pesosReais
  }

  const desejado = desejarLogistica(produtos, pesosReais)
  const noBanco = await lerTudo<LogisticaNoBanco>(
    'produtos_logistica',
    'sku, peso_g, origem_do_peso, liquido, so_retirada',
  )
  const comparacao = compararLogistica(desejado, noBanco)

  mostrar(
    `Produtos: ${produtos.length} | pesos reais na planilha: ${pesosReais.size}`,
  )
  mostrar(`No banco agora: ${noBanco.length} linhas de logística`)
  mostrar('')
  mostrar(`  novos:                         ${comparacao.novos.length}`)
  mostrar(`  alterados:                     ${comparacao.alterados.length}`)
  mostrar(`  iguais:                        ${comparacao.iguais}`)
  mostrar(
    `  medidos preservados:           ${comparacao.medidosPreservados.length}`,
  )
  mostrar(
    `  líquidos (liquido = true):     ${desejado.filter((d) => d.liquido).length}`,
  )
  mostrar(
    `  estimados:                     ${desejado.filter((d) => d.origemDoPeso === 'estimado').length}`,
  )
  mostrar(
    `  medidos:                       ${desejado.filter((d) => d.origemDoPeso === 'medido').length}`,
  )
  mostrar('  so_retirada = true:            0 (a carga nunca liga a válvula)')
  mostrar('')
  listar(
    'Alterados',
    comparacao.alterados.map((a) => `${a.sku} (${a.campos.join(', ')})`),
  )

  if (!aplicar) {
    mostrar('')
    mostrar('SIMULAÇÃO: nada foi gravado.')
    mostrar('Para gravar: npm run seed:logistica -- --aplicar')
    return 0
  }

  // ---- grava ----------------------------------------------------------------
  const novos = comparacao.novos.map((d) => ({
    sku: d.sku,
    peso_g: d.pesoG,
    origem_do_peso: d.origemDoPeso,
    liquido: d.liquido,
  }))
  for (let i = 0; i < novos.length; i += TAMANHO_DO_LOTE) {
    const { error } = await supabaseAdmin
      .from('produtos_logistica')
      .insert(novos.slice(i, i + TAMANHO_DO_LOTE))
    if (error) throw new Error(`Falha ao inserir logística (${error.code})`)
  }
  for (const { sku, campos, novo } of comparacao.alterados) {
    const alteracao: Record<string, unknown> = {}
    if (campos.includes('peso_g')) alteracao.peso_g = novo.pesoG
    if (campos.includes('origem_do_peso'))
      alteracao.origem_do_peso = novo.origemDoPeso
    if (campos.includes('liquido')) alteracao.liquido = novo.liquido
    const { error } = await supabaseAdmin
      .from('produtos_logistica')
      .update(alteracao)
      .eq('sku', sku)
    if (error) throw new Error(`Falha ao atualizar logística (${error.code})`)
  }

  const depois = compararLogistica(
    desejado,
    await lerTudo<LogisticaNoBanco>(
      'produtos_logistica',
      'sku, peso_g, origem_do_peso, liquido, so_retirada',
    ),
  )
  const sobrou = depois.novos.length + depois.alterados.length
  mostrar('')
  mostrar(
    sobrou === 0
      ? `GRAVADO e conferido: ${comparacao.novos.length} novos, ${comparacao.alterados.length} atualizados.`
      : `ATENÇÃO: depois da carga ainda há ${sobrou} diferença(s). Rode a simulação para ver quais.`,
  )
  return sobrou === 0 ? 0 : 1
}

process.exitCode = await executar()
