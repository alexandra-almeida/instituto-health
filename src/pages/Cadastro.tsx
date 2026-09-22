import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  EyeIcon,
  EyeOffIcon,
  HomeIcon,
  ShieldCheckIcon,
} from '../components/icons'

type Perfil = 'profissional' | 'homecare'

const PERFIL_LABEL: Record<Perfil, string> = {
  profissional: 'Profissional',
  homecare: 'Home Care',
}

const PERFIS: {
  key: Perfil
  badge: string
  title: string
  description: string
  Icon: typeof ShieldCheckIcon
}[] = [
  {
    key: 'profissional',
    badge: 'PROFISSIONAL',
    title: 'Profissional da Saúde e Estética',
    description:
      'Esteticistas, Fisioterapeutas, Biomédicos, Farmacêuticos, Enfermeiros e estudantes dessas áreas.',
    Icon: ShieldCheckIcon,
  },
  {
    key: 'homecare',
    badge: 'HOME CARE',
    title: 'Cliente Final',
    description:
      'Cuidados em casa ou para quem busca produtos e procedimentos para uso pessoal.',
    Icon: HomeIcon,
  },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------------------------------------------------------------------
// Indicador de progresso — "Passo X de 2" + barra de 2 segmentos.
// ---------------------------------------------------------------------
function StepProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-center text-xs font-medium tracking-wide text-verde-health/60 uppercase">
        Passo {step} de 2
      </p>
      <div className="flex gap-2">
        <div
          className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-dourado-health' : 'bg-verde-health/15'}`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-dourado-health' : 'bg-verde-health/15'}`}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Campos de texto/senha do Passo 2 — mesmo visual (rótulo, texto de
// ajuda/erro embaixo), a senha ganha um botão de olho pra mostrar/ocultar.
// ---------------------------------------------------------------------
interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  helper?: string
  error?: string
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  helper,
  error,
}: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-verde-health">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full rounded-xl border border-verde-health/20 bg-white px-4 py-2.5 text-sm text-verde-health placeholder:text-verde-health/35 focus:border-dourado-health focus:ring-2 focus:ring-dourado-health/25 focus:outline-none"
      />
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-verde-health/55">{helper}</span>
      ) : null}
    </label>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  helper,
  error,
}: FieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-verde-health">{label}</span>
      <span className="relative flex items-center">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-verde-health/20 bg-white px-4 py-2.5 pr-11 text-sm text-verde-health placeholder:text-verde-health/35 focus:border-dourado-health focus:ring-2 focus:ring-dourado-health/25 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 text-verde-health/50 hover:text-dourado-health"
        >
          {visible ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </span>
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-verde-health/55">{helper}</span>
      ) : null}
    </label>
  )
}

// ---------------------------------------------------------------------
// Passo 1 — escolha de perfil.
// ---------------------------------------------------------------------
function EscolhaPerfil({
  perfil,
  onSelect,
  onContinuar,
}: {
  perfil: Perfil | null
  onSelect: (perfil: Perfil) => void
  onContinuar: () => void
}) {
  return (
    <div>
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Qual é o seu perfil?
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Escolha o tipo de conta para personalizar sua experiência.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERFIS.map((item) => {
          const selected = perfil === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-colors ${
                selected
                  ? 'border-dourado-health bg-dourado-health/8'
                  : 'border-verde-health/15 bg-white hover:border-dourado-health/50'
              }`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  selected
                    ? 'bg-dourado-health text-verde-profundo'
                    : 'bg-verde-health/8 text-verde-health'
                }`}
              >
                <item.Icon className="h-7 w-7" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-dourado-health uppercase">
                {item.badge}
              </span>
              <span className="font-flatline text-base text-verde-health">
                {item.title}
              </span>
              <span className="text-xs leading-relaxed text-verde-health/70">
                {item.description}
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!perfil}
        onClick={onContinuar}
        className={`font-flatline mt-8 w-full rounded-full px-8 py-3 text-sm uppercase leading-none transition-colors ${
          perfil
            ? 'bg-verde-health text-offwhite hover:bg-verde-health/90'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        }`}
      >
        Continuar
      </button>

      <p className="mt-6 text-center text-sm text-verde-health/70">
        Já é cadastrado?{' '}
        <Link
          to="/login"
          className="font-medium text-dourado-health hover:underline"
        >
          Clique aqui para acessar a sua conta
        </Link>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Passo 2 — formulário de criação de conta.
// ---------------------------------------------------------------------
function CriarConta({
  perfil,
  onVoltar,
  onSuccess,
}: {
  perfil: Perfil
  onVoltar: () => void
  onSuccess: () => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const nomeValido = nome.trim().length >= 3
  const emailValido = EMAIL_REGEX.test(email.trim())
  const senhaValida = senha.length >= 8
  const senhasConferem = confirmarSenha.length > 0 && senha === confirmarSenha
  const formValido = nomeValido && emailValido && senhaValida && senhasConferem

  const emailError =
    email.length > 0 && !emailValido ? 'Digite um e-mail válido.' : undefined
  const senhaError =
    senha.length > 0 && !senhaValida
      ? 'A senha precisa ter no mínimo 8 caracteres.'
      : undefined
  const confirmarError =
    confirmarSenha.length > 0 && senha !== confirmarSenha
      ? 'As senhas não coincidem.'
      : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!formValido) return

    // TODO(backend): ainda não existe API de cadastro. Quando existir, a
    // chamada real (algo como POST /api/cadastro com { perfil, nome, email,
    // senha }) entra aqui — só chamar onSuccess() depois da confirmação do
    // servidor. Por enquanto isso é só uma simulação visual: nenhum dado
    // é enviado ou persistido em lugar nenhum (nem localStorage/sessionStorage).
    onSuccess()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-1 text-sm font-medium text-verde-health hover:text-dourado-health"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Voltar
        </button>
        <span className="inline-flex items-center gap-1 rounded-full bg-dourado-health/15 px-3 py-1 text-xs font-semibold text-dourado-health">
          ✓ {PERFIL_LABEL[perfil]}
        </span>
      </div>

      <div className="mt-6 text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Crie sua conta
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Preencha seus dados para finalizar o cadastro.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <TextField
          id="cadastro-nome"
          label="Nome e sobrenome*"
          value={nome}
          onChange={setNome}
          autoComplete="name"
          helper="Como vai aparecer no seu perfil."
        />
        <TextField
          id="cadastro-email"
          label="Seu e-mail*"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          helper="Usaremos pra confirmar sua conta e enviar novidades."
          error={emailError}
        />
        <PasswordField
          id="cadastro-senha"
          label="Senha (mín. 8 caracteres)*"
          value={senha}
          onChange={setSenha}
          autoComplete="new-password"
          helper="Use letras, números e símbolos pra deixar mais segura."
          error={senhaError}
        />
        <PasswordField
          id="cadastro-confirmar-senha"
          label="Repita a senha*"
          value={confirmarSenha}
          onChange={setConfirmarSenha}
          autoComplete="new-password"
          error={confirmarError}
        />

        <p className="text-xs leading-relaxed text-verde-health/60">
          Ao criar uma conta, você está de acordo com a nossa{' '}
          <Link
            to="/politica-de-privacidade"
            className="font-medium text-dourado-health hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={!formValido}
          className={`font-flatline w-full rounded-full px-8 py-3 text-sm uppercase leading-none transition-colors ${
            formValido
              ? 'bg-verde-health text-offwhite hover:bg-verde-health/90'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
        >
          Criar Conta
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------
// Tela de sucesso — sem backend ainda, é só a confirmação visual do fluxo.
// ---------------------------------------------------------------------
function ContaCriada() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verde-health/10 text-verde-health">
        <CheckCircleIcon className="h-9 w-9" />
      </span>
      <h1 className="font-flatline text-2xl text-verde-health">
        Conta criada com sucesso!
      </h1>
      <p className="max-w-sm text-sm text-verde-health/70">
        Em breve você poderá fazer login.
      </p>
      <Link
        to="/"
        className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Voltar para a home
      </Link>
    </div>
  )
}

function Cadastro() {
  const [step, setStep] = useState<1 | 2>(1)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const viewKey = submitted ? 'sucesso' : step

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      {!submitted && <StepProgress step={step} />}

      <AnimatePresence mode="wait">
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {submitted ? (
            <ContaCriada />
          ) : step === 1 ? (
            <EscolhaPerfil
              perfil={perfil}
              onSelect={setPerfil}
              onContinuar={() => perfil && setStep(2)}
            />
          ) : (
            perfil && (
              <CriarConta
                perfil={perfil}
                onVoltar={() => setStep(1)}
                onSuccess={() => setSubmitted(true)}
              />
            )
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

export default Cadastro
