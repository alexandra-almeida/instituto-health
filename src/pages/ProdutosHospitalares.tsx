import { motion } from 'motion/react'

function ProdutosHospitalares() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
    >
      <h1 className="text-4xl font-semibold tracking-tight text-emerald-dark">
        Descartáveis Para Clínicas
      </h1>
      <p className="max-w-md text-slate-600">
        Página de exemplo para validar a navegação para Descartáveis Para
        Clínicas.
      </p>
    </motion.section>
  )
}

export default ProdutosHospitalares
