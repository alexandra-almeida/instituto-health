import { Link } from 'react-router-dom'
import logoNavbar from '../assets/logo-parts/logo-navbar-cropped.png'
import { WHATSAPP_NUMBER } from '../data/contact'
import { FacebookIcon, InstagramIcon, WhatsappIcon } from './icons'

// Rodapé enxuto — usado em todas as páginas menos a home (que tem o Footer
// completo, com contato/horário/pagamento). Só o essencial: marca (também
// funciona como link discreto pra home), ícones de redes sociais e uma
// linha de copyright.
function FooterSimple() {
  return (
    <footer className="mt-16 bg-verde-profundo text-offwhite/90">
      <div className="mx-auto flex max-w-375 flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between md:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 transition-colors hover:text-gold"
        >
          <img src={logoNavbar} alt="Instituto Health" className="h-7 w-auto" />
          <span className="font-poppins text-sm font-semibold tracking-wide text-gold uppercase">
            Instituto Health
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="rounded-full border border-offwhite/20 p-2 transition-colors hover:border-gold hover:text-gold"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="rounded-full border border-offwhite/20 p-2 transition-colors hover:border-gold hover:text-gold"
          >
            <FacebookIcon className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="rounded-full border border-offwhite/20 p-2 transition-colors hover:border-gold hover:text-gold"
          >
            <WhatsappIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="border-t border-offwhite/10 py-3 text-center text-xs text-offwhite/50">
        © {new Date().getFullYear()} Instituto Health — Todos os direitos
        reservados.
      </div>
    </footer>
  )
}

export default FooterSimple
