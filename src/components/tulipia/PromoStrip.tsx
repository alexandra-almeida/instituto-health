import promoAmpolasSemana2 from '../../assets/tulipia-banners/faixa-promo-ampolas-15off-semana2.webp'
import { WHATSAPP_NUMBER } from '../../data/contact'
import { PROMO_AMPOLAS_SEMANA_2 } from '../../data/promocoes'

const promocao = PROMO_AMPOLAS_SEMANA_2

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(promocao.mensagemWhatsapp)}`

// Faixa promocional, sempre visível. Abaixo de 768px a imagem (proporção
// quase 14:1) fica ilegível, então vira uma faixa de texto.
function PromoStrip() {
  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noreferrer"
      className="mt-8 block overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]"
    >
      <img
        src={promoAmpolasSemana2}
        alt={promocao.alt}
        className="hidden aspect-[2720/200] h-auto w-full md:block"
      />
      <span className="flex min-h-12 items-center justify-center bg-[#04452E] px-4 py-3 text-center text-sm font-medium leading-snug text-[#F8F5EE] md:hidden">
        <span className="text-[#CAA02D]">{promocao.textoMobile}</span>
      </span>
    </a>
  )
}

export default PromoStrip
