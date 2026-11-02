import { WHATSAPP_NUMBER } from '../../data/contact'
import { MENSAGEM_ATACADO, linkDoWhatsapp } from '../../lib/descartaveis'
import { WhatsappIcon } from '../icons'

// Bloco de destaque no topo da página de descartáveis. O texto é RASCUNHO para a
// Juliana revisar (ver o plano).
function BlocoAtacado() {
  return (
    <section
      aria-labelledby="atacado-titulo"
      className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-2xl bg-emerald-dark px-5 py-7 text-center text-offwhite shadow-[0_2px_14px_-4px_rgba(4,32,18,0.25)] sm:px-8"
    >
      <h2
        id="atacado-titulo"
        className="font-flatline text-xl leading-tight text-gold sm:text-2xl"
      >
        Compras em atacado e licitações
      </h2>
      <p className="max-w-xl text-sm leading-relaxed text-offwhite/85 sm:text-base">
        O Instituto Health atende clínicas, empresas e órgãos públicos em
        grandes quantidades e em licitações. Conte o que você precisa e receba
        um orçamento.
      </p>
      <a
        href={linkDoWhatsapp(WHATSAPP_NUMBER, MENSAGEM_ATACADO)}
        target="_blank"
        rel="noreferrer"
        className="font-flatline inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm leading-none text-emerald-dark uppercase transition-colors hover:bg-dourado-claro"
      >
        <WhatsappIcon className="h-5 w-5" />
        Pedir orçamento pelo WhatsApp
      </a>
    </section>
  )
}

export default BlocoAtacado
