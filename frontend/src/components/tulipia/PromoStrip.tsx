import { PROMOCAO_ATUAL } from '../../data/promocoes'

interface PromoStripProps {
  onClick: () => void
}

// Faixa promocional do fim da página (o banner principal, PromoHero, fica no
// topo), visível de 640px para cima: no celular a arte (2720x200) fica
// ilegível, então ela some. A peça inteira é clicável e mostra os produtos da
// promoção (o filtro em si é aplicado pela página).
function PromoStrip({ onClick }: PromoStripProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-14 hidden w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)] sm:block"
    >
      <img
        src={PROMOCAO_ATUAL.faixa}
        alt={PROMOCAO_ATUAL.alt}
        className="aspect-[2720/200] h-auto w-full"
      />
    </button>
  )
}

export default PromoStrip
