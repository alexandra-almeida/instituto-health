import type { Promocao } from '../../data/promocoes'

interface PromoStripProps {
  /** promoção no ar; sem faixa (ou sem promoção) o componente não renderiza */
  promocao: Promocao | null
  onClick: () => void
}

// Faixa promocional do fim da página (o banner principal, PromoHero, fica no
// topo), visível de 640px para cima: no celular a arte (2720 de largura) fica
// ilegível, então ela some. A peça inteira é clicável e mostra os produtos da
// promoção (o filtro em si é aplicado pela página).
//
// Sem faixa vigente nada é renderizado (nem a margem). A proporção é a da
// própria imagem, que muda de uma promoção para outra.
function PromoStrip({ promocao, onClick }: PromoStripProps) {
  const faixa = promocao?.faixa
  if (!promocao || !faixa) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-14 hidden w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)] sm:block"
    >
      <img
        src={faixa.src}
        alt={promocao.alt}
        width={faixa.largura}
        height={faixa.altura}
        style={{ aspectRatio: `${faixa.largura} / ${faixa.altura}` }}
        className="h-auto w-full"
      />
    </button>
  )
}

export default PromoStrip
