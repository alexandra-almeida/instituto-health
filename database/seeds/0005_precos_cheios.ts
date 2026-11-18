// Carga do preço cheio dos produtos exclusivos de profissional, a partir de uma
// planilha CSV que NÃO vai para o git (database/seeds/dados/ está no
// .gitignore e o repositório é público). O preço cheio é confidencial: nunca
// fica no código nem no JSON do site, só na coluna produtos.preco_cheio
// (migração 0005), que só o servidor lê.
//
// Uso, dentro de backend/:
//   npm run seed:precos-cheios                      simulação
//   npm run seed:precos-cheios -- --aplicar         grava de verdade
//   npm run seed:precos-cheios -- --arquivo=outro.csv
//
// A planilha precisa ter as colunas sku e preco_cheio (as outras, como
// categoria, produto e tamanho, são ignoradas; veja
// database/seeds/precos-exclusivos.exemplo.csv). A carga é idempotente e NUNCA
// apaga preço. Linha com o preço VAZIO deixa o produto sem preço (não pode ser
// vendido). NÃO imprime nenhum valor de preço, só quantidades, skus e nomes.
// Se a planilha tiver qualquer problema, nada é gravado, mesmo com --aplicar.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabaseAdmin } from '../../backend/src/lib/supabase.js'
import {
  centavosParaNumeric,
  compararPrecosCheios,
  lerPlanilhaDePrecosCheios,
  type PrecoCheioNoBanco,
} from './lib/precosCheios.js'

const aplicar = process.argv.includes('--aplicar')
const argumentoDoArquivo = process.argv
  .find((a) => a.startsWith('--arquivo='))
  ?.slice('--arquivo='.length)
const arquivo = argumentoDoArquivo
  ? resolve(process.cwd(), argumentoDoArquivo)
  : fileURLToPath(new URL('./dados/precos-exclusivos.csv', import.meta.url))

function mostrar(texto = '') {
  console.log(texto)
}

function listar(titulo: string, itens: string[], limite = 20) {
  if (itens.length === 0) return
  mostrar(`${titulo}:`)
  for (const item of itens.slice(0, limite)) mostrar(`  - ${item}`)
  if (itens.length > limite) mostrar(`  ... e mais ${itens.length - limite}`)
}

interface ProdutoDoBanco extends PrecoCheioNoBanco {
  nome: string
  exclusivo_profissional: boolean
  ativo: boolean
}

async function lerProdutos(): Promise<ProdutoDoBanco[]> {
  const todos: ProdutoDoBanco[] = []
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select('sku, nome, exclusivo_profissional, ativo, preco_cheio')
      .order('sku')
      .range(inicio, inicio + 999)
    if (error) {
      const dica =
        error.code === '42703' || error.code === 'PGRST204'
          ? ' (a migração 0005 foi colada neste banco?)'
          : ''
      throw new Error(`Falha ao ler produtos (${error.code})${dica}`)
    }
    todos.push(...(data as ProdutoDoBanco[]))
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
      'Salve o arquivo em database/seeds/dados/precos-exclusivos.csv (essa pasta',
    )
    mostrar('fica fora do git) com as colunas sku e preco_cheio, como em')
    mostrar('database/seeds/precos-exclusivos.exemplo.csv, ou indique outro')
    mostrar('caminho com --arquivo=.')
    return 1
  }

  const produtos = await lerProdutos()
  const { linhas, problemas } = lerPlanilhaDePrecosCheios(
    readFileSync(arquivo, 'utf8'),
    {
      todos: new Set(produtos.map((p) => p.sku)),
      exclusivos: new Set(
        produtos.filter((p) => p.exclusivo_profissional).map((p) => p.sku),
      ),
    },
  )

  if (problemas.length > 0) {
    mostrar('A planilha tem problemas e NADA foi gravado:')
    for (const problema of problemas) mostrar(`  - ${problema}`)
    return 1
  }

  const comparacao = compararPrecosCheios(linhas, produtos)
  const nomeDe = new Map(produtos.map((p) => [p.sku, p.nome]))
  const comPrecoNoBanco = produtos.filter((p) => p.preco_cheio !== null).length

  mostrar(
    `Planilha: ${linhas.length} exclusivos (${linhas.filter((l) => l.centavos !== null).length} com preço, ${linhas.filter((l) => l.centavos === null).length} vazios)`,
  )
  mostrar(`No banco agora: ${comPrecoNoBanco} produtos com preço cheio`)
  mostrar('')
  mostrar(
    `  novos (banco sem preço):                 ${comparacao.novos.length}`,
  )
  mostrar(
    `  alterados (valor diferente):             ${comparacao.alterados.length}`,
  )
  mostrar(`  iguais:                                  ${comparacao.iguais}`)
  mostrar(
    `  sem preço (planilha vazia, banco vazio): ${comparacao.semPreco.length}`,
  )
  mostrar(
    `  planilha vazia, mas o banco tem preço:   ${comparacao.vaziosComPrecoNoBanco.length}`,
  )
  mostrar('')
  listar('Novos', comparacao.novos)
  listar('Alterados (o valor mudou)', comparacao.alterados)
  listar(
    'Planilha vazia, mas o banco tem preço (a carga NUNCA apaga, o preço fica)',
    comparacao.vaziosComPrecoNoBanco,
  )
  listar(
    'SEM preço depois da carga (o produto não pode ser vendido)',
    comparacao.semPreco.map((sku) => `${sku} | ${nomeDe.get(sku) ?? ''}`),
  )

  if (!aplicar) {
    mostrar('')
    mostrar('SIMULAÇÃO: nada foi gravado.')
    mostrar('Para gravar: npm run seed:precos-cheios -- --aplicar')
    return 0
  }

  // ---- grava ----------------------------------------------------------------
  // Só os que mudaram (novos e alterados), um a um: são poucos e cada update
  // leva só o preço do sku. `ativo` e os demais campos nunca entram.
  const mudaram = new Set([...comparacao.novos, ...comparacao.alterados])
  for (const { sku, centavos } of linhas) {
    if (centavos === null || !mudaram.has(sku)) continue
    const { error } = await supabaseAdmin
      .from('produtos')
      .update({ preco_cheio: centavosParaNumeric(centavos) })
      .eq('sku', sku)
    if (error) throw new Error(`Falha ao gravar um preço (${error.code})`)
  }

  const depois = compararPrecosCheios(linhas, await lerProdutos())
  const sobrou = depois.novos.length + depois.alterados.length
  mostrar('')
  mostrar(
    sobrou === 0
      ? `GRAVADO e conferido: ${comparacao.novos.length} novos, ${comparacao.alterados.length} atualizados, banco igual à planilha.`
      : `ATENÇÃO: depois da carga ainda há ${sobrou} diferença(s). Rode a simulação para ver quais.`,
  )
  return sobrou === 0 ? 0 : 1
}

process.exitCode = await executar()
