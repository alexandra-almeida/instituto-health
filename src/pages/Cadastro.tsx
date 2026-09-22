import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  EyeIcon,
  EyeOffIcon,
  FileIcon,
  HomeIcon,
  ShieldCheckIcon,
  UploadIcon,
} from '../components/icons'
import { WHATSAPP_NUMBER } from '../data/contact'

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

// Profissões que a Tulípia/Instituto Health não reconhece como "profissional
// da estética" pra fins de conta profissional — mostradas como aviso antes
// do upload, pra quem não se encaixa já saber de cara.
const PROFISSOES_INVALIDAS = [
  'Cabeleireiro',
  'Tatuador',
  'Depilador',
  'Micropigmentador',
  'Maquiador',
  'Aromaterapeuta',
  'Designer de Unhas',
  'Designer de Sobrancelhas',
  'Educador Físico',
  'Psicólogo',
  'Designer de Cílios',
  'Manicure e Pedicure',
  'Epilador',
  'Podólogo',
]

const COMPROVANTE_ACCEPT =
  '.jpg,.jpeg,.png,.heic,.pdf,image/jpeg,image/png,image/heic,application/pdf'

const CODIGO_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 30

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
  onSuccess: (email: string) => void
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
    // senha }) entra aqui — só avançar depois da confirmação do servidor
    // (que também dispararia o envio do código de verificação por e-mail).
    // Por enquanto isso é só uma simulação visual: nenhum dado é enviado ou
    // persistido em lugar nenhum (nem localStorage/sessionStorage).
    onSuccess(email)
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
// Confirmação de e-mail — entre "Crie sua conta" e o resto do fluxo.
// Vale pros dois perfis (Profissional e Home Care), não é exclusiva de
// nenhum. 6 caixinhas de 1 dígito cada, com avanço automático de foco.
// ---------------------------------------------------------------------
function ConfirmacaoEmail({
  email,
  onConfirmado,
}: {
  email: string
  onConfirmado: () => void
}) {
  const [digitos, setDigitos] = useState<string[]>(
    Array(CODIGO_LENGTH).fill(''),
  )
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const codigoCompleto = digitos.every((digito) => digito.length === 1)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  function handleChange(index: number, value: string) {
    const digito = value.replace(/\D/g, '').slice(-1)
    setDigitos((current) => {
      const next = [...current]
      next[index] = digito
      return next
    })
    if (digito && index < CODIGO_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const colado = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODIGO_LENGTH)
    if (!colado) return
    event.preventDefault()
    const next = Array(CODIGO_LENGTH).fill('')
    for (let i = 0; i < colado.length; i++) next[i] = colado[i]
    setDigitos(next)
    inputsRef.current[Math.min(colado.length, CODIGO_LENGTH) - 1]?.focus()
  }

  function handleReenviar() {
    if (resendCooldown > 0) return
    // TODO(backend): ainda não existe envio real de e-mail — quando existir,
    // o reenvio de verdade do código entra aqui. Por enquanto só reinicia o
    // timer visual, sem reenviar nada.
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
  }

  function handleConfirmar() {
    if (!codigoCompleto) return
    // TODO(backend): ainda não existe backend nem envio real de código por
    // e-mail. Quando existir, a validação de verdade do código digitado
    // (ex: POST /api/cadastro/confirmar-email com { email, codigo }) entra
    // aqui — só chamar onConfirmado() depois da confirmação do servidor.
    // Por enquanto qualquer sequência de 6 dígitos avança o fluxo.
    onConfirmado()
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Confirme seu e-mail
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Enviamos um código de 6 números para{' '}
          <span className="font-medium text-verde-health">{email}</span>
        </p>
      </div>

      <div className="mt-8 flex justify-center gap-2 xs:gap-3">
        {digitos.map((digito, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digito}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            aria-label={`Dígito ${index + 1} do código`}
            className="h-12 w-10 rounded-xl border border-verde-health/20 bg-white text-center text-lg font-semibold text-verde-health focus:border-dourado-health focus:ring-2 focus:ring-dourado-health/25 focus:outline-none xs:h-14 xs:w-12"
          />
        ))}
      </div>

      <button
        type="button"
        disabled={!codigoCompleto}
        onClick={handleConfirmar}
        className={`font-flatline mt-8 w-full rounded-full px-8 py-3 text-sm uppercase leading-none transition-colors ${
          codigoCompleto
            ? 'bg-verde-health text-offwhite hover:bg-verde-health/90'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        }`}
      >
        Confirmar código
      </button>

      <p className="mt-4 text-center text-xs text-verde-health/55">
        O código pode levar um minuto para chegar. Confira também a caixa de
        spam.
      </p>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleReenviar}
          disabled={resendCooldown > 0}
          className={`text-sm font-medium ${
            resendCooldown > 0
              ? 'cursor-not-allowed text-verde-health/40'
              : 'text-dourado-health hover:underline'
          }`}
        >
          {resendCooldown > 0
            ? `Reenviar código em ${resendCooldown}s`
            : 'Reenviar código'}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-verde-health/55">
        Precisa de ajuda?{' '}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-dourado-health hover:underline"
        >
          Fale com a gente
        </a>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Comprovante Profissional — só pra quem escolheu perfil "Profissional".
// ---------------------------------------------------------------------
function ComprovanteProfissional({
  onFinalizar,
  onSwitchToHomeCare,
}: {
  onFinalizar: () => void
  onSwitchToHomeCare: () => void
}) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [confirmado, setConfirmado] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const podeFinalizar = arquivo !== null && confirmado

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setArquivo(event.target.files?.[0] ?? null)
  }

  function handleRemoverArquivo() {
    setArquivo(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFinalizar() {
    if (!podeFinalizar) return
    // TODO(backend): ainda não existe upload real. Quando existir, o envio
    // do arquivo (ex: POST multipart/form-data pra /api/cadastro/comprovante)
    // entra aqui — só chamar onFinalizar() depois da confirmação do
    // servidor. Por enquanto o arquivo escolhido (`arquivo`) nunca sai do
    // navegador: não é enviado nem salvo em lugar nenhum, é só validação
    // visual da interface.
    onFinalizar()
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Comprovante Profissional
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Envie seu certificado, diploma ou comprovante de aptidão para
          validar sua conta profissional.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-verde-health/15 bg-verde-health/5 p-4">
        <p className="text-sm font-medium text-verde-health">
          Profissões não válidas para conta profissional:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROFISSOES_INVALIDAS.map((profissao) => (
            <span
              key={profissao}
              className="rounded-full border border-verde-health/20 bg-white px-3 py-1 text-xs text-verde-health/70"
            >
              {profissao}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-flatline flex items-center gap-2 text-base text-verde-health">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-health text-xs text-offwhite">
            1
          </span>
          Selecione seu comprovante
        </h2>
        <p className="mt-2 ml-8 text-sm text-verde-health/70">
          Certificados de cursos da área de estética com somatória mínima de
          100h/aula.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={COMPROVANTE_ACCEPT}
          onChange={handleFileChange}
          className="sr-only"
        />

        {arquivo ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-verde-health/20 bg-white px-4 py-3.5">
            <span className="flex min-w-0 items-center gap-2.5 text-sm text-verde-health">
              <FileIcon className="h-5 w-5 shrink-0 text-dourado-health" />
              <span className="truncate">{arquivo.name}</span>
            </span>
            <button
              type="button"
              onClick={handleRemoverArquivo}
              className="shrink-0 text-xs font-medium text-verde-health/60 hover:text-dourado-health"
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-verde-health/25 px-6 py-8 text-center transition-colors hover:border-dourado-health"
          >
            <UploadIcon className="h-7 w-7 text-verde-health/50" />
            <span className="text-sm font-medium text-verde-health">
              Clique para selecionar o arquivo
            </span>
            <span className="text-xs text-verde-health/55">
              JPG, PNG, HEIC (iPhone) ou PDF
            </span>
          </button>
        )}
      </div>

      <div className="mt-6">
        <h2 className="font-flatline flex items-center gap-2 text-base text-verde-health">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-health text-xs text-offwhite">
            2
          </span>
          Confirme a veracidade
        </h2>

        <label className="mt-3 ml-8 flex items-start gap-2.5 text-sm text-verde-health/80">
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(event) => setConfirmado(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-dourado-health"
          />
          <span>
            Afirmo para todos os efeitos e sob pena da lei, que o documento
            enviado pertence a mim e é verídico.
          </span>
        </label>

        <div className="mt-3 ml-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <strong className="font-semibold">Atenção:</strong> Seu comprovante
          será revisado na primeira compra. Caso não esteja de acordo com
          nosso termo de uso, a compra poderá ser cancelada.
        </div>
      </div>

      <button
        type="button"
        disabled={!podeFinalizar}
        onClick={handleFinalizar}
        className={`font-flatline mt-8 w-full rounded-full px-8 py-3 text-sm uppercase leading-none transition-colors ${
          podeFinalizar
            ? 'bg-verde-health text-offwhite hover:bg-verde-health/90'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        }`}
      >
        Finalizar Cadastro
      </button>

      <button
        type="button"
        onClick={onSwitchToHomeCare}
        className="mt-4 w-full rounded-2xl border border-verde-health/15 bg-white px-4 py-3 text-left text-sm text-verde-health/70 transition-colors hover:border-dourado-health/50"
      >
        Não é profissional da estética? Sem problema. Sua conta passa para
        Home Care agora e você segue comprando com preço de cliente final.
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------
// Tela de sucesso — sem backend ainda, é só a confirmação visual do fluxo.
// ---------------------------------------------------------------------
function ContaCriada({ variant }: { variant: 'padrao' | 'profissional' }) {
  const titulo =
    variant === 'profissional' ? 'Conta criada!' : 'Conta criada com sucesso!'
  const mensagem =
    variant === 'profissional'
      ? 'Seu comprovante será analisado na primeira compra.'
      : 'Em breve você poderá fazer login.'

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verde-health/10 text-verde-health">
        <CheckCircleIcon className="h-9 w-9" />
      </span>
      <h1 className="font-flatline text-2xl text-verde-health">{titulo}</h1>
      <p className="max-w-sm text-sm text-verde-health/70">{mensagem}</p>
      <Link
        to="/"
        className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
      >
        Voltar para a home
      </Link>
    </div>
  )
}

// Passo 1 e 2 são o fluxo base (indicador "Passo X de 2"); "confirmacao-
// email" e "comprovante" são etapas extras — a confirmação de e-mail vale
// pros dois perfis, o comprovante só pra profissional — por isso nenhuma
// das duas entra na contagem do indicador (fica escondido nelas e no
// sucesso).
type View =
  | 'perfil'
  | 'dados'
  | 'confirmacao-email'
  | 'comprovante'
  | 'sucesso'

function Cadastro() {
  const [view, setView] = useState<View>('perfil')
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [email, setEmail] = useState('')
  const [successVariant, setSuccessVariant] = useState<
    'padrao' | 'profissional'
  >('padrao')

  function handleDadosConcluidos(emailConfirmado: string) {
    setEmail(emailConfirmado)
    setView('confirmacao-email')
  }

  function handleEmailConfirmado() {
    // Home Care termina o cadastro aqui mesmo; Profissional ainda passa
    // pela etapa de comprovante antes da tela de sucesso.
    if (perfil === 'profissional') {
      setView('comprovante')
    } else {
      setSuccessVariant('padrao')
      setView('sucesso')
    }
  }

  function handleComprovanteFinalizado() {
    setSuccessVariant('profissional')
    setView('sucesso')
  }

  function handleSwitchToHomeCare() {
    setPerfil('homecare')
    setSuccessVariant('padrao')
    setView('sucesso')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl py-8 sm:py-12"
    >
      {(view === 'perfil' || view === 'dados') && (
        <StepProgress step={view === 'perfil' ? 1 : 2} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {view === 'perfil' && (
            <EscolhaPerfil
              perfil={perfil}
              onSelect={setPerfil}
              onContinuar={() => perfil && setView('dados')}
            />
          )}

          {view === 'dados' && perfil && (
            <CriarConta
              perfil={perfil}
              onVoltar={() => setView('perfil')}
              onSuccess={handleDadosConcluidos}
            />
          )}

          {view === 'confirmacao-email' && (
            <ConfirmacaoEmail
              email={email}
              onConfirmado={handleEmailConfirmado}
            />
          )}

          {view === 'comprovante' && (
            <ComprovanteProfissional
              onFinalizar={handleComprovanteFinalizado}
              onSwitchToHomeCare={handleSwitchToHomeCare}
            />
          )}

          {view === 'sucesso' && <ContaCriada variant={successVariant} />}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

export default Cadastro
