import { WHATSAPP_NUMBER } from '../data/contact'
import {
  FacebookIcon,
  InstagramIcon,
  WhatsappIcon,
} from './icons'

function Footer() {
  return (
    <footer className="mt-16 bg-verde-profundo text-offwhite/90">
      <div className="mx-auto grid max-w-375 gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <p className="font-poppins text-lg font-semibold tracking-wide text-gold uppercase">
            Instituto Health
          </p>
          <p className="mt-3 max-w-xs text-sm text-offwhite/70">
            Conhecimento que cura, cuidado que transforma.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gold uppercase">
            Contato
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-offwhite/80">
            <li>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold"
              >
                <WhatsappIcon className="h-4 w-4" />
                (16) 99730-4585
              </a>
            </li>
            <li>
              <a
                href="mailto:contato@institutohealth.com.br"
                className="hover:text-gold"
              >
                contato@institutohealth.com.br
              </a>
            </li>
            <li>Rincão — SP</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gold uppercase">
            Horário de atendimento
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-offwhite/80">
            <li>Segunda a sexta: 8h às 18h</li>
            <li>Sábado: 8h às 12h</li>
            <li>Domingo: fechado</li>
          </ul>

          <h3 className="mt-6 text-sm font-semibold tracking-wide text-gold uppercase">
            Formas de pagamento
          </h3>
          <p className="mt-3 text-sm text-offwhite/80">
            Pix · Cartão de crédito · Cartão de débito · Boleto
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gold uppercase">
            Redes sociais
          </h3>
          <div className="mt-3 flex gap-3">
            <a
              href="https://www.instagram.com/health_instituto/"
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
      </div>

      <div className="border-t border-offwhite/10 py-4 text-center text-xs text-offwhite/50">
        © {new Date().getFullYear()} Instituto Health. Todos os direitos
        reservados.
      </div>
    </footer>
  )
}

export default Footer
