import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AlertaDeFormulario from '../components/AlertaDeFormulario'
import CodigoInput from '../components/CodigoInput'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  FileIcon,
  HomeIcon,
  ShieldCheckIcon,
  UploadIcon,
} from '../components/icons'
import PasswordField from '../components/PasswordField'
import PrimaryButton from '../components/PrimaryButton'
import ReenviarCodigo from '../components/ReenviarCodigo'
import TextField from '../components/TextField'
import { useAuth } from '../context/useAuth'
import { WHATSAPP_NUMBER } from '../data/contact'
import { ApiError, api } from '../lib/api'
import type { PerfilDaConta } from '../lib/api'
import { RESEND_COOLDOWN_SECONDS, codigoVazio } from '../lib/codigo'

type Perfil = 'profissional' | 'homecare'

// Dados do passo 2. Ficam só em memória (estado do React), nunca em
// localStorage ou sessionStorage: a senha em especial só existe até a chamada
// de cadastro e é descartada logo depois.
interface DadosConta {
  nome: string
  email: string
  senha: string
}

function comoApiError(falha: unknown): ApiError {
  return falha instanceof ApiError
    ? falha
    : new ApiError(
        'erro_servidor',
        'Algo deu errado. Tente novamente em instantes.',
        0,
      )
}

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
              className={`flex flex-col items-center gap-3 rounded-2xl border bg-white/70 p-6 text-center backdrop-blur-sm transition-all ${
                selected
                  ? 'border-dourado-health/70 bg-dourado-health/8 shadow-[0_4px_20px_-4px_rgba(202,160,45,0.35)]'
                  : 'border-[#04452E]/10 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] hover:border-dourado-health/40'
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

      <PrimaryButton className="mt-8" disabled={!perfil} onClick={onContinuar}>
        Continuar
      </PrimaryButton>

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
  inicial,
  onVoltar,
  onEnviar,
}: {
  perfil: Perfil
  /** nome e e-mail já digitados, quando a pessoa volta de uma tela seguinte */
  inicial: { nome: string; email: string } | null
  onVoltar: () => void
  /** pode lançar ApiError (Home Care cria a conta aqui); a tela mostra */
  onEnviar: (dados: DadosConta) => Promise<void>
}) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<ApiError | null>(null)
  const [enviando, setEnviando] = useState(false)

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!formValido || enviando) return

    setEnviando(true)
    setErro(null)
    try {
      // Home Care cria a conta agora (e o servidor envia o código por e-mail);
      // Profissional só guarda os dados e segue para o comprovante, a conta é
      // criada no fim dessa tela (ver Cadastro, abaixo)
      await onEnviar({ nome: nome.trim(), email: email.trim(), senha })
    } catch (falha) {
      setErro(comoApiError(falha))
      setEnviando(false)
    }
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

        {erro && (
          <AlertaDeFormulario variante="erro">
            {erro.message}
          </AlertaDeFormulario>
        )}

        <PrimaryButton type="submit" disabled={!formValido || enviando}>
          {enviando ? 'Criando conta...' : 'Criar Conta'}
        </PrimaryButton>
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
  cooldownInicial,
  onConfirmado,
}: {
  email: string
  /** segundos até liberar o reenvio; 0 quando a pessoa chegou pelo Login */
  cooldownInicial: number
  onConfirmado: (perfil: PerfilDaConta) => void
}) {
  const { confirmarEmail } = useAuth()
  const [digitos, setDigitos] = useState<string[]>(codigoVazio())
  const [erro, setErro] = useState<ApiError | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const codigoCompleto = digitos.every((digito) => digito.length === 1)

  async function handleReenviar(): Promise<boolean> {
    setErro(null)
    try {
      // O servidor responde igual exista o e-mail ou não, e respeita o
      // intervalo de 60 s do Supabase
      const resposta = await api.reenviarCodigo(email)
      setAviso(resposta.mensagem)
      return true
    } catch (falha) {
      setErro(comoApiError(falha))
      return false
    }
  }

  async function handleConfirmar() {
    if (!codigoCompleto || enviando) return

    setEnviando(true)
    setErro(null)
    try {
      // Confirmar o código já abre a sessão (cookies httpOnly gravados pelo
      // servidor); só depois disso o fluxo avança
      const { perfil } = await confirmarEmail(email, digitos.join(''))
      onConfirmado(perfil)
    } catch (falha) {
      setErro(comoApiError(falha))
      setEnviando(false)
    }
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Confirme seu e-mail
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Digite o código de 6 números enviado para{' '}
          <span className="font-medium text-verde-health">{email}</span>
        </p>
      </div>

      <div className="mt-8">
        <CodigoInput
          digitos={digitos}
          onChange={(proximo) => {
            setDigitos(proximo)
            setErro(null)
          }}
          disabled={enviando}
        />
      </div>

      {erro && (
        <div className="mt-6">
          <AlertaDeFormulario variante="erro">
            {erro.message}
          </AlertaDeFormulario>
        </div>
      )}
      {aviso && !erro && (
        <div className="mt-6">
          <AlertaDeFormulario>{aviso}</AlertaDeFormulario>
        </div>
      )}

      <PrimaryButton
        className="mt-8"
        disabled={!codigoCompleto || enviando}
        onClick={handleConfirmar}
      >
        {enviando ? 'Confirmando...' : 'Confirmar código'}
      </PrimaryButton>

      <p className="mt-4 text-center text-xs text-verde-health/55">
        O código pode levar um minuto para chegar. Confira também a caixa de
        spam.
      </p>

      <div className="mt-4 text-center">
        <ReenviarCodigo
          onReenviar={handleReenviar}
          segundosIniciais={cooldownInicial}
        />
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
  arquivo,
  onArquivoChange,
  onFinalizar,
  onSwitchToHomeCare,
  onVoltarAosDados,
}: {
  /** o arquivo mora no Cadastro (só em memória) para sobreviver até depois
   * da confirmação do e-mail, quando o envio acontece (passo 8 do plano) */
  arquivo: File | null
  onArquivoChange: (arquivo: File | null) => void
  /** cria a conta como profissional; pode lançar ApiError */
  onFinalizar: () => Promise<void>
  /** cria a conta como Home Care; pode lançar ApiError */
  onSwitchToHomeCare: () => Promise<void>
  onVoltarAosDados: () => void
}) {
  const [confirmado, setConfirmado] = useState(false)
  const [erro, setErro] = useState<ApiError | null>(null)
  const [enviando, setEnviando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const podeFinalizar = arquivo !== null && confirmado
  // Erros que só se resolvem corrigindo a tela de dados (senha, e-mail...)
  const erroDeDados =
    erro?.codigo === 'senha_fraca' || erro?.codigo === 'dados_invalidos'

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onArquivoChange(event.target.files?.[0] ?? null)
  }

  function handleRemoverArquivo() {
    onArquivoChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // A conta só é criada aqui (e não na tela de dados) porque quem escolhe
  // Home Care nesta tela precisa ter a conta criada com o tipo certo
  async function criarConta(acao: () => Promise<void>) {
    if (enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await acao()
    } catch (falha) {
      setErro(comoApiError(falha))
      setEnviando(false)
    }
  }

  function handleFinalizar() {
    if (!podeFinalizar) return
    void criarConta(onFinalizar)
  }

  function handleSwitchToHomeCare() {
    void criarConta(onSwitchToHomeCare)
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
          Comprovante Profissional
        </h1>
        <p className="mt-2 text-sm text-verde-health/70">
          Envie seu certificado, diploma ou comprovante de aptidão para validar
          sua conta profissional.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[#04452E]/10 bg-verde-health/5 p-4 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.06)] backdrop-blur-sm">
        <p className="text-sm font-medium text-verde-health">
          Profissões não válidas para conta profissional:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROFISSOES_INVALIDAS.map((profissao) => (
            <span
              key={profissao}
              className="rounded-full border border-[#04452E]/10 bg-white/70 px-3 py-1 text-xs text-verde-health/70 backdrop-blur-sm"
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
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#04452E]/10 bg-white/70 px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] backdrop-blur-sm">
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
            className="mt-3 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-[#04452E]/15 bg-white/40 px-6 py-8 text-center backdrop-blur-sm transition-all hover:border-dourado-health/60 hover:bg-dourado-health/5"
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

        <div className="mt-3 ml-8 rounded-xl border border-amber-300/50 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800 backdrop-blur-sm">
          <strong className="font-semibold">Atenção:</strong> Seu comprovante
          será revisado na primeira compra. Caso não esteja de acordo com nosso
          termo de uso, a compra poderá ser cancelada.
        </div>
      </div>

      {erro && (
        <div className="mt-8">
          <AlertaDeFormulario variante="erro">
            <p>{erro.message}</p>
            {erroDeDados && (
              <button
                type="button"
                onClick={onVoltarAosDados}
                className="mt-2 font-medium text-dourado-health hover:underline"
              >
                Corrigir meus dados
              </button>
            )}
          </AlertaDeFormulario>
        </div>
      )}

      <PrimaryButton
        className="mt-8"
        disabled={!podeFinalizar || enviando}
        onClick={handleFinalizar}
      >
        {enviando ? 'Criando conta...' : 'Finalizar Cadastro'}
      </PrimaryButton>

      <button
        type="button"
        onClick={handleSwitchToHomeCare}
        disabled={enviando}
        className="mt-4 w-full rounded-2xl border border-[#04452E]/10 bg-white/60 px-4 py-3 text-left text-sm text-verde-health/70 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.06)] backdrop-blur-sm transition-all hover:border-dourado-health/40"
      >
        Não é profissional da estética? Sem problema. Sua conta passa para Home
        Care agora e você segue comprando com preço de cliente final.
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------
// Tela de sucesso: a conta existe e o e-mail está confirmado.
// ---------------------------------------------------------------------
// Andamento do envio do comprovante depois da confirmação do e-mail. 'nenhum'
// vale para Home Care e para quem chegou pelo Login sem arquivo em memória.
type EnvioDoComprovante = 'nenhum' | 'enviando' | 'enviado' | 'erro'

const MENSAGEM_DO_ENVIO: Record<EnvioDoComprovante, string> = {
  nenhum:
    'Seu e-mail foi confirmado e sua conta está pronta. Falta enviar o comprovante profissional, o que poderá ser feito em Minha Conta, em breve.',
  enviando: 'Estamos enviando seu comprovante. Não feche esta página.',
  enviado: 'Comprovante recebido. Ele será analisado na primeira compra.',
  erro: 'Sua conta foi criada, mas não conseguimos enviar o comprovante.',
}

function ContaCriada({
  variant,
  envio,
  erroDoEnvio,
  onTentarDeNovo,
}: {
  variant: 'padrao' | 'profissional'
  envio: EnvioDoComprovante
  erroDoEnvio: ApiError | null
  onTentarDeNovo: () => void
}) {
  const profissional = variant === 'profissional'
  const titulo = profissional ? 'Conta criada!' : 'Conta criada com sucesso!'
  const mensagem = profissional
    ? MENSAGEM_DO_ENVIO[envio]
    : 'Seu e-mail foi confirmado e sua conta está pronta.'

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verde-health/10 text-verde-health">
        <CheckCircleIcon className="h-9 w-9" />
      </span>
      <h1 className="font-flatline text-2xl text-verde-health">{titulo}</h1>
      <p aria-live="polite" className="max-w-sm text-sm text-verde-health/70">
        {mensagem}
      </p>

      {profissional && envio === 'erro' && (
        <div className="flex w-full max-w-sm flex-col gap-3 text-left">
          {erroDoEnvio && (
            <AlertaDeFormulario variante="erro">
              {erroDoEnvio.message}
            </AlertaDeFormulario>
          )}
          <PrimaryButton onClick={onTentarDeNovo}>
            Tentar enviar de novo
          </PrimaryButton>
          <p className="text-center text-xs text-verde-health/55">
            Não feche esta página até terminar. Se fechar, o arquivo precisará
            ser enviado de novo depois.
          </p>
        </div>
      )}

      {/* Enquanto o arquivo está sendo enviado, sair da página o perderia */}
      {envio !== 'enviando' && (
        <Link
          to="/"
          className="font-flatline mt-2 inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Voltar para a home
        </Link>
      )}
    </div>
  )
}

// Passo 1 e 2 são o fluxo base (indicador "Passo X de 2"); "confirmacao-
// email" e "comprovante" são etapas extras — a confirmação de e-mail vale
// pros dois perfis, o comprovante só pra profissional — por isso nenhuma
// das duas entra na contagem do indicador (fica escondido nelas e no
// sucesso).
type View = 'perfil' | 'dados' | 'confirmacao-email' | 'comprovante' | 'sucesso'

function Cadastro() {
  // O Login manda para cá quem tentou entrar sem ter confirmado o e-mail, com
  // o e-mail em location.state: abrimos direto na confirmação do código
  const location = useLocation()
  const vindoDoLogin = (location.state as { confirmarEmail?: unknown } | null)
    ?.confirmarEmail
  const emailDoLogin =
    typeof vindoDoLogin === 'string' && EMAIL_REGEX.test(vindoDoLogin.trim())
      ? vindoDoLogin.trim()
      : null

  const [view, setView] = useState<View>(
    emailDoLogin ? 'confirmacao-email' : 'perfil',
  )
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [email, setEmail] = useState(emailDoLogin ?? '')
  // Só em memória: nunca em localStorage ou sessionStorage. A senha em
  // `dados` é descartada assim que a conta é criada.
  const [dados, setDados] = useState<DadosConta | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [perfilCriado, setPerfilCriado] = useState<PerfilDaConta | null>(null)
  const [envio, setEnvio] = useState<EnvioDoComprovante>('nenhum')
  const [erroDoEnvio, setErroDoEnvio] = useState<ApiError | null>(null)

  // Cria a conta no servidor (que também envia o código por e-mail) e segue
  // para a confirmação. Lança ApiError para a tela de origem mostrar.
  async function registrar(tipo: Perfil, conta: DadosConta) {
    await api.cadastro({ perfil: tipo, ...conta })
    setDados(null)
    setPerfil(tipo)
    setEmail(conta.email)
    setView('confirmacao-email')
  }

  async function handleDadosConcluidos(conta: DadosConta) {
    if (!perfil) return
    if (perfil === 'homecare') {
      // Home Care não tem comprovante: cria a conta já e vai à confirmação
      await registrar('homecare', conta)
      return
    }
    // Profissional passa pelo comprovante ANTES de confirmar o e-mail. A conta
    // só é criada no fim dessa tela, para quem trocar para Home Care nela não
    // ficar com uma conta profissional criada à toa.
    setDados(conta)
    setEmail(conta.email)
    setView('comprovante')
  }

  async function handleComprovanteFinalizado() {
    if (!dados) return
    await registrar('profissional', dados)
  }

  async function handleSwitchToHomeCare() {
    if (!dados) return
    // Troca de perfil acontece durante o comprovante, que vem ANTES da
    // confirmação de e-mail: a conta nasce Home Care e ainda falta confirmar.
    await registrar('homecare', dados)
    setArquivo(null)
  }

  // Envia o comprovante (3 etapas, ver api.enviarComprovante). Falha aqui não
  // desfaz a conta: o `arquivo` continua em memória para "Tentar enviar de
  // novo". Se a página for fechada ou recarregada o arquivo se perde, e a
  // página Minha Conta (passo 9) oferecerá reenviar.
  async function enviarComprovante(paraEnviar: File) {
    setEnvio('enviando')
    setErroDoEnvio(null)
    try {
      await api.enviarComprovante(paraEnviar)
      setArquivo(null)
      setEnvio('enviado')
    } catch (falha) {
      setErroDoEnvio(comoApiError(falha))
      setEnvio('erro')
    }
  }

  function handleEmailConfirmado(perfilConfirmado: PerfilDaConta) {
    setPerfilCriado(perfilConfirmado)
    setView('sucesso')
    // A sessão já está aberta (o confirmar-email gravou os cookies httpOnly) e
    // o arquivo ainda está em memória: o envio começa agora, sem a pessoa
    // precisar fazer nada. Home Care não tem comprovante.
    if (perfilConfirmado.tipo === 'profissional' && arquivo) {
      void enviarComprovante(arquivo)
    }
  }

  function handleTentarEnviarDeNovo() {
    if (arquivo) void enviarComprovante(arquivo)
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
              inicial={dados ? { nome: dados.nome, email: dados.email } : null}
              onVoltar={() => setView('perfil')}
              onEnviar={handleDadosConcluidos}
            />
          )}

          {view === 'confirmacao-email' && (
            <ConfirmacaoEmail
              email={email}
              cooldownInicial={emailDoLogin ? 0 : RESEND_COOLDOWN_SECONDS}
              onConfirmado={handleEmailConfirmado}
            />
          )}

          {view === 'comprovante' && (
            <ComprovanteProfissional
              arquivo={arquivo}
              onArquivoChange={setArquivo}
              onFinalizar={handleComprovanteFinalizado}
              onSwitchToHomeCare={handleSwitchToHomeCare}
              onVoltarAosDados={() => setView('dados')}
            />
          )}

          {view === 'sucesso' && (
            <ContaCriada
              variant={
                perfilCriado?.tipo === 'profissional'
                  ? 'profissional'
                  : 'padrao'
              }
              envio={envio}
              erroDoEnvio={erroDoEnvio}
              onTentarDeNovo={handleTentarEnviarDeNovo}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  )
}

export default Cadastro
