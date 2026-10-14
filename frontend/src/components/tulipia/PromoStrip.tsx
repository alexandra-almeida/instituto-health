import bannerAzul from '../../assets/tulipia-banners/bannerazul.webp'
import { PROMO_AMPOLAS_SEMANA_2 } from '../../data/promocoes'

interface PromoStripProps {
  onClick: () => void
}

// Faixa promocional, sempre visível, em todas as larguras de tela. A peça
// inteira é clicável e mostra os produtos da promoção (o filtro em si é
// aplicado pela página).
function PromoStrip({ onClick }: PromoStripProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 block w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]"
    >
      <img
        src={bannerAzul}
        alt={PROMO_AMPOLAS_SEMANA_2.alt}
        className="aspect-[2720/200] h-auto w-full"
      />
    </button>
  )
}

export default PromoStrip
