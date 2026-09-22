import { motion } from 'motion/react'
import bgFisioterapiaExplicacao from '../assets/hero-bg/bg-2-fisioterapia-explicacao.jpg'
import bgMassagemFacial from '../assets/hero-bg/bg-3-massagem-facial.jpg'
import FadedImage from '../components/FadedImage'
import ScrollReveal from '../components/ScrollReveal'
import { WHATSAPP_NUMBER } from '../data/contact'

const PROCEDIMENTOS = [
  {
    id: 'fisioterapia',
    image: bgFisioterapiaExplicacao,
    title: 'Fisioterapia',
    description:
      'Atendimento fisioterapêutico presencial, com avaliação individualizada e técnicas manuais para alívio de dor, reabilitação e bem-estar do corpo.',
    message: 'Olá! Gostaria de agendar uma sessão de fisioterapia.',
  },
  {
    id: 'estetica-presencial',
    image: bgMassagemFacial,
    title: 'Estética Presencial',
    description:
      'Procedimentos estéticos faciais e corporais realizados presencialmente no Instituto, com tecnologia e cuidado personalizado para cada tipo de pele.',
    message: 'Olá! Gostaria de agendar um procedimento estético presencial.',
  },
]

// Cuidados presenciais — fisioterapia e estética feitas no próprio
// Instituto (por isso a rota própria, separada da Teleconsulta, que é
// remota). Cada card usa uma foto com fade nas bordas (FadedImage) em vez
// de um ícone, pra dar mais presença visual a esse tipo de atendimento.
function Procedimentos() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-1 w-12 rounded-full bg-dourado-health" />
        <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
          Procedimentos
        </h1>
        <p className="max-w-xl text-sm text-emerald-dark/70 sm:text-base">
          Atendimentos presenciais no Instituto Health — fisioterapia e
          estética, com acompanhamento próximo e personalizado.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {PROCEDIMENTOS.map(({ id, image, title, description, message }, index) => (
          <ScrollReveal key={id} delay={index * 0.1}>
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-emerald-dark/10 bg-white p-6 text-center shadow-sm sm:p-8">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <FadedImage
                  src={image}
                  alt=""
                  className="h-full w-full rounded-full"
                />
              </div>
              <h2 className="font-flatline text-xl leading-tight text-emerald-dark">
                {title}
              </h2>
              <p className="text-sm text-emerald-dark/70 sm:text-base">
                {description}
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-6 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-emerald-dark/90"
              >
                Agendar pelo WhatsApp
              </a>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </motion.section>
  )
}

export default Procedimentos
