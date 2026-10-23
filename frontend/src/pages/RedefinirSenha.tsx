import { motion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AlertaDeFormulario from '../components/AlertaDeFormulario'
import CodigoInput from '../components/CodigoInput'
import { CheckCircleIcon } from '../components/icons'
import PasswordField from '../components/PasswordField'
import PrimaryButton from '../components/PrimaryButton'
import ReenviarCodigo from '../components/ReenviarCodigo'
import TextField from '../components/TextField'
import { ApiError, api } from '../lib/api'
import { codigoVazio } from '../lib/codigo'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Etapa = 'email' | 'codigo' | 'pronto'

function comoApiError(falha: unknown): ApiError {
  return falha instanceof ApiError
    ? falha
    : new ApiError(
        'erro_servidor',
        'Algo deu errado. Tente novamente em instantes.',
        0,
      )
}

// Recuperação de senha por código de 6 números (não por link): e-mail, depois
// código e nova senha. Não abre sessão: no fim a pessoa entra com a senha
// nova, e o backend encerra as sessões antigas.
function RedefinirSenha() {
  const location = useLocation()
  // O Login envia o e-mail digitado, para a pessoa não digitar de novo
  const emailInicial = (location.state as { email?: unknown } | null)?.email

  const [etapa, setEtapa] = useState<Etapa>('email')
  const [email, setEmail] = useState(
    typeof emailInicial === 'string' ? emailInicial : '',
  )
  const [digitos, setDigitos] = useState<string[]>(codigoVazio())
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<ApiError | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const emailValido = EMAIL_REGEX.test(email.trim())
  const codigoCompleto = digitos.every((digito) => digito.length === 1)
  const senhaValida = novaSenha.length >= 8
  const senhasConferem =
    confirmarSenha.length > 0 && novaSenha === confirmarSenha
  const formDoCodigoValido = codigoCompleto && senhaValida && senhasConferem

  const emailError =
    email.length > 0 && !emailValido ? 'Digite um e-mail válido.' : undefined
  const senhaError =
    novaSenha.length > 0 && !senhaValida
      ? 'A senha precisa ter no mínimo 8 caracteres.'
      : undefined
  const confirmarError =
    confirmarSenha.length > 0 && novaSenha !== confirmarSenha
      ? 'As senhas não coincidem.'
      : undefined

  async function handleEnviarCodigo(event: FormEvent) {
    event.preventDefault()
    if (!emailValido || enviando) return

    setEnviando(true)
    setErro(null)
    try {
      // O backend responde igual exista a conta ou não: seguimos para a
      // etapa do código sem revelar nada
      const resposta = await api.esqueciSenha(email.trim())
      setAviso(resposta.mensagem)
      setEtapa('codigo')
    } catch (falha) {
      setErro(comoApiError(falha))
    } finally {
      setEnviando(false)
    }
  }

  async function handleReenviar(): Promise<boolean> {
    setErro(null)
    try {
      const resposta = await api.esqueciSenha(email.trim())
      setAviso(resposta.mensagem)
      return true
    } catch (falha) {
      setErro(comoApiError(falha))
      return false
    }
  }

  async function handleRedefinir(event: FormEvent) {
    event.preventDefault()
    if (!formDoCodigoValido || enviando) return

    setEnviando(true)
    setErro(null)
    try {
      await api.redefinirSenha({
        email: email.trim(),
        codigo: digitos.join(''),
        novaSenha,
      })
      // Não guardamos a senha depois de usada
      setNovaSenha('')
      setConfirmarSenha('')
      setEtapa('pronto')
    } catch (falha) {
      setErro(comoApiError(falha))
    } finally {
      setEnviando(false)
    }
  }

  function handleOutroEmail() {
    setEtapa('email')
    setDigitos(codigoVazio())
    setNovaSenha('')
    setConfirmarSenha('')
    setErro(null)
    setAviso(null)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      {etapa === 'email' && (
        <div>
          <div className="text-center">
            <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
              Redefinir senha
            </h1>
            <p className="mt-2 text-sm text-verde-health/70">
              Informe o e-mail da sua conta e enviaremos um código de 6 números.
            </p>
          </div>

          <form
            onSubmit={handleEnviarCodigo}
            className="mt-8 flex flex-col gap-5"
          >
            <TextField
              id="redefinir-email"
              label="Seu e-mail*"
              type="email"
              value={email}
              onChange={(valor) => {
                setEmail(valor)
                setErro(null)
              }}
              autoComplete="email"
              error={emailError}
            />

            {erro && (
              <AlertaDeFormulario variante="erro">
                {erro.message}
              </AlertaDeFormulario>
            )}

            <PrimaryButton type="submit" disabled={!emailValido || enviando}>
              {enviando ? 'Enviando...' : 'Enviar código'}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-verde-health/70">
            Lembrou a senha?{' '}
            <Link
              to="/login"
              className="font-medium text-dourado-health hover:underline"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      )}

      {etapa === 'codigo' && (
        <div>
          <div className="text-center">
            <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
              Crie uma nova senha
            </h1>
            <p className="mt-2 text-sm text-verde-health/70">
              Digite o código de 6 números enviado para{' '}
              <span className="font-medium text-verde-health">
                {email.trim()}
              </span>{' '}
              e escolha a nova senha.
            </p>
          </div>

          <form onSubmit={handleRedefinir} className="mt-8 flex flex-col gap-5">
            <CodigoInput
              digitos={digitos}
              onChange={(proximo) => {
                setDigitos(proximo)
                setErro(null)
              }}
              disabled={enviando}
            />

            <PasswordField
              id="redefinir-nova-senha"
              label="Nova senha (mín. 8 caracteres)*"
              value={novaSenha}
              onChange={(valor) => {
                setNovaSenha(valor)
                setErro(null)
              }}
              autoComplete="new-password"
              error={senhaError}
            />
            <PasswordField
              id="redefinir-confirmar-senha"
              label="Repita a nova senha*"
              value={confirmarSenha}
              onChange={setConfirmarSenha}
              autoComplete="new-password"
              error={confirmarError}
            />

            {aviso && !erro && <AlertaDeFormulario>{aviso}</AlertaDeFormulario>}
            {erro && (
              <AlertaDeFormulario variante="erro">
                {erro.message}
              </AlertaDeFormulario>
            )}

            <PrimaryButton
              type="submit"
              disabled={!formDoCodigoValido || enviando}
            >
              {enviando ? 'Salvando...' : 'Redefinir senha'}
            </PrimaryButton>
          </form>

          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            <ReenviarCodigo onReenviar={handleReenviar} />
            <button
              type="button"
              onClick={handleOutroEmail}
              className="text-xs font-medium text-verde-health/60 hover:text-dourado-health"
            >
              Usar outro e-mail
            </button>
          </div>
        </div>
      )}

      {etapa === 'pronto' && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verde-health/10 text-verde-health">
            <CheckCircleIcon className="h-9 w-9" />
          </span>
          <h1 className="font-flatline text-2xl text-verde-health">
            Senha alterada!
          </h1>
          <p className="max-w-sm text-sm text-verde-health/70">
            Entre com a sua nova senha. Por segurança, as sessões abertas em
            outros aparelhos foram encerradas.
          </p>
          <Link
            to="/login"
            className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
          >
            Ir para o login
          </Link>
        </div>
      )}
    </motion.section>
  )
}

export default RedefinirSenha
