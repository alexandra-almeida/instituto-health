// Fade linear nas bordas de cima/baixo — a foto dissolve suavemente no
// fundo da seção em vez de terminar com uma linha reta (usada em fotos de
// fundo full-bleed, bem largas e baixas — um fade radial, como o de
// FadedImage, deixaria os cantos com corte reto duro).
const EDGE_FADE_MASK =
  'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'

interface BackgroundPhotoProps {
  src: string
  alt: string
  className?: string
}

// <img> "crua" (sem nenhum filtro de cor) usada como foto de fundo nas
// seções da home — a opacidade baixa e sutil fica a cargo do `className`
// de quem usa (ex: `opacity-[0.16]`), aqui só cuida do fade nas bordas.
function BackgroundPhoto({ src, alt, className }: BackgroundPhotoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK }}
    />
  )
}

export default BackgroundPhoto
