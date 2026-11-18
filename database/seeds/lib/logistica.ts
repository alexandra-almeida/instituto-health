// Lógica PURA (sem rede) da carga da logística dos produtos (tabela
// produtos_logistica, migração 0007): peso ESTIMADO pelo tamanho, quais produtos
// são líquidos, a planilha que a Bia preenche com os pesos reais e a comparação
// com o que já está no banco. Os pesos estimados são provisórios: nenhum valor
// aqui é medida de verdade até a Bia pesar. Ver "Frete (Melhor Envio)" no plano.

// Líquidos descartáveis: todo líquido leva embalagem vedada (decisão de
// 18/11/2026). `liquido` só avisa a Bia; NÃO restringe a venda.
export const SKUS_LIQUIDOS: ReadonlySet<string> = new Set([
  'desc-sabonete-liquido-5-l-erva-doce-28',
  'desc-sabonete-liquido-5-l-frutas-vermelhas-29',
  'desc-sabonete-liquido-5-l-pistache-30',
  'desc-sabonete-liquido-500-ml-com-pump-ameixa-dourada-31',
  'desc-cloro-gel-5-l-32',
  'desc-desinfetante-2-l-33',
  'desc-desinfetante-5-l-algas-34',
  'desc-limpador-perfumado-120-ml-35',
  'desc-agua-sanitaria-5-l-gopabo-38',
  'desc-agua-sanitaria-5-l-harcclin-39',
  'desc-agua-sanitaria-5-l-triex-40',
  'desc-agua-sanitaria-2-l-41',
  'desc-agua-sanitaria-1-l-42',
])

// Quantos itens tem cada kit Tulípia (o campo `tamanho` só diz "kit"). Vem do
// nome do kit no site da Tulípia ("2 itens", "5 produtos"), conferido em
// 18/11/2026; o kit que o site não pareou (Kit Sweet Lips Cereja) usa o mesmo
// número do Tutti Frutti.
export const ITENS_DOS_KITS: Readonly<Record<string, number>> = {
  'kit-esteticista-para-limpeza-de-pele-kit-63': 6,
  'rotina-vitamina-c-sabonete-e-serum-kit-64': 2,
  'rotina-pele-oleosa-serum-e-espuma-de-limpeza-kit-65': 2,
  'combo-sweet-lips-tutti-frutti-kit-66': 2,
  'combo-sweet-lips-cereja-kit-67': 2,
  'rotina-proskin-ultra-reparadora-kit-com-creme-fortalecedor-de-barreira-kit-68': 3,
  'kit-sweet-lips-tutti-frutti-kit-69': 3,
  'combo-sweet-lips-chocolate-kit-70': 2,
  'rotina-pos-peeling-e-microagulhamento-kit-71': 3,
  'rotina-reducao-de-poros-espuma-de-limpeza-e-pad-multifuncional-kit-72': 2,
  'kit-4-estacoes-profissional-kit-73': 4,
  'rotina-proskin-ultra-hidratante-kit-com-milk-bionutritivo-kit-74': 3,
  'kit-sweet-lips-cereja-kit-75': 3,
  'kit-peeling-premium-black-secret-kit-76': 4,
  'combo-dermacos-duo-home-care-rejuvenescedor-kit-77': 2,
  'stellar-masks-kit-completo-kit-78': 4,
  'rotina-pele-seca-ou-desidratada-sabonete-locao-tonica-e-pomada-kit-79': 3,
  'rotina-pele-mista-serum-e-sabonete-kit-80': 2,
  'kit-drenagem-para-tecnicas-de-massagem-corporal-kit-81': 2,
  'combo-hialux-serum-e-sabonete-kit-82': 2,
  'rotina-antiacne-fps-cuidados-para-peles-acneicas-kit-3-itens-83': 3,
  'kit-drenagem-facial-para-tecnicas-de-massagem-kit-84': 2,
  'protocolo-antiacne-profissional-kit-protocolo-peeling-antiacne-kit-85': 3,
  'rotina-skincare-essencial-sabonete-serum-e-fotoprotetor-kit-86': 3,
  'kit-sweet-lips-profissional-chocolate-kit-87': 3,
  'rotina-anti-idade-espuma-de-limpeza-e-creme-com-pdrn-kit-88': 2,
  'kit-flaciall-tecnica-corporal-by-ana-julia-graf-kit-89': 5,
  'kit-life-c-profissional-kit-90': 5,
  'kit-citropeel-peeling-soft-kit-91': 3,
  'kit-pre-peeling-black-secret-kit-92': 2,
  'kit-seruns-premium-kit-93': 3,
  'rotina-clareadora-espuma-tonico-e-serum-life-c-kit-94': 3,
  'combo-dermocosmeticos-para-olhos-home-care-kit-95': 2,
  'kit-rejuvenescimento-intimo-by-ana-julia-graf-kit-96': 4,
  'kit-capilar-profissional-nano-plasma-e-tonico-capilar-kit-97': 2,
  'kit-hialux-serum-sabonete-e-creme-kit-98': 3,
  'kit-linha-dermo-estetic-para-limpeza-de-pele-kit-148': 6,
}

const GRAMAS_POR_ITEM_DE_KIT = 230
const ITENS_PADRAO_DE_KIT = 3
export const PESO_MINIMO_G = 1
export const PESO_MAXIMO_G = 30000

const numero = (texto: string) => Number(texto.replace(',', '.'))

// tara do frasco ou pote, em gramas, pela quantidade de conteúdo
function taraDoFrasco(conteudo: number, potes1kg: boolean): number {
  if (potes1kg) return 120
  if (conteudo <= 60) return 35
  if (conteudo <= 150) return 50
  if (conteudo <= 300) return 70
  return 100
}

// Peso estimado de um produto TULÍPIA pelo campo `tamanho` (em gramas, inteiro)
export function pesoEstimadoDaTulipia(sku: string, tamanho: string): number {
  const t = tamanho.trim().toLowerCase()

  if (/^kit|^combo/.test(t)) {
    const itens = ITENS_DOS_KITS[sku] ?? ITENS_PADRAO_DE_KIT
    return itens * GRAMAS_POR_ITEM_DE_KIT
  }

  // "5 ampolas de 4ml", "3 ampolas de 5ml", "4ml - 5 ampolas"
  let m = /(\d+)\s*ampolas?\s*de\s*(\d+(?:[.,]\d+)?)\s*ml/.exec(t)
  if (m) {
    return Math.round(Number(m[1]) * (numero(m[2]!) * 1.1 + 6) + 60)
  }
  m = /(\d+(?:[.,]\d+)?)\s*ml\s*-\s*(\d+)\s*ampolas?/.exec(t)
  if (m) {
    return Math.round(Number(m[2]) * (numero(m[1]!) * 1.1 + 6) + 60)
  }

  // "3 sachês"
  m = /(\d+)\s*sach/.exec(t)
  if (m) return Number(m[1]) * 30

  // "1 un" (faixas de cabelo e acessórios)
  if (/^\d+\s*un$/.test(t)) return 40

  // "30g cada": duas fases do peeling
  m = /^(\d+(?:[.,]\d+)?)\s*g\s*cada$/.exec(t)
  if (m) return Math.round(2 * numero(m[1]!) + 60)

  // "1kg"
  m = /^(\d+(?:[.,]\d+)?)\s*kg$/.exec(t)
  if (m) {
    const g = numero(m[1]!) * 1000
    return Math.round(g * 1.12 + taraDoFrasco(g, true))
  }

  // "50ml", "150g"
  m = /^(\d+(?:[.,]\d+)?)\s*(ml|g)$/.exec(t)
  if (m) {
    const conteudo = numero(m[1]!)
    return Math.round(conteudo * 1.12 + taraDoFrasco(conteudo, false))
  }

  // tamanho que não reconhecemos: um peso médio, para a cotação nunca travar. A
  // simulação do seed lista estes casos para conferir.
  return 200
}

// Peso por unidade, em gramas, de itens vendidos em pacote "com N" (palavras do
// nome do produto)
const GRAMAS_POR_UNIDADE: Array<[RegExp, number]> = [
  [/abaixador/, 1.5],
  [/m[aá]scara/, 5],
  [/touca/, 3],
  [/len[cç]ol de maca/, 60],
  [/copo.*180/, 2.2],
  [/copo/, 1],
  [/filtro de caf/, 3],
  [/saco de lixo 20/, 3],
  [/saco de lixo 100/, 12],
]

// Peso estimado de um DESCARTÁVEL pelo nome e pela embalagem (o `tamanho` do
// banco é "variação - embalagem")
export function pesoEstimadoDoDescartavel(
  nome: string,
  tamanho: string,
): number {
  const n = nome.toLowerCase()
  const t = tamanho.toLowerCase()

  let m = /gal[aã]o\s*(\d+(?:[.,]\d+)?)\s*l/.exec(t)
  if (m) return Math.round(numero(m[1]!) * 1000 * 1.04 + 100)
  m = /frasco\s*(\d+(?:[.,]\d+)?)\s*l/.exec(t)
  if (m) return Math.round(numero(m[1]!) * 1000 * 1.04 + 80)
  m = /frasco\s*(\d+(?:[.,]\d+)?)\s*ml/.exec(t)
  if (m) return Math.round(numero(m[1]!) * 1.04 + 60)
  m = /(?:sach[eê]|caixa)\s*(\d+(?:[.,]\d+)?)\s*g\b/.exec(t)
  if (m) return Math.round(numero(m[1]!) + 40)
  m = /pacote\s*(\d+(?:[.,]\d+)?)\s*kg/.exec(t)
  if (m) return Math.round(numero(m[1]!) * 1000 + 50)
  m = /bobina aprox\.?\s*(\d+(?:[.,]\d+)?)\s*kg/.exec(t)
  if (m) return Math.round(numero(m[1]!) * 1000 + 100)
  m = /pacote com\s*(\d+)\s*folhas/.exec(t)
  if (m) return Math.round(Number(m[1]) * 2.2)
  m = /pacote com\s*(\d+)\s*rolos/.exec(t)
  if (m) return Math.round(Number(m[1]) * 70)
  if (/caixa com\s*\d+/.test(t) && /luva/.test(n)) return 450
  m = /pacote com\s*(\d+)/.exec(t)
  if (m) {
    const porUnidade = GRAMAS_POR_UNIDADE.find(([padrao]) => padrao.test(n))
    return Math.round(Number(m[1]) * (porUnidade?.[1] ?? 5))
  }

  // sem embalagem informada (lençóis hospitalares e sacos de lixo de 30 e 50 L)
  if (/saco de lixo 30/.test(n)) return 400
  if (/saco de lixo 50/.test(n)) return 700
  if (/len[cç]ol hospitalar/.test(n)) return 400
  return 500
}

export interface ProdutoParaEstimar {
  sku: string
  nome: string
  tamanho: string
}

export function pesoEstimado(produto: ProdutoParaEstimar): number {
  const g = produto.sku.startsWith('desc-')
    ? pesoEstimadoDoDescartavel(produto.nome, produto.tamanho)
    : pesoEstimadoDaTulipia(produto.sku, produto.tamanho)
  return Math.min(PESO_MAXIMO_G, Math.max(PESO_MINIMO_G, g))
}

// ---------------------------------------------------------------------------
// Planilha da Bia (docs/frete-medidas.csv)
// ---------------------------------------------------------------------------

export interface CaixaDaPlanilha {
  nome: string
  comprimentoCm: number
  larguraCm: number
  alturaCm: number
  pesoVaziaG: number
  capacidadeMaxG: number
}

export const CABECALHO_DA_PLANILHA = [
  'tipo',
  'codigo',
  'nome',
  'tamanho',
  'liquido',
  'peso_estimado_g',
  'peso_real_g',
  'comprimento_cm',
  'largura_cm',
  'altura_cm',
  'capacidade_max_g',
  'observacao',
].join(';')

const campo = (valor: string | number) =>
  String(valor).replace(/[;\r\n]+/g, ' ')

// Duas partes no mesmo arquivo: as caixas (tipo "caixa") e os produtos (tipo
// "produto"). A Bia corrige a coluna peso_real_g dos produtos e as medidas das
// caixas; o que estiver vazio continua valendo a estimativa.
export function gerarPlanilha(
  produtos: ProdutoParaEstimar[],
  caixas: CaixaDaPlanilha[],
): string {
  const linhas = [CABECALHO_DA_PLANILHA]
  for (const c of caixas) {
    linhas.push(
      [
        'caixa',
        campo(c.nome),
        campo(`Caixa ${c.nome}`),
        '',
        '',
        campo(c.pesoVaziaG),
        '',
        campo(c.comprimentoCm),
        campo(c.larguraCm),
        campo(c.alturaCm),
        campo(c.capacidadeMaxG),
        'Medidas PROVISÓRIAS: confira com uma fita e pese a caixa vazia (peso_real_g)',
      ].join(';'),
    )
  }
  for (const p of [...produtos].sort((a, b) => a.sku.localeCompare(b.sku))) {
    linhas.push(
      [
        'produto',
        campo(p.sku),
        campo(p.nome),
        campo(p.tamanho),
        SKUS_LIQUIDOS.has(p.sku) ? 'sim' : '',
        pesoEstimado(p),
        '',
        '',
        '',
        '',
        '',
        '',
      ].join(';'),
    )
  }
  return `${linhas.join('\r\n')}\r\n`
}

export interface PlanilhaLida {
  /** sku -> peso REAL em gramas (só os que a Bia preencheu) */
  pesosReais: Map<string, number>
  problemas: string[]
}

// Aceita "350", "350,5" e "1.250" (milhar com ponto) em gramas; recusa zero,
// negativo, texto e o que passa de 30 kg
export function converterPesoEmGramas(bruto: string): number | null {
  let texto = bruto.replace(/\s|g$/gi, '')
  if (texto === '') return null
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) texto = texto.replace(/\./g, '')
  if (!/^\d+(\.\d+)?$/.test(texto)) return null
  const g = Math.round(Number(texto))
  return g >= PESO_MINIMO_G && g <= PESO_MAXIMO_G ? g : null
}

// Lê a planilha de volta (só as linhas tipo "produto" com peso_real_g
// preenchido). sku desconhecido ou peso inválido é problema: quem chama NÃO
// deve gravar nada se houver problemas.
export function lerPlanilhaDeMedidas(
  texto: string,
  skusConhecidos: ReadonlySet<string>,
): PlanilhaLida {
  const problemas: string[] = []
  const pesosReais = new Map<string, number>()
  const registros = texto
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((linha, indice) => ({ linha, numero: indice + 1 }))
    .filter(({ linha }) => linha.trim() !== '')
  const cabecalho = registros[0]
  if (!cabecalho) return { pesosReais, problemas: ['A planilha está vazia.'] }

  const nomes = cabecalho.linha.split(';').map((n) => n.trim().toLowerCase())
  const iTipo = nomes.indexOf('tipo')
  const iCodigo = nomes.indexOf('codigo')
  const iReal = nomes.indexOf('peso_real_g')
  if (iTipo === -1 || iCodigo === -1 || iReal === -1) {
    return {
      pesosReais,
      problemas: ['O cabeçalho precisa ter tipo, codigo e peso_real_g.'],
    }
  }
  const vistos = new Set<string>()
  for (const { linha, numero: n } of registros.slice(1)) {
    const campos = linha.split(';').map((c) => c.trim())
    if (campos.length !== nomes.length) {
      problemas.push(
        `linha ${n}: ${campos.length} colunas em vez de ${nomes.length}.`,
      )
      continue
    }
    if (campos[iTipo] !== 'produto') continue
    const sku = campos[iCodigo] ?? ''
    if (!skusConhecidos.has(sku)) {
      problemas.push(`linha ${n}: o sku "${sku}" não existe em produtos.`)
      continue
    }
    if (vistos.has(sku)) {
      problemas.push(`linha ${n}: o sku "${sku}" aparece mais de uma vez.`)
      continue
    }
    vistos.add(sku)
    const bruto = campos[iReal] ?? ''
    if (bruto === '') continue
    const g = converterPesoEmGramas(bruto)
    if (g === null) {
      problemas.push(
        `linha ${n}: peso_real_g inválido para o sku "${sku}" (use gramas, de 1 a ${PESO_MAXIMO_G}).`,
      )
      continue
    }
    pesosReais.set(sku, g)
  }
  return { pesosReais, problemas }
}

// ---------------------------------------------------------------------------
// Comparação com o banco
// ---------------------------------------------------------------------------

export interface LogisticaDesejada {
  sku: string
  pesoG: number
  origemDoPeso: 'estimado' | 'medido'
  liquido: boolean
}

export interface LogisticaNoBanco {
  sku: string
  peso_g: number
  origem_do_peso: 'estimado' | 'medido'
  liquido: boolean
  so_retirada: boolean
}

export type CampoDaLogistica = 'peso_g' | 'origem_do_peso' | 'liquido'

export interface ResultadoDaComparacaoDeLogistica {
  novos: LogisticaDesejada[]
  alterados: Array<{
    sku: string
    campos: CampoDaLogistica[]
    novo: LogisticaDesejada
  }>
  iguais: number
  /** o banco tem peso medido e a planilha não: o peso medido FICA (nunca vira estimado) */
  medidosPreservados: string[]
}

// Monta o que o seed quer gravar: o peso real da planilha vira `medido`; sem peso
// real vale a estimativa. `so_retirada` fica FORA de propósito: nasce false (o
// padrão do banco) e a carga nunca mexe nele depois, para não desfazer a válvula
// se alguém a ligar à mão.
export function desejarLogistica(
  produtos: ProdutoParaEstimar[],
  pesosReais: ReadonlyMap<string, number>,
): LogisticaDesejada[] {
  return produtos.map((p) => {
    const real = pesosReais.get(p.sku)
    return {
      sku: p.sku,
      pesoG: real ?? pesoEstimado(p),
      origemDoPeso: real === undefined ? 'estimado' : 'medido',
      liquido: SKUS_LIQUIDOS.has(p.sku),
    }
  })
}

export function compararLogistica(
  desejado: LogisticaDesejada[],
  noBanco: LogisticaNoBanco[],
): ResultadoDaComparacaoDeLogistica {
  const porSku = new Map(noBanco.map((l) => [l.sku, l]))
  const resultado: ResultadoDaComparacaoDeLogistica = {
    novos: [],
    alterados: [],
    iguais: 0,
    medidosPreservados: [],
  }
  for (const d of desejado) {
    const atual = porSku.get(d.sku)
    if (!atual) {
      resultado.novos.push(d)
      continue
    }
    // Peso medido nunca é sobrescrito por estimativa
    const preserva =
      atual.origem_do_peso === 'medido' && d.origemDoPeso === 'estimado'
    const alvo: LogisticaDesejada = preserva
      ? { ...d, pesoG: atual.peso_g, origemDoPeso: 'medido' }
      : d
    if (preserva) resultado.medidosPreservados.push(d.sku)
    const campos: CampoDaLogistica[] = []
    if (atual.peso_g !== alvo.pesoG) campos.push('peso_g')
    if (atual.origem_do_peso !== alvo.origemDoPeso)
      campos.push('origem_do_peso')
    if (atual.liquido !== alvo.liquido) campos.push('liquido')
    if (campos.length === 0) resultado.iguais++
    else resultado.alterados.push({ sku: d.sku, campos, novo: alvo })
  }
  return resultado
}
