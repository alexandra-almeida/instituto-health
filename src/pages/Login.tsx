import { motion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import PasswordField from '../components/PasswordField'
import PrimaryButton from '../components/PrimaryButton'
import TextField from '../components/TextField'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Aviso = 'login' | 'esqueci-senha'

const AVISO_TEXTO: Record<Aviso, string> = {
  login: 'O acesso à conta estará disponível em breve.',
  'esqueci-senha':
    'A recuperação de senha estará disponível em breve. Enquanto isso, fale com a gente pelo WhatsApp.',
}

// Página de login — só interface, ainda não existe backend de autenticação
// (ver TODO(backend) abaixo). Mesmos componentes de campo/botão do
// Cadastro (ver src/components/TextField.tsx, PasswordField.tsx,
// PrimaryButton.tsx), extraídos de lá pra serem reaproveitados aqui.
function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const emailValido = EMAIL_REGEX.test(email.trim())
  const formValido = emailValido && senha.length > 0

  const emailError =
    email.length > 0 && !emailValido ? 'Digite um e-mail válido.' : undefined

  function handleChangeEmail(value: string) {
    setEmail(value)
    setAviso(null)
  }

  function handleChangeSenha(value: string) {
    setSenha(value)
    setAviso(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!formValido) return

    // TODO(backend): ainda não existe API de autenticação. Quando existir, a
    // chamada real (algo como POST /api/login com { email, senha }) entra
    // aqui — só então redirecionar pra área logada. Por enquanto nenhum
    // dado é enviado ou persistido em lugar nenhum (nem localStorage/
    // sessionStorage), e o login nunca é simulado como bem-sucedido.
    setAviso('login')
  }

  function handleEsqueciSenha() {
    // TODO(backend): ainda não existe fluxo de recuperação de senha. Quando
    // existir, o envio do e-mail de redefinição (ex: POST
    // /api/recuperar-senha com { email }) entra aqui.
    setAviso('esqueci-senha')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Entrar
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Acesse sua conta para acompanhar pedidos e favoritos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <TextField
          id="login-email"
          label="Seu e-mail*"
          type="email"
          value={email}
          onChange={handleChangeEmail}
          autoComplete="email"
          error={emailError}
        />

        <PasswordField
          id="login-senha"
          label="Senha*"
          value={senha}
          onChange={handleChangeSenha}
          autoComplete="current-password"
        />

        <div className="-mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleEsqueciSenha}
            className="text-xs font-medium text-dourado-health hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {aviso && (
          <div
            role="status"
            className="rounded-2xl border border-[#04452E]/10 bg-verde-health/5 px-4 py-3 text-sm leading-relaxed text-verde-health shadow-[0_2px_10px_-4px_rgba(4,32,18,0.06)] backdrop-blur-sm"
          >
            {AVISO_TEXTO[aviso]}
          </div>
        )}

        <PrimaryButton type="submit" disabled={!formValido}>
          Entrar
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-verde-health/70">
        Ainda não tem conta?{' '}
        <Link
          to="/cadastro"
          className="font-medium text-dourado-health hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </motion.section>
  )
}

export default Login
