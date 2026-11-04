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
// - Fotos: basta colocar o arquivo em src/assets/descartaveis/ com o SLUG do
//   produto no nome (ex: luva-de-vinil-sem-po-vabene.webp) e rodar o importador.
//   O slug é o nome do produto, mais a marca quando ela está confirmada
//   (slug do nome + "-" + slug da marca). Se a marca for confirmada depois, o
//   arquivo só com o nome continua valendo, desde que o nome seja único na
//   lista. A pasta é a fonte da verdade: o campo `imagem` do JSON guarda o nome
//   do arquivo e é refeito a cada execução.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
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

// Produtos que mudaram de NOME no CSV (antigo -> novo). Os sku já gravados são
// ligados pelo nome, então sem esta lista o renome criaria sku novos e o
// antigo sumiria. Com ela o sku continua o mesmo. Pode ficar aqui para sempre.
const RENOMEADOS = {
  'Luva Vinilflex Sem Pó': 'Luva Viniflex Sem Pó', // grafia da marca
}
const nomeAtual = (nome) => RENOMEADOS[nome] ?? nome

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
    nome: nomeAtual(p.nome),
    marca: p.marca ?? '',
    variacao: v.rotulo ?? '',
    sku: v.sku,
  })),
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
    variacoes,
  }
  produtos.push(produto)
}

// ---- fotos --------------------------------------------------------------------
// Liga os arquivos de src/assets/descartaveis/ aos produtos pelo NOME do arquivo
// (sem a extensão), que é o slug do produto: "nome-marca", ou só "nome" quando
// o produto não tem marca confirmada ou o arquivo não a traz (e o nome é único
// na lista; senão a foto iria para produtos diferentes, como as 3 águas
// sanitárias de 5 L). Dois formatos:
//   slug-do-produto.webp             uma foto para o produto inteiro
//   slug-do-produto-<variação>.webp  uma foto por variação (ex: ...-vabene-m.webp)
// Um produto pode ter os dois. O site troca a foto conforme a variação escolhida.
// Exceção: uma foto que serve a mais de um produto (um arquivo só tem um nome,
// então a regra do slug não dá conta). A ligação é feita à mão aqui: arquivo ->
// nomes dos produtos. O importador avisa se o arquivo ou o produto não existir.
const FOTOS_COMPARTILHADAS = {
  'mascara-e-touca-tnt.webp': [
    'Máscara de TNT Tripla Branca com Elástico',
    'Touca de TNT Branca Sanfonada',
  ],
  'lencol-hospitalar-rolo.webp': [
    'Lençol Hospitalar 50x50',
    'Lençol Hospitalar 70x50',
  ],
}
const PASTA_DAS_FOTOS = resolve(raiz, 'src', 'assets', 'descartaveis')
const EXTENSAO_DE_FOTO = /\.(webp|jpe?g|png)$/i
const arquivosDeFoto = existsSync(PASTA_DAS_FOTOS)
  ? readdirSync(PASTA_DAS_FOTOS)
      .filter((a) => EXTENSAO_DE_FOTO.test(a))
      .sort()
  : []
const arquivoPorSlug = new Map()
const avisosDeFoto = []
for (const arquivo of arquivosDeFoto) {
  const base = arquivo.replace(EXTENSAO_DE_FOTO, '')
  if (arquivoPorSlug.has(base)) {
    avisosDeFoto.push(
      `${arquivo}: já existe ${arquivoPorSlug.get(base)} para o mesmo produto (usei o primeiro)`,
    )
  } else arquivoPorSlug.set(base, arquivo)
}
const produtosPorNome = new Map()
for (const p of produtos) {
  produtosPorNome.set(p.nome, (produtosPorNome.get(p.nome) ?? 0) + 1)
}
for (const [arquivo, nomes] of Object.entries(FOTOS_COMPARTILHADAS)) {
  if (!arquivosDeFoto.includes(arquivo)) {
    avisosDeFoto.push(`${arquivo}: foto compartilhada que não está na pasta`)
  }
  for (const nome of nomes) {
    if (!produtosPorNome.has(nome)) {
      avisosDeFoto.push(`${arquivo}: o produto "${nome}" não existe na lista`)
    }
  }
}
const fotoCompartilhadaDe = (nome) =>
  Object.entries(FOTOS_COMPARTILHADAS).find(
    ([arquivo, nomes]) =>
      nomes.includes(nome) && arquivosDeFoto.includes(arquivo),
  )?.[0] ?? null
const arquivosLigados = new Set()
const comFoto = produtos.map((p) => {
  const bases = [
    p.marca ? `${slug(p.nome)}-${slug(p.marca)}` : null,
    produtosPorNome.get(p.nome) === 1 ? slug(p.nome) : null,
  ].filter(Boolean)
  const arquivoDe = (sufixo) => {
    for (const base of bases) {
      const chave = sufixo ? `${base}-${slug(sufixo)}` : base
      if (arquivoPorSlug.has(chave)) return arquivoPorSlug.get(chave)
    }
    return null
  }
  const fotoDoProduto = arquivoDe(null) ?? fotoCompartilhadaDe(p.nome)
  if (fotoDoProduto) arquivosLigados.add(fotoDoProduto)
  const variacoes = p.variacoes.map((v) => {
    const foto = v.rotulo ? arquivoDe(v.rotulo) : null
    if (!foto) return v
    arquivosLigados.add(foto)
    return { sku: v.sku, rotulo: v.rotulo, imagem: foto, preco: v.preco }
  })
  const { variacoes: _antigas, ...resto } = p
  return {
    ...resto,
    ...(fotoDoProduto ? { imagem: fotoDoProduto } : {}),
    variacoes,
  }
})
for (const arquivo of arquivoPorSlug.values()) {
  if (!arquivosLigados.has(arquivo)) {
    avisosDeFoto.push(
      `${arquivo}: nenhum produto ou variação tem esse slug, a foto NÃO foi ligada`,
    )
  }
}
produtos.splice(0, produtos.length, ...comFoto)

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
const ligadas = produtos.filter(
  (p) => p.imagem || p.variacoes.some((v) => v.imagem),
)
console.log(`\nProdutos com foto: ${ligadas.length} de ${produtos.length}`)
for (const p of ligadas) {
  console.log(`  - ${p.nome}${p.marca ? ` (${p.marca})` : ''}`)
  if (p.imagem) console.log(`      produto: ${p.imagem}`)
  for (const v of p.variacoes) {
    if (v.imagem) console.log(`      ${v.rotulo}: ${v.imagem}`)
  }
}
for (const aviso of avisosDeFoto) console.log(`ATENÇÃO (foto): ${aviso}`)
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
