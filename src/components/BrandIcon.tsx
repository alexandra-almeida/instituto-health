import logoNavbar from '../assets/logo-parts/logo-navbar-cropped.png'

interface BrandIconProps {
  /** altura do emblema em px — a largura segue a proporção original da imagem */
  heightPx: number
  className?: string
  imgRef?: React.Ref<HTMLImageElement>
}

// Emblema isolado (círculo + H + fita + folhas, sem o wordmark HEALTH), usado
// no header em todas as páginas. É uma imagem estática comum — a opacidade
// vem só do header (que fica invisível/visível como um todo) e a "chegada"
// vindo da home é um overlay separado, controlado explicitamente por
// posição/tamanho medidos via DOM (ver Home.tsx), não por layoutId/crossfade
// automático do Motion, que se mostrou pouco confiável (deixava um emblema
// fantasma sobreposto).
function BrandIcon({ heightPx, className, imgRef }: BrandIconProps) {
  return (
    <img
      ref={imgRef}
      src={logoNavbar}
      alt="Instituto Health"
      className={`block shrink-0 ${className ?? ''}`}
      style={{ height: heightPx, width: 'auto' }}
    />
  )
}

export default BrandIcon
