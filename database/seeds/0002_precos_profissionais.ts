// Carga dos preços de profissional (passo 10 do plano), a partir de uma
// planilha CSV que NÃO vai para o git (database/seeds/dados/ está no
// .gitignore). Preço profissional nunca fica no código nem no JSON do site.
//
// Uso, dentro de backend/:
//   npm run seed:precos-profissionais                      simulação
//   npm run seed:precos-profissionais -- --aplicar         grava de verdade
//   npm run seed:precos-profissionais -- --arquivo=outro.csv
//
// A planilha precisa ter as colunas sku e preco (veja
// database/seeds/precos-profissionais.exemplo.csv). A carga é idempotente e
// NUNCA apaga preço. NÃO imprime nenhum valor de preço, só quantidades e skus.
// Se a planilha tiver qualquer problema, nada é gravado, mesmo com --aplicar.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabaseAdmin } from '../../backend/src/lib/supabase.js'
import {
  compararPrecos,
  lerPlanilhaDePrecos,
  semPrecoProfissional,
  type PrecoNoBanco,
} from './lib/precos.js'

const aplicar = process.argv.includes('--aplicar')
const argumentoDoArquivo = process.argv
  .find((a) => a.startsWith('--arquivo='))
  ?.slice('--arquivo='.length)
const arquivo = argumentoDoArquivo
  ? resolve(process.cwd(), argumentoDoArquivo)
  : fileURLToPath(new URL('./dados/precos-profissionais.csv', import.meta.url))
const TAMANHO_DO_LOTE = 100

function mostrar(texto = '') {
  console.log(texto)
}

function listar(titulo: string, itens: string[], limite = 15) {
  if (itens.length === 0) return
  mostrar(`${titulo}:`)
  for (const item of itens.slice(0, limite)) mostrar(`  - ${item}`)
  if (itens.length > limite) mostrar(`  ... e mais ${itens.length - limite}`)
}

interface ProdutoDoBanco {
  sku: string
  nome: string
  exclusivo_profissional: boolean
  ativo: boolean
}

async function lerTudo<T>(tabela: string, colunas: string): Promise<T[]> {
  const todos: T[] = []
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabaseAdmin
      .from(tabela)
      .select(colunas)
      .order('sku')
      .range(inicio, inicio + 999)
    if (error) throw new Error(`Falha ao ler ${tabela} (${error.code})`)
    todos.push(...(data as T[]))
    if (data.length < 1000) break
  }
  return todos
}

// O código de saída é devolvido (e não usado process.exit): no Windows, sair
// com a rede ainda fechando derruba o Node com um erro do libuv.
async function executar(): Promise<number> {
  if (!existsSync(arquivo)) {
    mostrar('Planilha não encontrada.')
    mostrar(
      'Crie o arquivo database/seeds/dados/precos-profissionais.csv (essa',
    )
    mostrar('pasta fica fora do git) com as colunas sku e preco, como em')
    mostrar('database/seeds/precos-profissionais.exemplo.csv, ou indique outro')
    mostrar('caminho com --arquivo=.')
    return 1
  }

  const produtos = await lerTudo<ProdutoDoBanco>(
    'produtos',
    'sku, nome, exclusivo_profissional, ativo',
  )
  const { linhas, problemas } = lerPlanilhaDePrecos(
    readFileSync(arquivo, 'utf8'),
    new Set(produtos.map((p) => p.sku)),
  )

  if (problemas.length > 0) {
    mostrar('A planilha tem problemas e NADA foi gravado:')
    for (const problema of problemas) mostrar(`  - ${problema}`)
    return 1
  }

  const noBanco = await lerTudo<PrecoNoBanco>(
    'precos_profissionais',
    'sku, preco',
  )
  const comparacao = compararPrecos(linhas, noBanco)

  mostrar(`Planilha: ${linhas.length} preços`)
  mostrar(`No banco agora: ${noBanco.length} preços`)
  mostrar('')
  mostrar(`  novos:                        ${comparacao.novos.length}`)
  mostrar(`  alterados:                    ${comparacao.alterados.length}`)
  mostrar(`  iguais:                       ${comparacao.iguais}`)
  mostrar(
    `  no banco e fora da planilha:  ${comparacao.ausentesNaPlanilha.length}`,
  )
  mostrar('')
  listar('Alterados (o valor mudou)', comparacao.alterados)
  listar(
    'No banco e fora da planilha (a carga nunca apaga)',
    comparacao.ausentesNaPlanilha,
  )

  // Quem ficaria sem preço profissional depois da carga
  const comPreco = new Set([
    ...noBanco.map((p) => p.sku),
    ...linhas.map((l) => l.sku),
  ])
  const faltando = semPrecoProfissional(produtos, comPreco)
  mostrar('')
  mostrar(
    `Exclusivos de profissional ativos SEM preço profissional (um profissional não conseguiria comprar): ${faltando.length}`,
  )
  listar(
    'Sem preço',
    faltando.map((p) => `${p.sku} | ${p.nome}`),
    20,
  )

  if (!aplicar) {
    mostrar('')
    mostrar('SIMULAÇÃO: nada foi gravado.')
    mostrar('Para gravar: npm run seed:precos-profissionais -- --aplicar')
    return 0
  }

  // ---- grava ----------------------------------------------------------------

  const paraGravar = linhas.map((l) => ({
    sku: l.sku,
    preco: l.centavos / 100,
  }))
  for (let i = 0; i < paraGravar.length; i += TAMANHO_DO_LOTE) {
    const lote = paraGravar.slice(i, i + TAMANHO_DO_LOTE)
    const { error } = await supabaseAdmin
      .from('precos_profissionais')
      .upsert(lote, { onConflict: 'sku' })
    if (error) throw new Error(`Falha ao gravar preços (${error.code})`)
  }

  const depois = compararPrecos(
    linhas,
    await lerTudo<PrecoNoBanco>('precos_profissionais', 'sku, preco'),
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
