import { motion } from 'motion/react'
import julianaRetrato from '../assets/juliana/juliana-retrato-sem-botoes.jpg'
import { WHATSAPP_NUMBER } from '../data/contact'

const MESSAGE = 'Olá! Gostaria de saber mais sobre os atendimentos da Juliana Gonella.'

// Página própria "Sobre" — a rota /juliana-gonella era só uma página de
// exemplo (placeholder); o conteúdo real da bio já existia era só o
// resumo usado no card da home (ver AboutHealthSection em Home.tsx).
// Aqui ele ganha uma página inteira, um pouco mais completa.
function Sobre() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <img
          src={julianaRetrato}
          alt="Juliana Gonella"
          className="h-32 w-32 shrink-0 rounded-full border-4 border-dourado-health/40 object-cover shadow-sm sm:h-40 sm:w-40"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-12 rounded-full bg-dourado-health" />
          <h1 className="font-flatline text-3xl leading-tight text-emerald-dark sm:text-4xl">
            Sobre a Juliana Gonella
          </h1>
        </div>

        <p className="text-sm text-emerald-dark/80 sm:text-base">
          Fisioterapeuta e esteticista, Juliana Gonella também é professora
          na Uniara, unindo prática clínica e formação acadêmica para
          oferecer um cuidado completo — da saúde à estética — com base em
          conhecimento técnico e humanização.
        </p>
        <p className="text-sm text-emerald-dark/80 sm:text-base">
          À frente do Instituto Health, Juliana reúne sob o mesmo teto os
          cuidados presenciais (fisioterapia e estética), o acompanhamento
          remoto por teleconsulta e a formação de outros profissionais
          através de cursos e workshops — sempre com o mesmo compromisso:
          cuidado técnico, próximo e humano.
        </p>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`}
          target="_blank"
          rel="noreferrer"
          className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-dourado-health px-8 py-3 text-sm leading-none text-emerald-dark transition-colors hover:bg-dourado-claro"
        >
          Falar pelo WhatsApp
        </a>
      </div>
    </motion.section>
  )
}

export default Sobre
