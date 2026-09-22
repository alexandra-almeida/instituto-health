import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

// Anima o conteúdo com fade + subida suave (de baixo para cima) assim que
// ele entra na viewport ao rolar a página. Roda uma vez só por elemento —
// não repete se o usuário rolar pra cima e voltar a passar por ali.
//
// `amount: 'some'` (basta 1px do elemento aparecer) é proposital: com uma
// fração fixa (ex: 0.2 = 20%), um bloco muito alto — como o grid de
// produtos do Tulipia, que pode ter uma tela inteira de altura — nunca
// chega a ter 20% de SI MESMO visível ao mesmo tempo, então a animação
// nunca dispara e o conteúdo fica preso em opacity:0 (some da tela).
function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default ScrollReveal
