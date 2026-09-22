import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ProductCard from '../components/tulipia/ProductCard'
import ProductGallery from '../components/tulipia/ProductGallery'
import {
  ChevronRightIcon,
  HeartIcon,
  RefreshIcon,
  ShieldCheckIcon,
  StarIcon,
  TruckIcon,
} from '../components/icons'
import ScrollReveal from '../components/ScrollReveal'
import { useCart } from '../context/useCart'
import {
  findProductById,
  formatPrice,
  generateDescription,
  getRelatedProducts,
  parseKitContents,
  toCartInput,
} from '../data/tulipiaProducts'

function loadFavorites(): Set<string> {
  try {
    const raw = window.localStorage.getItem('tulipia-favoritos')
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
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
    // localStorage indisponível — favoritos ficam só na sessão atual.
  }
}

// Página de detalhe de um produto Tulípia. A prop `key={product.id}`, lá
// embaixo onde essa página é montada em App.tsx, força um remount completo
// sempre que o produto muda (ex: ao clicar num "produto relacionado") — o
// jeito mais simples de resetar galeria/variação/favoritos sem efeito nem
// ref, já que aqui (diferente do antigo modal) temos controle total do JSX.
function TulipiaProduto() {
  const { slug } = useParams<{ slug: string }>()
  const { addItem } = useCart()
  const product = slug ? findProductById(slug) : undefined

  const [favorites, setFavorites] = useState<Set<string>>(() =>
    loadFavorites(),
  )
  const [variant, setVariant] = useState<string | null>(
    product?.variacoes?.[0] ?? null,
  )
  const [added, setAdded] = useState(false)

  if (!product) {
    return <Navigate to="/tulipia" replace />
  }

  // TS não propaga o "if (!product) return" acima pra dentro de closures —
  // essa cópia já com o tipo estreitado evita repetir a checagem/asserção
  // em cada função abaixo.
  const currentProduct = product

  function toggleFavorite() {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(currentProduct.id)) next.delete(currentProduct.id)
      else next.add(currentProduct.id)
      saveFavorites(next)
      return next
    })
  }

  function handleAdd() {
    addItem(toCartInput(currentProduct, variant))
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  const images = [product.imagem, ...product.imagensExtras].filter(
    (src): src is string => Boolean(src),
  )
  const kitContents = parseKitContents(product.tamanho)
  const description = generateDescription(product)
  const related = getRelatedProducts(product, 4)
  const favorited = favorites.has(product.id)
  const breadcrumbLabel = product.linha ?? product.categoria

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-6 sm:py-8"
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Trilha de navegação"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[#04452E]/60 sm:mb-6 sm:text-sm"
      >
        <Link to="/" className="hover:text-[#CAA02D]">
          Início
        </Link>
        <ChevronRightIcon className="h-3 w-3 shrink-0" />
        <Link to="/tulipia" className="hover:text-[#CAA02D]">
          Tulipia
        </Link>
        <ChevronRightIcon className="h-3 w-3 shrink-0" />
        <span>{breadcrumbLabel}</span>
        <ChevronRightIcon className="h-3 w-3 shrink-0" />
        <span className="font-medium text-[#04452E]">
          {product.displayName}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} alt={product.displayName} />

        <div>
          {product.linha && (
            <span className="text-xs font-semibold tracking-wide text-[#CAA02D] uppercase">
              {product.linha}
            </span>
          )}
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-flatline mt-1 text-2xl leading-tight text-[#04452E] sm:text-3xl lg:text-4xl">
              {product.displayName}
            </h1>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={favorited}
              aria-label={
                favorited ? 'Remover dos favoritos' : 'Favoritar'
              }
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#04452E]/5 text-[#04452E] transition-colors hover:text-[#CAA02D]"
            >
              <HeartIcon
                filled={favorited}
                className={`h-5 w-5 ${favorited ? 'text-[#CAA02D]' : ''}`}
              />
            </button>
          </div>
          <p className="mt-1 text-sm text-[#04452E]/70">{product.categoria}</p>
          <p className="mt-1 text-sm text-[#04452E]/60">{product.tamanho}</p>

          {/* Avaliação — só a estrutura visual por enquanto (sem sistema de
              avaliações real ainda), zerada em vez de inventar uma nota. */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-[#04452E]/25">
              {[0, 1, 2, 3, 4].map((index) => (
                <StarIcon key={index} className="h-4 w-4" />
              ))}
            </div>
            <span className="text-xs text-[#04452E]/50">(0 avaliações)</span>
          </div>

          {product.exclusivoProfissional ? (
            <p className="mt-3 inline-flex w-fit items-center rounded-full bg-[#CAA02D]/15 px-4 py-1.5 text-base font-semibold text-[#CAA02D]">
              Exclusivo para profissionais
            </p>
          ) : (
            <p className="font-flatline mt-3 text-3xl text-[#04452E]">
              {formatPrice(product.preco)}
            </p>
          )}

          {product.variacoes && product.variacoes.length > 0 && (
            <div className="mt-5">
              <span className="text-xs font-semibold tracking-wide text-[#04452E] uppercase">
                Escolha a variação
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variacoes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVariant(option)}
                    aria-pressed={variant === option}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      variant === option
                        ? 'border-[#04452E] bg-[#04452E] text-offwhite'
                        : 'border-[#04452E]/20 text-[#04452E] hover:border-[#CAA02D] hover:text-[#CAA02D]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={product.exclusivoProfissional ? undefined : handleAdd}
            disabled={product.exclusivoProfissional}
            aria-disabled={product.exclusivoProfissional}
            title={
              product.exclusivoProfissional
                ? 'Produto exclusivo para profissionais — indisponível sem login'
                : undefined
            }
            className={`mt-4 w-full rounded-full px-6 py-3.5 text-sm font-semibold transition-colors sm:mt-6 sm:w-auto sm:px-10 ${
              product.exclusivoProfissional
                ? 'cursor-not-allowed bg-[#04452E]/25 text-[#04452E]/50'
                : 'bg-[#04452E] text-offwhite hover:bg-[#04452E]/90'
            }`}
          >
            {product.exclusivoProfissional
              ? 'Adicionar ao carrinho'
              : added
                ? 'Adicionado ao carrinho ✓'
                : 'Adicionar ao carrinho'}
          </button>

          {/* Selos de confiança */}
          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-[#04452E]/10 pt-6 xs:grid-cols-3">
            <div className="flex items-center gap-2 text-xs text-[#04452E]/70">
              <TruckIcon className="h-5 w-5 shrink-0 text-[#04452E]" />
              Frete grátis acima de R$ 299
            </div>
            <div className="flex items-center gap-2 text-xs text-[#04452E]/70">
              <RefreshIcon className="h-5 w-5 shrink-0 text-[#04452E]" />
              Troca em até 7 dias
            </div>
            <div className="flex items-center gap-2 text-xs text-[#04452E]/70">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[#04452E]" />
              Compra 100% segura
            </div>
          </div>

          {/* Descrição — ao lado da galeria, aproveitando o espaço que
              sobra abaixo dos botões (em vez de embaixo de tudo, fora da
              coluna). */}
          <div className="mt-8 border-t border-[#04452E]/10 pt-6">
            <h2 className="font-flatline text-lg text-[#04452E]">
              Descrição
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#04452E]/80">
              {description}
            </p>
          </div>

          {/* Conteúdo do kit */}
          {kitContents && (
            // Tratamento premium (Verde Profundo + Dourado Claro) — kits são
            // a "aplicação premium" citada na hierarquia de cores da marca,
            // então esse card se destaca do resto da página (que é toda
            // clara) em vez de seguir o mesmo branco/verde institucional.
            <div className="mt-6 rounded-2xl bg-verde-profundo p-5">
              <h2 className="font-flatline text-lg text-dourado-claro">
                Esse kit contém
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-offwhite/85 marker:text-dourado-claro">
                {kitContents.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="mb-5 flex flex-col items-center gap-1 text-center">
            <div className="h-1 w-12 rounded-full bg-[#CAA02D]" />
            <h2 className="font-flatline text-xl leading-tight text-[#04452E] sm:text-2xl">
              Produtos relacionados
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 xs:gap-4 lg:grid-cols-4 lg:gap-5 3xl:gap-6">
            {related.map((relatedProduct, index) => (
              <ScrollReveal key={relatedProduct.id} delay={(index % 4) * 0.06}>
                <ProductCard
                  product={relatedProduct}
                  favorited={favorites.has(relatedProduct.id)}
                  onToggleFavorite={() => {
                    setFavorites((current) => {
                      const next = new Set(current)
                      if (next.has(relatedProduct.id)) {
                        next.delete(relatedProduct.id)
                      } else {
                        next.add(relatedProduct.id)
                      }
                      saveFavorites(next)
                      return next
                    })
                  }}
                  onQuickAdd={(p) => addItem(toCartInput(p, p.variacoes?.[0]))}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default TulipiaProduto
