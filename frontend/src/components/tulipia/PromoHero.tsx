import type { Promocao } from '../../data/promocoes'
import BannerImagem from './BannerImagem'

interface PromoHeroProps {
  /** promoção no ar; sem promoção o componente não renderiza */
  promocao: Promocao | null
  onClick: () => void
}

// Banner principal da promoção, logo abaixo da faixa. A peça inteira é
// clicável e mostra os produtos da promoção (o filtro em si é aplicado pela
// página, o mesmo da faixa). Sem a faixa no celular, ele ocupa o lugar dela.
// Fora do período da promoção nada é renderizado (nem a margem).
// Quando chegar a arte mobile, troque `mobile` abaixo (ver BannerImagem).
function PromoHero({ promocao, onClick }: PromoHeroProps) {
  if (!promocao) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 block w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)] sm:mt-4"
    >
      <BannerImagem
        desktop={promocao.hero}
        mobile={promocao.hero}
        alt={promocao.alt}
        proporcao={promocao.heroProporcao}
        prioridade
      />
    </button>
  )
}

export default PromoHero
