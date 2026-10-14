import { Link } from 'react-router-dom'

interface LaunchBannerProps {
  /** arte para telas pequenas (retrato) */
  mobileImage: string
  /** arte para telas a partir de 640px (paisagem) */
  desktopImage: string
  alt: string
  to: string
}

// Banner de lançamento que leva a uma página (diferente do LineBanner, que
// só aplica filtro no catálogo). As duas artes têm proporções diferentes,
// então o aspect-ratio acompanha o breakpoint do <picture> para a página
// não "pular" quando a imagem carrega.
function LaunchBanner({
  mobileImage,
  desktopImage,
  alt,
  to,
}: LaunchBannerProps) {
  return (
    <Link
      to={to}
      className="block w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]"
    >
      <picture>
        <source media="(min-width: 640px)" srcSet={desktopImage} />
        <img
          src={mobileImage}
          alt={alt}
          className="aspect-[812/884] h-auto w-full object-cover sm:aspect-[2720/1186]"
        />
      </picture>
    </Link>
  )
}

export default LaunchBanner
