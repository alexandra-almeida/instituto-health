import { motion } from 'motion/react'
import teleconsultaCena from '../assets/juliana/teleconsulta-cena-completa.jpg'
import { VideoCallIcon } from '../components/icons'
import { WHATSAPP_NUMBER } from '../data/contact'

const MESSAGE = 'Olá! Gostaria de agendar uma teleconsulta.'

// Consulta online de estética — atendimento remoto, sem precisar ir até o
// Instituto. Página própria (antes era um card dentro de /servicos).
function Teleconsulta() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex w-full flex-col items-center py-10 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-dark/8 text-emerald-dark">
        <VideoCallIcon className="h-8 w-8" />
      </span>
      <div className="mt-4 h-1 w-12 rounded-full bg-dourado-health" />
      <h1 className="font-flatline mt-3 text-3xl leading-tight text-emerald-dark sm:text-4xl">
        Teleconsulta
      </h1>

      <div className="mt-6 w-full max-w-lg overflow-hidden rounded-2xl shadow-[0_2px_14px_-4px_rgba(4,32,18,0.12)]">
        <img
          src={teleconsultaCena}
          alt="Teleconsulta com a equipe HEALTH por videochamada"
          className="h-auto w-full object-cover"
        />
      </div>

      <p className="mt-6 max-w-xl text-sm text-emerald-dark/70 sm:text-base">
        Atendimento remoto por videochamada, para acompanhamento, orientação
        e retorno de tratamento estético sem precisar sair de casa.
      </p>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`}
        target="_blank"
        rel="noreferrer"
        className="font-flatline mt-6 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Agendar teleconsulta
      </a>
    </motion.section>
  )
}

export default Teleconsulta
