import { WHATSAPP_NUMBER } from '../data/contact'
import { WhatsappIcon } from './icons'

const MESSAGE =
  'Olá! Gostaria de saber mais sobre os produtos e serviços do Instituto Health.'

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`

// Botão flutuante fixo, visível em toda a navegação (montado uma vez no
// App, fora do <main>) — canto inferior direito, acima do conteúdo normal
// da página mas abaixo de qualquer modal futuro (que usaria um z-index
// maior, ex: z-50+).
function FloatingWhatsapp() {
  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed right-5 bottom-5 z-40 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 sm:right-6 sm:bottom-6 sm:h-14 sm:w-14"
    >
      <WhatsappIcon className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  )
}

export default FloatingWhatsapp
