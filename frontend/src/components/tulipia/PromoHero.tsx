import bannerEsquentaBlack from '../../assets/tulipia-banners/banner-esquenta-black-sabonetes-desktop.webp'
import { PROMO_ESQUENTA_BLACK_SEMANA_1 } from '../../data/promocoes'
import BannerImagem from './BannerImagem'

interface PromoHeroProps {
  onClick: () => void
}

// Banner principal da promoção, logo abaixo da faixa. A peça inteira é
// clicável e mostra os produtos da promoção (o filtro em si é aplicado pela
// página, o mesmo da faixa). Sem a faixa no celular, ele ocupa o lugar dela.
// Quando chegar a arte mobile, troque `mobile` abaixo (ver BannerImagem).
function PromoHero({ onClick }: PromoHeroProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 block w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)] sm:mt-4"
    >
      <BannerImagem
        desktop={bannerEsquentaBlack}
        mobile={bannerEsquentaBlack}
        alt={PROMO_ESQUENTA_BLACK_SEMANA_1.alt}
        proporcao="aspect-[1920/837]"
        prioridade
      />
    </button>
  )
}

export default PromoHero
