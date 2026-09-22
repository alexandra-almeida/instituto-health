import { motion } from 'motion/react'

function Cadastro() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
    >
      <h1 className="text-4xl font-semibold tracking-tight text-emerald-dark">
        Cadastro
      </h1>
      <p className="max-w-md text-slate-600">
        Página de exemplo para validar a navegação para o Cadastro.
      </p>
    </motion.section>
  )
}

export default Cadastro
