import { motion } from 'motion/react'
import { GraduationCapIcon } from '../components/icons'
import { WHATSAPP_NUMBER } from '../data/contact'

const MESSAGE = 'Olá! Tenho interesse em me inscrever nos cursos do Instituto Health.'

// Cursos e workshops de capacitação, ministrados pela Juliana Gonella —
// página própria (antes era um card dentro de /servicos).
function Cursos() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex w-full flex-col items-center py-10 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-dark/8 text-emerald-dark">
        <GraduationCapIcon className="h-8 w-8" />
      </span>
      <div className="mt-4 h-1 w-12 rounded-full bg-dourado-health" />
      <h1 className="font-flatline mt-3 text-3xl leading-tight text-emerald-dark sm:text-4xl">
        Cursos
      </h1>
      <p className="mt-3 max-w-xl text-sm text-emerald-dark/70 sm:text-base">
        Cursos e workshops de capacitação em estética e fisioterapia,
        ministrados pela Juliana Gonella — para profissionais que querem
        aprofundar técnicas e conhecimento.
      </p>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`}
        target="_blank"
        rel="noreferrer"
        className="font-flatline mt-6 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Inscrever-se
      </a>
    </motion.section>
  )
}

export default Cursos
