// Fade radial nas bordas — mesmo princípio já usado em outras fotos do
// site (ex: fundo da home): opaco no centro, dissolve suavemente até sumir
// perto da borda, em vez de terminar com uma quina reta.
const FADE_MASK = 'radial-gradient(closest-side, black 72%, transparent 100%)'

interface FadedImageProps {
  src: string
  alt: string
  className?: string
}

function FadedImage({ src, alt, className }: FadedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className ?? ''}`}
      style={{
        maskImage: FADE_MASK,
        WebkitMaskImage: FADE_MASK,
      }}
    />
  )
}

export default FadedImage
