import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

// Placeholder simples — ainda não existe backend de autenticação. Só serve
// pra /cadastro ter um destino real pro link "Já é cadastrado?".
function Login() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
    >
      <h1 className="font-flatline text-4xl text-verde-health">Entrar</h1>
      <p className="max-w-md text-sm text-verde-health/70">
        Página de login em construção — em breve você poderá acessar sua
        conta por aqui.
      </p>
      <Link
        to="/cadastro"
        className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Criar uma conta
      </Link>
    </motion.section>
  )
}

export default Login
