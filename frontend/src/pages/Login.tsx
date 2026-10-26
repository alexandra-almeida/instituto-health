import { motion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import AlertaDeFormulario from '../components/AlertaDeFormulario'
import PasswordField from '../components/PasswordField'
import PrimaryButton from '../components/PrimaryButton'
import TextField from '../components/TextField'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../lib/api'
import { destinoDoLogin } from '../lib/destino'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Página de login. A sessão é aberta pelo backend em cookies httpOnly (ver
// src/lib/api.ts e src/context/AuthContext.tsx); aqui nunca passa token. Mesmos
// componentes de campo/botão do Cadastro (TextField, PasswordField,
// PrimaryButton).
function Login() {
  const { status, entrar } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<ApiError | null>(null)
  const [enviando, setEnviando] = useState(false)

  const emailValido = EMAIL_REGEX.test(email.trim())
  const formValido = emailValido && senha.length > 0

  const emailError =
    email.length > 0 && !emailValido ? 'Digite um e-mail válido.' : undefined

  // Destino depois de entrar: ?destino=/carrinho ou o estado da navegação
  // (state.from). Sem nenhum destino vai para Minha Conta; com destino, só
  // caminho interno do site é aceito (ver lib/destino.ts) e qualquer outra
  // coisa vira "/".
  const origem = (location.state as { from?: unknown } | null)?.from
  const destino = destinoDoLogin(searchParams.get('destino') ?? origem)

  // Quem já está logado (ou acabou de entrar) sai desta tela
  if (status === 'logado') return <Navigate to={destino} replace />

  function handleChangeEmail(value: string) {
    setEmail(value)
    setErro(null)
  }

  function handleChangeSenha(value: string) {
    setSenha(value)
    setErro(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!formValido || enviando) return

    setEnviando(true)
    setErro(null)
    try {
      // Sucesso: o AuthContext passa a 'logado' e o <Navigate> acima leva ao
      // destino
      await entrar(email.trim(), senha)
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha
          : new ApiError(
              'erro_servidor',
              'Algo deu errado. Tente novamente em instantes.',
              0,
            ),
      )
      setEnviando(false)
    }
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
          <Link
            to="/redefinir-senha"
            state={{ email: email.trim() }}
            className="text-xs font-medium text-dourado-health hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        {erro && (
          <AlertaDeFormulario variante="erro">
            <p>{erro.message}</p>
            {erro.codigo === 'email_nao_confirmado' && (
              // Abre o Cadastro direto na confirmação do código, com o e-mail
              // já preenchido
              <Link
                to="/cadastro"
                state={{ confirmarEmail: email.trim() }}
                className="mt-2 inline-block font-medium text-dourado-health hover:underline"
              >
                Confirmar meu e-mail
              </Link>
            )}
          </AlertaDeFormulario>
        )}

        <PrimaryButton type="submit" disabled={!formValido || enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
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
