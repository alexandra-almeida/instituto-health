import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { CheckCircleIcon } from '../components/icons'

// Placeholder — a página real de confirmação (número do pedido, prazo,
// dados de pagamento Pix/cartão, etc.) é a próxima etapa. Por enquanto só
// confirma que o pedido foi "recebido" (nada é persistido de verdade ainda,
// ver comentário TODO(backend) em Checkout.tsx).
function PedidoConfirmado() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verde-health/10 text-verde-health">
        <CheckCircleIcon className="h-9 w-9" strokeWidth={1.6} />
      </span>
      <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
        Pedido recebido!
      </h1>
      <p className="max-w-sm text-sm text-verde-health/70">
        Em breve entraremos em contato.
      </p>
      <Link
        to="/"
        className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Voltar para a home
      </Link>
    </motion.section>
  )
}

export default PedidoConfirmado
