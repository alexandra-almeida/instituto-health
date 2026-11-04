interface BannerImagemProps {
  /** arte para telas a partir de 640px (paisagem) */
  desktop: string
  /** arte para telas pequenas; hoje é a mesma do desktop (ver comentário) */
  mobile: string
  alt: string
  /** proporção real da arte, ex: `aspect-[1920/837]`, para a página não pular */
  proporcao: string
  /** true só para o banner do topo da página, que já nasce visível */
  prioridade?: boolean
}

// Imagem de banner sem corte: a altura segue a proporção real da arte (nada de
// object-cover). O clique e os cantos arredondados ficam por conta de quem usa.
//
// PARA TROCAR PELA VERSÃO MOBILE: importe a arte nova e passe em `mobile` (e,
// se a proporção for outra, use `proporcao` com o breakpoint, como o
// LaunchBanner faz: `aspect-[812/884] sm:aspect-[1920/837]`).
function BannerImagem({
  desktop,
  mobile,
  alt,
  proporcao,
  prioridade = false,
}: BannerImagemProps) {
  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={desktop} />
      <img
        src={mobile}
        alt={alt}
        loading={prioridade ? 'eager' : 'lazy'}
        fetchPriority={prioridade ? 'high' : 'auto'}
        decoding="async"
        className={`${proporcao} block h-auto w-full`}
      />
    </picture>
  )
}

export default BannerImagem
