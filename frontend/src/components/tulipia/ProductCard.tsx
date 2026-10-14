import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { TulipiaProduct } from '../../data/tulipiaProducts'
import { CartPlusIcon, HeartIcon } from '../icons'
import PriceTag from '../PriceTag'

interface ProductCardProps {
  product: TulipiaProduct
  favorited: boolean
  onToggleFavorite: (id: string) => void
  onQuickAdd: (product: TulipiaProduct) => void
}

// Card padrão da grade de produtos: imagem, nome, linha/tamanho, preço,
// coração de favoritar, botão "Ver produto" e link "Compra rápida" (vai
// direto pro carrinho, sem sair da página). O card inteiro (foto + texto) e
// o botão "Ver produto" levam pra página de detalhe do produto — só o
// coração e a "Compra rápida" ficam fora desse link, como ações próprias.
function ProductCard({
  product,
  favorited,
  onToggleFavorite,
  onQuickAdd,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false)
  // Só existe pra cobrir o caso raro de a foto não carregar de verdade (ex:
  // arquivo corrompido) — aí volta pro placeholder com fundo em gradiente.
  const [imgError, setImgError] = useState(false)
  const showImage = Boolean(product.imagem) && !imgError
  const detailHref = `/tulipia/produto/${product.id}`

  function handleQuickAdd() {
    onQuickAdd(product)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  function handleToggleFavorite(event: MouseEvent) {
    event.preventDefault()
    onToggleFavorite(product.id)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-2px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]">
      <Link
        to={detailHref}
        className="relative block aspect-square overflow-hidden rounded-t-2xl bg-linear-to-br from-[#04452E]/8 to-[#CAA02D]/15"
      >
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={favorited}
          aria-label={
            favorited
              ? `Remover ${product.displayName} dos favoritos`
              : `Favoritar ${product.displayName}`
          }
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#04452E] shadow-sm transition-colors hover:text-[#CAA02D]"
        >
          <HeartIcon
            filled={favorited}
            className={`h-4.5 w-4.5 ${favorited ? 'text-[#CAA02D]' : ''}`}
          />
        </button>
        {showImage ? (
          <img
            src={product.imagem}
            alt={product.displayName}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-2.5 text-center text-xs font-medium text-[#04452E]/45 uppercase xs:p-4">
            {product.displayName}
          </span>
        )}
      </Link>

      <div className="font-inter flex flex-1 flex-col items-center gap-1 p-2.5 text-center xs:p-3.5">
        <Link to={detailHref} className="flex flex-col items-center gap-1">
          {product.linha && (
            <span className="text-[10px] leading-none tracking-wide text-dourado-health uppercase">
              {product.linha}
            </span>
          )}
          <h3 className="line-clamp-2 text-sm leading-snug font-normal text-verde-health">
            {product.displayName}
          </h3>
          <p className="text-xs text-verde-health/60">{product.tamanho}</p>
          {product.exclusivoProfissional ? (
            <p className="mt-1 text-[11px] leading-tight tracking-wide text-dourado-health uppercase">
              Exclusivo para profissionais
            </p>
          ) : (
            <PriceTag
              value={product.preco}
              className="mt-1 leading-none text-verde-health"
              mainClassName="text-lg font-semibold"
            />
          )}
        </Link>

        <div className="mt-2.5 flex w-full flex-col items-center gap-1.5">
          <Link
            to={detailHref}
            className="w-full rounded-[10px] bg-dourado-health px-3 py-2 text-xs font-medium text-verde-profundo transition-colors hover:bg-dourado-claro"
          >
            Ver produto
          </Link>
          <button
            type="button"
            onClick={product.exclusivoProfissional ? undefined : handleQuickAdd}
            disabled={product.exclusivoProfissional}
            aria-disabled={product.exclusivoProfissional}
            title={
              product.exclusivoProfissional
                ? 'Produto exclusivo para profissionais — indisponível sem login'
                : undefined
            }
            className={`inline-flex items-center gap-1.5 text-[11px] transition-colors ${
              product.exclusivoProfissional
                ? 'cursor-not-allowed text-verde-health/35'
                : 'text-verde-esmeralda hover:text-dourado-health'
            }`}
          >
            <CartPlusIcon className="h-3.5 w-3.5" />
            {justAdded ? 'Adicionado ✓' : 'Compra rápida'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
