import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import bannerHeroMesCliente from '../assets/tulipia-banners/banner-hero-mes-cliente.webp'
import tulipiaRepresentante from '../assets/tulipia-brand/tulipia-representante.png'
import type { IconBadgeItem } from '../components/tulipia/IconBadgeCarousel'
import IconBadgeCarousel from '../components/tulipia/IconBadgeCarousel'
import LinhaDropdown from '../components/tulipia/LinhaDropdown'
import LineBanner from '../components/tulipia/LineBanner'
import ProductCard from '../components/tulipia/ProductCard'
import QueridinhosDestaque from '../components/tulipia/QueridinhosDestaque'
import SkinTypeGrid from '../components/tulipia/SkinTypeGrid'
import { SearchIcon } from '../components/icons'
import ScrollReveal from '../components/ScrollReveal'
import { useCart } from '../context/useCart'
import { getCategoryMeta } from '../data/categoryIconsLucide'
import { getCuidadoMeta } from '../data/cuidadoIconsLucide'
import type { SkinType } from '../data/skinTypes'
import { SKIN_TYPES } from '../data/skinTypes'
import { TULIPIA_LINE_BANNERS } from '../data/tulipiaLineBanners'
import {
  ALL_PRODUCTS,
  CATALOGO,
  CATEGORIAS,
  CUIDADOS,
  LINHAS,
  QUERIDINHOS,
  toCartInput,
} from '../data/tulipiaProducts'
import type { TulipiaProduct } from '../data/tulipiaProducts'
import { TULIPIA_VITRINE } from '../data/tulipiaVitrine'

type ViewMode = 'todos' | 'categoria' | 'linha' | 'cuidado'
type Audience = 'homecare' | 'profissional'

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  todos: 'Todos',
  categoria: 'Por Categoria',
  linha: 'Por Linha',
  cuidado: 'Por Cuidado',
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  homecare: 'Home Care',
  profissional: 'Profissional',
}

// Só os 2-3 primeiros Queridinhos viram destaque editorial grande — o
// restante (se houver) volta pro fluxo normal do grid, junto do catálogo,
// pra não sumir da página.
const EDITORIAL_QUERIDINHOS_COUNT = 3

// Filtro "livre" — ativado pela fileira de coleções (Mais Vendidos, Alta
// Tecnologia...), pelos cards de tipo de pele ou pelos banners de linha no
// topo da página. Quando ativo, tem prioridade sobre Todos/Categoria/Linha.
interface CustomFilter {
  key: string
  label: string
  match: (product: TulipiaProduct) => boolean
}

// "Você também pode gostar" — preenche a página quando um filtro deixa
// pouquíssimos produtos (1-3), pra nunca parecer vazia.
function pickAlsoLike(
  exclude: TulipiaProduct[],
  matchesAudience: (p: TulipiaProduct) => boolean,
  limit = 8,
): TulipiaProduct[] {
  const excludeIds = new Set(exclude.map((p) => p.id))
  const pool = [...QUERIDINHOS, ...CATALOGO]
  const result: TulipiaProduct[] = []
  const seen = new Set<string>()
  for (const product of pool) {
    if (seen.has(product.id) || excludeIds.has(product.id)) continue
    if (!matchesAudience(product)) continue
    seen.add(product.id)
    result.push(product)
    if (result.length >= limit) break
  }
  return result
}

function loadFavorites(): Set<string> {
  try {
    const raw = window.localStorage.getItem('tulipia-favoritos')
    if (!raw) return new Set()
    const ids = JSON.parse(raw) as string[]
    return new Set(ids)
  } catch {
    return new Set()
  }
}

function saveFavorites(favorites: Set<string>) {
  try {
    window.localStorage.setItem(
      'tulipia-favoritos',
      JSON.stringify([...favorites]),
    )
  } catch {
    // localStorage indisponível (ex: navegação privada) — favoritos ficam
    // só na sessão atual, sem quebrar a página.
  }
}

function Tulipia() {
  const { addItem } = useCart()
  // "Home Care" vem selecionada por padrão — é o público mais comum (compra
  // direta, com preço público). "Profissional" mostra também os itens
  // exclusivos (sem preço público, com a tag no lugar).
  const [audience, setAudience] = useState<Audience>('homecare')
  const [viewMode, setViewMode] = useState<ViewMode>('todos')
  const [selectedCategoria, setSelectedCategoria] = useState(CATEGORIAS[0])
  const [selectedLinha, setSelectedLinha] = useState(LINHAS[0])
  const [selectedCuidado, setSelectedCuidado] = useState(CUIDADOS[0])
  const [customFilter, setCustomFilter] = useState<CustomFilter | null>(null)
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    loadFavorites(),
  )

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites(next)
      return next
    })
  }

  // Sem seletor de variação na "Compra rápida" — usa a primeira variação
  // como padrão, igual ao comportamento anterior do modal.
  function handleQuickAdd(product: TulipiaProduct) {
    addItem(toCartInput(product, product.variacoes?.[0]))
  }

  // Aciona o filtro livre (coleção, tipo de pele ou banner de linha) e rola
  // até o topo da listagem.
  function applyCustomFilter(filter: CustomFilter) {
    setCustomFilter(filter)
    document
      .getElementById('tulipia-listagem')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function clearCustomFilter() {
    setCustomFilter(null)
  }

  function handleSelectVitrine(key: string) {
    const item = TULIPIA_VITRINE.find((v) => v.key === key)
    if (item) applyCustomFilter(item)
  }

  function handleSelectSkinType(skinType: SkinType) {
    applyCustomFilter(skinType)
  }

  const searching = search.trim().length > 0

  // "Home Care" esconde os itens exclusivos a profissionais; "Profissional"
  // mostra todos (os exclusivos aparecem com a tag no lugar do preço).
  const matchesAudience = useCallback(
    (product: TulipiaProduct) =>
      audience === 'profissional' || !product.exclusivoProfissional,
    [audience],
  )

  const audienceQueridinhos = useMemo(
    () => QUERIDINHOS.filter(matchesAudience),
    [matchesAudience],
  )

  const editorialQueridinhos = audienceQueridinhos.slice(
    0,
    EDITORIAL_QUERIDINHOS_COUNT,
  )
  const remainingQueridinhos = audienceQueridinhos.slice(
    EDITORIAL_QUERIDINHOS_COUNT,
  )

  const audienceCatalogo = useMemo(
    () => CATALOGO.filter(matchesAudience),
    [matchesAudience],
  )

  // Base do grid padrão: catálogo + os Queridinhos que sobraram do destaque
  // editorial (pra não sumirem da página).
  const gridPool = useMemo(
    () => [...remainingQueridinhos, ...audienceCatalogo],
    [remainingQueridinhos, audienceCatalogo],
  )

  const searchResults = useMemo(() => {
    if (!searching) return []
    const query = search.trim().toLowerCase()
    return ALL_PRODUCTS.filter(
      (p) => p.nome.toLowerCase().includes(query) && matchesAudience(p),
    )
  }, [search, searching, matchesAudience])

  const browsedProducts = useMemo(() => {
    if (customFilter) return gridPool.filter(customFilter.match)
    if (viewMode === 'todos') return gridPool
    if (viewMode === 'categoria') {
      return gridPool.filter((p) => p.categoria === selectedCategoria)
    }
    if (viewMode === 'cuidado') {
      return gridPool.filter((p) => p.cuidado.includes(selectedCuidado))
    }
    return gridPool.filter((p) => p.linha === selectedLinha)
  }, [
    customFilter,
    viewMode,
    selectedCategoria,
    selectedLinha,
    selectedCuidado,
    gridPool,
  ])

  const showAlsoLike =
    !searching &&
    (customFilter !== null || viewMode !== 'todos') &&
    browsedProducts.length <= 3
  const alsoLikeProducts = useMemo(
    () =>
      showAlsoLike ? pickAlsoLike(browsedProducts, matchesAudience) : [],
    [showAlsoLike, browsedProducts, matchesAudience],
  )

  const showSearchAlsoLike = searching && searchResults.length <= 3
  const searchAlsoLikeProducts = useMemo(
    () =>
      showSearchAlsoLike ? pickAlsoLike(searchResults, matchesAudience) : [],
    [showSearchAlsoLike, searchResults, matchesAudience],
  )

  const categoriaItems: IconBadgeItem[] = useMemo(
    () =>
      CATEGORIAS.map((categoria) => {
        const meta = getCategoryMeta(categoria)
        return { key: categoria, label: meta.label, Icon: meta.Icon }
      }),
    [],
  )

  const cuidadoItems: IconBadgeItem[] = useMemo(
    () =>
      CUIDADOS.map((cuidado) => {
        const meta = getCuidadoMeta(cuidado)
        return { key: cuidado, label: meta.label, Icon: meta.Icon }
      }),
    [],
  )

  // Banners reais de linha/categoria — layout fixo no topo da página
  // (ProSkin/Dermo Estetic/Ampolas lado a lado, como no site oficial da
  // Tulípia) em vez de intercalados no meio do grid.
  const proskinBanner = TULIPIA_LINE_BANNERS.find((b) => b.key === 'proskin')
  const dermoEsteticBanner = TULIPIA_LINE_BANNERS.find(
    (b) => b.key === 'dermo-estetic',
  )
  const ampolasBanner = TULIPIA_LINE_BANNERS.find((b) => b.key === 'ampolas')
  const exogeneticBanner = TULIPIA_LINE_BANNERS.find(
    (b) => b.key === 'exogenetic',
  )
  const lancamentoProdutos = exogeneticBanner
    ? gridPool.filter(exogeneticBanner.match).slice(0, 4)
    : []

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      {/* Logo + apresentação da Tulípia (mantido do topo original) */}
      <div className="flex flex-col items-center gap-2 text-center xs:gap-3 lg:gap-4">
        <img
          src={tulipiaRepresentante}
          alt="Tulípia — Representante Oficial"
          className="h-auto w-40 xs:w-48 sm:w-56 lg:w-64"
        />
        <p className="max-w-xl text-sm text-[#04452E]/70 sm:text-base">
          Cosméticos e cuidados profissionais Tulípia, direto pelo Instituto
          Health.
        </p>
      </div>

      {/* 1. Banner hero — arte real da marca (promoção vigente: "Mês do
          Cliente", 1 a 30 de setembro, ainda dentro do período). Texto já
          vem desenhado na própria imagem, sem overlay HTML por cima. */}
      <div className="mt-8 overflow-hidden rounded-2xl">
        <img
          src={bannerHeroMesCliente}
          alt="Tulípia — Mês do Cliente, celebramos quem eleva a estética"
          className="h-auto w-full"
        />
      </div>

      {/* Últimos lançamentos — banner + produtos reais da linha anunciada
          nele (ExoGenetic PDRN). */}
      {exogeneticBanner && lancamentoProdutos.length > 0 && (
        <div className="mt-10">
          <div className="mb-5 flex flex-col items-center gap-1 text-center">
            <div className="h-1 w-12 rounded-full bg-[#CAA02D]" />
            <h2 className="font-flatline text-xl leading-tight text-[#04452E] sm:text-2xl">
              Últimos Lançamentos
            </h2>
          </div>
          <LineBanner
            image={exogeneticBanner.image}
            alt={exogeneticBanner.alt}
            className={exogeneticBanner.aspectClass}
            onClick={() => applyCustomFilter(exogeneticBanner)}
          />
          <div className="mt-5 grid grid-cols-2 gap-3 xs:grid-cols-4 xs:gap-4">
            {lancamentoProdutos.map((produto, index) => (
              <ScrollReveal key={produto.id} delay={index * 0.06}>
                <ProductCard
                  product={produto}
                  favorited={favorites.has(produto.id)}
                  onToggleFavorite={toggleFavorite}
                  onQuickAdd={handleQuickAdd}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* ProSkin / Dermo Estetic / Ampolas — mesmo arranjo assimétrico do
          site oficial: ProSkin (retrato) alto à esquerda, Dermo Estetic e
          Ampolas empilhados à direita. No mobile os 3 empilham em coluna
          única.
          Dermo Estetic e Ampolas usam a proporção REAL da própria foto
          (aspectClass, 1340x764) em vez de uma altura fixa em px — com
          altura fixa, em telas largas (coluna bem mais larga que os
          ~260px de altura) o object-cover precisava cortar muito da
          imagem pra "cobrir" a caixa, e cortava bem onde está o texto
          "Linha Dermo Estetic" no topo do banner. Com a proporção batendo
          com a da foto, não sobra nada pra cortar. Como as linhas do grid
          agora têm altura definida pelo próprio conteúdo (aspect-ratio,
          não mais "auto"), o `h-full` do ProSkin (que ocupa as 2 linhas)
          resolve certinho contra elas, sem precisar de grid-rows fixo. */}
      {(proskinBanner || dermoEsteticBanner || ampolasBanner) && (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {proskinBanner && (
            <LineBanner
              image={proskinBanner.image}
              alt={proskinBanner.alt}
              className="h-80 sm:row-span-2 sm:h-full"
              objectPosition="top"
              onClick={() => applyCustomFilter(proskinBanner)}
            />
          )}
          {dermoEsteticBanner && (
            <LineBanner
              image={dermoEsteticBanner.image}
              alt={dermoEsteticBanner.alt}
              className={dermoEsteticBanner.aspectClass}
              onClick={() => applyCustomFilter(dermoEsteticBanner)}
            />
          )}
          {ampolasBanner && (
            <LineBanner
              image={ampolasBanner.image}
              alt={ampolasBanner.alt}
              className={ampolasBanner.aspectClass}
              onClick={() => applyCustomFilter(ampolasBanner)}
            />
          )}
        </div>
      )}

      {/* 2. Coleções em destaque — carrossel de ícones circulares */}
      <div className="mt-6">
        <IconBadgeCarousel
          items={TULIPIA_VITRINE}
          activeKey={customFilter?.key ?? null}
          onSelect={handleSelectVitrine}
        />
      </div>

      {/* 3. Por tipo de pele */}
      <div className="mt-10">
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <div className="h-1 w-12 rounded-full bg-[#CAA02D]" />
          <h2 className="font-flatline text-xl leading-tight text-[#04452E] sm:text-2xl">
            Por Tipo de Pele
          </h2>
          <p className="text-sm text-[#04452E]/70">
            Encontre os produtos certos pra sua pele
          </p>
        </div>
        <SkinTypeGrid skinTypes={SKIN_TYPES} onSelect={handleSelectSkinType} />
      </div>

      {/* Busca */}
      <div className="mx-auto mt-10 max-w-md xs:mt-12 lg:max-w-lg">
        <label className="relative block">
          <span className="sr-only">Buscar produto por nome</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#04452E]/50" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produto por nome..."
            className="w-full rounded-full border border-[#04452E]/15 bg-white py-2.5 pr-4 pl-10 text-sm text-[#04452E] placeholder:text-[#04452E]/40 focus:border-[#CAA02D] focus:ring-2 focus:ring-[#CAA02D]/30 focus:outline-none"
          />
        </label>
      </div>

      {/* Profissional / Home Care — divide o catálogo inteiro (Queridinhos,
          busca e grade) em dois públicos antes de qualquer outro filtro. */}
      <div className="mt-8 flex justify-center xs:mt-10">
        <div className="inline-flex rounded-full border border-[#04452E]/15 bg-white p-1">
          {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAudience(option)}
              aria-pressed={audience === option}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:px-5 ${
                audience === option
                  ? 'bg-[#CAA02D] text-[#04452E]'
                  : 'text-[#04452E] hover:text-[#CAA02D]'
              }`}
            >
              {AUDIENCE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {searching ? (
        <div className="mt-10">
          <p className="mb-5 text-center text-sm text-[#04452E]/70">
            {searchResults.length > 0
              ? `${searchResults.length} resultado${searchResults.length > 1 ? 's' : ''} para "${search.trim()}"`
              : `Nenhum produto encontrado para "${search.trim()}"`}
          </p>
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 xs:gap-4 lg:grid-cols-4 lg:gap-5 3xl:gap-6">
            {searchResults.map((product, index) => (
              <ScrollReveal key={product.id} delay={(index % 4) * 0.06}>
                <ProductCard
                  product={product}
                  favorited={favorites.has(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onQuickAdd={handleQuickAdd}
                />
              </ScrollReveal>
            ))}
          </div>

          {showSearchAlsoLike && searchAlsoLikeProducts.length > 0 && (
            <VocePodeGostar
              produtos={searchAlsoLikeProducts}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onQuickAdd={handleQuickAdd}
            />
          )}
        </div>
      ) : (
        <>
          {/* 4. Queridinhos — destaque editorial grande, antes do grid */}
          <QueridinhosDestaque produtos={editorialQueridinhos} />

          {/* Navegação em 3 eixos: Todos / Por Categoria / Por Linha */}
          <div id="tulipia-listagem" className="mt-14 scroll-mt-20">
            {customFilter ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-[#04452E]/70">
                  Mostrando:{' '}
                  <span className="font-semibold text-[#04452E]">
                    {customFilter.label}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={clearCustomFilter}
                  className="text-xs font-medium text-dourado-health underline underline-offset-2 hover:text-[#04452E]"
                >
                  Limpar filtro e ver tudo
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="inline-flex rounded-full border border-[#04452E]/15 bg-white p-1">
                  {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? 'bg-[#04452E] text-offwhite'
                          : 'text-[#04452E] hover:text-[#CAA02D]'
                      }`}
                    >
                      {VIEW_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Por Categoria — carrossel de badges circulares (categorias
                cruas do catálogo) */}
            {!customFilter && viewMode === 'categoria' && (
              <div className="mt-5">
                <IconBadgeCarousel
                  items={categoriaItems}
                  activeKey={selectedCategoria}
                  onSelect={setSelectedCategoria}
                />
              </div>
            )}

            {/* Por Linha — dropdown único, com busca interna */}
            {!customFilter && viewMode === 'linha' && (
              <LinhaDropdown
                linhas={LINHAS}
                selected={selectedLinha}
                onSelect={setSelectedLinha}
              />
            )}

            {/* Por Cuidado — mesmo carrossel de badges do Por Categoria
                (só 8 opções, cabe bem no mesmo formato) */}
            {!customFilter && viewMode === 'cuidado' && (
              <div className="mt-5">
                <IconBadgeCarousel
                  items={cuidadoItems}
                  activeKey={selectedCuidado}
                  onSelect={setSelectedCuidado}
                />
              </div>
            )}

            {/* 6. Grid padrão de produtos (banners de linha/categoria agora
                ficam fixos no topo da página, não mais intercalados aqui) */}
            <div className="mt-8 grid grid-cols-2 gap-3 xs:grid-cols-3 xs:gap-4 lg:grid-cols-4 lg:gap-5 3xl:gap-6">
              {browsedProducts.map((product, index) => (
                <ScrollReveal key={product.id} delay={(index % 4) * 0.06}>
                  <ProductCard
                    product={product}
                    favorited={favorites.has(product.id)}
                    onToggleFavorite={toggleFavorite}
                    onQuickAdd={handleQuickAdd}
                  />
                </ScrollReveal>
              ))}
              {browsedProducts.length === 0 && (
                <p className="col-span-full text-center text-sm text-[#04452E]/60">
                  Nenhum produto nessa seleção.
                </p>
              )}
            </div>

            {/* 7. "Você também pode gostar" — quando o filtro sobra pouco */}
            {showAlsoLike && alsoLikeProducts.length > 0 && (
              <VocePodeGostar
                produtos={alsoLikeProducts}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onQuickAdd={handleQuickAdd}
              />
            )}
          </div>
        </>
      )}
    </motion.section>
  )
}

// "Você também pode gostar" — mesmo tratamento visual do grid padrão, só
// com um rótulo próprio pra deixar claro que é um complemento, não o
// resultado do filtro.
function VocePodeGostar({
  produtos,
  favorites,
  onToggleFavorite,
  onQuickAdd,
}: {
  produtos: TulipiaProduct[]
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
  onQuickAdd: (product: TulipiaProduct) => void
}) {
  return (
    <div className="mt-14">
      <div className="mb-5 flex flex-col items-center gap-1 text-center">
        <div className="h-1 w-12 rounded-full bg-[#CAA02D]" />
        <h2 className="font-flatline text-xl leading-tight text-[#04452E] sm:text-2xl">
          Você também pode gostar
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 xs:gap-4 lg:grid-cols-4 lg:gap-5 3xl:gap-6">
        {produtos.map((product, index) => (
          <ScrollReveal key={product.id} delay={(index % 4) * 0.06}>
            <ProductCard
              product={product}
              favorited={favorites.has(product.id)}
              onToggleFavorite={onToggleFavorite}
              onQuickAdd={onQuickAdd}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}

export default Tulipia
