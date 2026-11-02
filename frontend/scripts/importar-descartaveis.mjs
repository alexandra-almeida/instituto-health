// Converte docs/descartaveis-lista-juliana.csv em src/data/descartaveis.json
// (a lista dos descartáveis para clínicas, separada do catálogo da Tulípia).
// Roda À MÃO: `npm run descartaveis` dentro de frontend/. Não faz parte do build.
//
// Regras:
// - Linhas com o mesmo nome E a mesma marca viram um produto só, com as
//   variações (tamanho das luvas, fragrância dos sabonetes).
// - Cada variação tem um sku fixo: `desc-...-N`. O prefixo `desc-` evita
//   colisão com os sku da Tulípia. Um sku já gravado NUNCA muda (CLAUDE.md):
//   ao rodar de novo, as linhas que já existem mantêm o sku e as novas ganham
//   o próximo número livre, no fim da lista.
// - "A CONFIRMAR" nunca vai para o JSON: marca e embalagem ficam nulas e o site
//   mostra só o que está confirmado. As pendências saem na tela, para a Juliana.
// - O campo `imagem` (opcional, escrito à mão no JSON) é preservado.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ARQUIVO_CSV = resolve(
  raiz,
  '..',
  'docs',
  'descartaveis-lista-juliana.csv',
)
const ARQUIVO_JSON = resolve(raiz, 'src', 'data', 'descartaveis.json')

const slug = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const pendente = (texto) => /a confirmar/i.test(texto)

// CSV com ";" e aspas duplas opcionais, como a Juliana enviou (UTF-8 com BOM)
function lerCsv(texto) {
  const linhas = []
  let campo = ''
  let linha = []
  let entreAspas = false
  const t = texto.replace(/^﻿/, '')
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (entreAspas) {
      if (c === '"' && t[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') entreAspas = false
      else campo += c
    } else if (c === '"') entreAspas = true
    else if (c === ';') {
      linha.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      linha.push(campo)
      campo = ''
      if (linha.some((x) => x.trim() !== '')) linhas.push(linha)
      linha = []
    } else campo += c
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo)
    if (linha.some((x) => x.trim() !== '')) linhas.push(linha)
  }
  const [cabecalho, ...corpo] = linhas
  const nomes = cabecalho.map((n) => n.trim())
  return corpo.map((valores) =>
    Object.fromEntries(nomes.map((n, i) => [n, (valores[i] ?? '').trim()])),
  )
}

const linhasCsv = lerCsv(readFileSync(ARQUIVO_CSV, 'utf8')).map((r, i) => {
  const preco = Number(r.preco.replace(/\./g, '').replace(',', '.'))
  if (!r.nome || !Number.isFinite(preco) || preco <= 0) {
    throw new Error(`Linha ${i + 2} do CSV com nome ou preço inválido.`)
  }
  return { ...r, preco, linha: i + 2 }
})

// ---- sku já gravados ---------------------------------------------------------
const anterior = existsSync(ARQUIVO_JSON)
  ? JSON.parse(readFileSync(ARQUIVO_JSON, 'utf8'))
  : { produtos: [] }
const existentes = anterior.produtos.flatMap((p) =>
  p.variacoes.map((v) => ({
    nome: p.nome,
    marca: p.marca ?? '',
    variacao: v.rotulo ?? '',
    sku: v.sku,
  })),
)
const imagemPorNome = new Map(
  anterior.produtos.filter((p) => p.imagem).map((p) => [p.nome, p.imagem]),
)
const usados = new Set()
let proximo =
  existentes.reduce(
    (maior, e) => Math.max(maior, Number(e.sku.split('-').pop())),
    -1,
  ) + 1

const marcaDe = (r) => (pendente(r.marca) ? '' : r.marca)

// A marca pode ser confirmada depois: casa primeiro por nome + variação (se for
// único dos dois lados) e só usa a marca para desempatar (ex: água sanitária)
function acharSkuExistente(r) {
  const mesmoNomeVar = existentes.filter(
    (e) => e.nome === r.nome && e.variacao === r.variacao,
  )
  const linhasIguais = linhasCsv.filter(
    (x) => x.nome === r.nome && x.variacao === r.variacao,
  )
  let achado =
    mesmoNomeVar.length === 1 && linhasIguais.length === 1
      ? mesmoNomeVar[0]
      : mesmoNomeVar.find((e) => e.marca === marcaDe(r))
  if (achado && usados.has(achado.sku)) achado = undefined
  return achado?.sku
}

const nomesComVariasMarcas = new Set()
for (const r of linhasCsv) {
  const marcas = new Set(
    linhasCsv.filter((x) => x.nome === r.nome).map((x) => marcaDe(x)),
  )
  if (marcas.size > 1) nomesComVariasMarcas.add(r.nome)
}

// ---- agrupa e monta -----------------------------------------------------------
const grupos = new Map()
for (const r of linhasCsv) {
  const chave = `${r.nome}\u0000${r.marca}`
  if (!grupos.has(chave)) grupos.set(chave, [])
  grupos.get(chave).push(r)
}

const novos = []
const produtos = []
for (const linhas of grupos.values()) {
  const primeira = linhas[0]
  const marca = marcaDe(primeira) || null
  const embalagem = pendente(primeira.embalagem)
    ? null
    : primeira.embalagem || null
  const comVariacoes = linhas.length > 1
  const variacoes = linhas.map((r) => {
    let sku = acharSkuExistente(r)
    if (!sku) {
      const partes = [
        'desc',
        slug(r.nome),
        nomesComVariasMarcas.has(r.nome) && marca ? slug(marca) : '',
        r.variacao ? slug(r.variacao) : '',
      ].filter(Boolean)
      sku = `${partes.join('-')}-${proximo++}`
      novos.push(sku)
    }
    usados.add(sku)
    return { sku, rotulo: r.variacao || null, preco: r.preco }
  })
  const produto = {
    nome: primeira.nome,
    categoria: primeira.categoria,
    marca,
    embalagem,
    // O CSV não diz o que a variação é; nas luvas são tamanhos e no resto
    // (sabonete) são fragrâncias. Fica gravado para o site não precisar adivinhar.
    rotuloDaVariacao: comVariacoes
      ? primeira.categoria === 'Luvas'
        ? 'Tamanho'
        : 'Fragrância'
      : null,
    ...(imagemPorNome.get(primeira.nome)
      ? { imagem: imagemPorNome.get(primeira.nome) }
      : {}),
    variacoes,
  }
  produtos.push(produto)
}

const saida = {
  fonte:
    'docs/descartaveis-lista-juliana.csv (lista da Juliana). Gerado por frontend/scripts/importar-descartaveis.mjs. Os sku nunca mudam; novos entram no fim.',
  produtos,
}
writeFileSync(ARQUIVO_JSON, JSON.stringify(saida, null, 2) + '\n', 'utf8')

// ---- resumo e pendências ------------------------------------------------------
const total = produtos.reduce((soma, p) => soma + p.variacoes.length, 0)
console.log(
  `descartaveis.json: ${produtos.length} produtos, ${total} variações (${novos.length} sku novos).`,
)
const ausentes = existentes.filter((e) => !usados.has(e.sku))
if (ausentes.length > 0) {
  console.log(
    `ATENÇÃO: ${ausentes.length} sku do JSON antigo não estão mais no CSV e saíram do arquivo: ${ausentes
      .map((e) => e.sku)
      .join(', ')}`,
  )
}
const semMarca = produtos.filter((p) => !p.marca).map((p) => p.nome)
const semEmbalagem = produtos.filter((p) => !p.embalagem).map((p) => p.nome)
console.log(`\nMarca a confirmar (${semMarca.length}): ${semMarca.join('; ')}`)
console.log(
  `\nEmbalagem a confirmar (${semEmbalagem.length}): ${semEmbalagem.join('; ')}`,
)
const observacoes = linhasCsv.filter((r) => r.observacao)
if (observacoes.length > 0) {
  console.log('\nObservações do CSV:')
  for (const r of observacoes) {
    console.log(
      `  - ${r.nome}${r.variacao ? ` (${r.variacao})` : ''}: ${r.observacao}`,
    )
  }
}
