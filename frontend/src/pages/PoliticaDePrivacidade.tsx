import { motion } from 'motion/react'

// Conteúdo placeholder — o texto jurídico real ainda precisa ser escrito
// (ou revisado por quem cuida disso na empresa). Existe pra o link da
// página de cadastro ter um destino de verdade.
function PoliticaDePrivacidade() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto max-w-2xl py-10"
    >
      <h1 className="font-flatline text-3xl text-verde-health">
        Política de Privacidade
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-verde-health/70">
        Esta página está em construção. Em breve, o texto completo sobre
        como o Instituto Health coleta, usa e protege os seus dados
        pessoais estará disponível aqui.
      </p>
    </motion.section>
  )
}

export default PoliticaDePrivacidade
