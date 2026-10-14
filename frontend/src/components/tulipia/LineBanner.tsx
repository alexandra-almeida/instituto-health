interface LineBannerProps {
  image: string
  alt: string
  /** Controla tamanho/proporção — cada chamada decide (aspect-[] quando o
   * banner é independente, h-full quando ele preenche uma célula de grid
   * já dimensionada pelo pai). */
  className?: string
  /** 'top' pro banner ProSkin (recorte vertical) — prioriza mostrar o
   * início da imagem, onde está a chamada principal. */
  objectPosition?: 'top' | 'center'
  onClick: () => void
}

// Banner de linha/categoria real (arte da própria marca) — a peça inteira
// é clicável (não só um botão sobreposto) e leva pros produtos filtrados
// daquela linha/categoria.
function LineBanner({
  image,
  alt,
  className,
  objectPosition = 'center',
  onClick,
}: LineBannerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)] ${className ?? ''}`}
    >
      <img
        src={image}
        alt={alt}
        className={`h-full w-full object-cover ${objectPosition === 'top' ? 'object-top' : ''}`}
      />
    </button>
  )
}

export default LineBanner
