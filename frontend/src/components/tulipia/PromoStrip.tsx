import type { FaixaDaPromocao } from '../../data/promocoes'

interface PromoStripProps {
  /** faixa no ar hoje e o texto alternativo; sem faixa nada é renderizado */
  faixa: { arte: FaixaDaPromocao; alt: string } | null
  onClick: () => void
}

// Faixa promocional do fim da página (o banner principal, PromoHero, fica no
// topo), visível de 640px para cima: no celular a arte (2720 de largura) fica
// ilegível, então ela some. A peça inteira é clicável e mostra os produtos da
// promoção (o filtro em si é aplicado pela página).
//
// Sem faixa vigente nada é renderizado (nem a margem). A proporção é a da
// própria imagem, que muda de uma promoção para outra.
function PromoStrip({ faixa, onClick }: PromoStripProps) {
  if (!faixa) return null
  const { arte } = faixa
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-14 hidden w-full overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)] sm:block"
    >
      <img
        src={arte.src}
        alt={faixa.alt}
        width={arte.largura}
        height={arte.altura}
        style={{ aspectRatio: `${arte.largura} / ${arte.altura}` }}
        className="h-auto w-full"
      />
    </button>
  )
}

export default PromoStrip
