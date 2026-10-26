// Carga do catálogo no banco (passo 10 do plano), a partir de
// frontend/src/data/tulipia-produtos.json.
//
// Uso, dentro de backend/:
//   npm run seed:produtos                    simulação: só mostra o que faria
//   npm run seed:produtos -- --aplicar       grava de verdade
//   npm run seed:produtos -- --aplicar --desativar-ausentes
//
// A carga é idempotente (rodar de novo não duplica) e NUNCA apaga produto. Em
// produto que já existe, mexe só em nome, tamanho, preço e exclusivo: `ativo` é
// decisão de quem administra e não é desfeito aqui. Não toca em
// precos_profissionais (ver 0002_precos_profissionais.ts). Nenhuma chave é
// impressa.
import { readFileSync } from 'node:fs'
import { supabaseAdmin } from '../../backend/src/lib/supabase.js'
import {
  compararCatalogo,
  lerCatalogo,
  type ProdutoNoBanco,
} from './lib/catalogo.js'

const aplicar = process.argv.includes('--aplicar')
const desativarAusentes = process.argv.includes('--desativar-ausentes')
const TAMANHO_DO_LOTE = 100
const COLUNAS = 'sku, nome, tamanho, preco, exclusivo_profissional, ativo'

function mostrar(texto = '') {
  console.log(texto)
}

async function lerProdutosDoBanco(): Promise<ProdutoNoBanco[]> {
  const todos: ProdutoNoBanco[] = []
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select(COLUNAS)
      .order('sku')
      .range(inicio, inicio + 999)
    if (error) {
      const dica =
        error.code === 'PGRST205'
          ? ' (a migração 0002 foi colada neste banco?)'
          : ''
      throw new Error(`Falha ao ler produtos (${error.code})${dica}`)
    }
    todos.push(...(data as ProdutoNoBanco[]))
    if (data.length < 1000) break
  }
  return todos
}

function listar(titulo: string, itens: string[], limite = 15) {
  if (itens.length === 0) return
  mostrar(`${titulo}:`)
  for (const item of itens.slice(0, limite)) mostrar(`  - ${item}`)
  if (itens.length > limite) mostrar(`  ... e mais ${itens.length - limite}`)
}

// O código de saída é devolvido (e não usado process.exit): no Windows, sair
// com a rede ainda fechando derruba o Node com um erro do libuv.
async function executar(): Promise<number> {
  const caminhoDoJson = new URL(
    '../../frontend/src/data/tulipia-produtos.json',
    import.meta.url,
  )
  const { produtos, problemas, arredondados } = lerCatalogo(
    JSON.parse(readFileSync(caminhoDoJson, 'utf8')),
  )

  if (problemas.length > 0) {
    mostrar('O catálogo tem problemas e NADA foi gravado:')
    for (const problema of problemas) mostrar(`  - ${problema}`)
    return 1
  }

  const noBanco = await lerProdutosDoBanco()
  const comparacao = compararCatalogo(produtos, noBanco)

  mostrar(`Catálogo do JSON: ${produtos.length} produtos`)
  mostrar(`No banco agora:   ${noBanco.length} produtos`)
  mostrar('')
  mostrar(`  novos:                         ${comparacao.novos.length}`)
  mostrar(`  alterados:                     ${comparacao.alterados.length}`)
  mostrar(`  iguais:                        ${comparacao.iguais}`)
  mostrar(`  no banco e fora do JSON:       ${comparacao.ausentes.length}`)
  mostrar(`  preços arredondados (2 casas): ${arredondados.length}`)
  mostrar('')
  listar(
    'Novos',
    comparacao.novos.map((p) => p.sku),
    10,
  )
  listar(
    'Alterados',
    comparacao.alterados.map((a) => `${a.sku} (${a.campos.join(', ')})`),
  )
  listar(
    'No banco e fora do JSON (a carga nunca apaga)',
    comparacao.ausentes.map((p) => `${p.sku}${p.ativo ? '' : ' (já inativo)'}`),
  )
  listar(
    'Preços arredondados',
    arredondados.map((a) => `${a.sku}: ${a.de} vira ${a.para}`),
  )

  if (!aplicar) {
    mostrar('')
    mostrar('SIMULAÇÃO: nada foi gravado.')
    mostrar('Para gravar: npm run seed:produtos -- --aplicar')
    return 0
  }

  // ---- grava ----------------------------------------------------------------

  for (let i = 0; i < comparacao.novos.length; i += TAMANHO_DO_LOTE) {
    const lote = comparacao.novos.slice(i, i + TAMANHO_DO_LOTE)
    const { error } = await supabaseAdmin.from('produtos').insert(lote)
    if (error) throw new Error(`Falha ao inserir produtos (${error.code})`)
  }

  for (const { sku, campos, novo } of comparacao.alterados) {
    // Só os campos que mudaram; `ativo` nunca entra
    const alteracao = Object.fromEntries(
      campos.map((campo) => [campo, novo[campo]]),
    )
    const { error } = await supabaseAdmin
      .from('produtos')
      .update(alteracao)
      .eq('sku', sku)
    if (error) throw new Error(`Falha ao atualizar um produto (${error.code})`)
  }

  if (desativarAusentes) {
    const paraDesativar = comparacao.ausentes
      .filter((p) => p.ativo)
      .map((p) => p.sku)
    if (paraDesativar.length > 0) {
      const { error } = await supabaseAdmin
        .from('produtos')
        .update({ ativo: false })
        .in('sku', paraDesativar)
      if (error) throw new Error(`Falha ao desativar produtos (${error.code})`)
      mostrar(`Desativados (ativo = false): ${paraDesativar.length}`)
    }
  }

  // Confere o resultado relendo o banco: depois da carga não pode sobrar diferença
  const depois = compararCatalogo(produtos, await lerProdutosDoBanco())
  const sobrou = depois.novos.length + depois.alterados.length
  mostrar('')
  mostrar(
    sobrou === 0
      ? `GRAVADO e conferido: ${comparacao.novos.length} novos, ${comparacao.alterados.length} atualizados, banco igual ao JSON.`
      : `ATENÇÃO: depois da carga ainda há ${sobrou} diferença(s). Rode a simulação para ver quais.`,
  )
  return sobrou === 0 ? 0 : 1
}

process.exitCode = await executar()
