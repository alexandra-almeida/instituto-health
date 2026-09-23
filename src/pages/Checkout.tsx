import { CreditCard, Loader2, QrCode } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { CartItem } from '../context/cart-context'
import { useCart } from '../context/useCart'
import { formatPrice } from '../data/tulipiaProducts'

// ---------------------------------------------------------------------
// Máscaras — formatam o valor a cada digitação, sempre a partir só dos
// dígitos (colar um número com pontuação também funciona).
// ---------------------------------------------------------------------
function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskCardNumero(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return (digits.match(/.{1,4}/g) ?? []).join(' ')
}

function maskValidade(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function maskCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4)
}

function validadeEmDia(validade: string): boolean {
  const match = validade.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  const mes = Number(match[1])
  const ano = 2000 + Number(match[2])
  if (mes < 1 || mes > 12) return false
  const agora = new Date()
  const anoAtual = agora.getFullYear()
  const mesAtual = agora.getMonth() + 1
  if (ano < anoAtual) return false
  if (ano === anoAtual && mes < mesAtual) return false
  return true
}

// Detecção de bandeira bem simplificada, só pelos primeiros dígitos — é só
// um indicador visual, não uma validação de verdade (isso é trabalho do
// gateway de pagamento, que ainda não existe).
function detectarBandeira(
  numero: string,
): 'visa' | 'mastercard' | 'elo' | null {
  const digits = numero.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'visa'
  if (/^5[1-5]/.test(digits)) return 'mastercard'
  if (
    /^(4011|4312|4389|4514|4573|6277|6362|6363|6504|6505|6516|6550)/.test(
      digits,
    )
  ) {
    return 'elo'
  }
  return null
}

const BANDEIRA_LABEL: Record<'visa' | 'mastercard' | 'elo', string> = {
  visa: 'VISA',
  mastercard: 'MASTERCARD',
  elo: 'ELO',
}

const BANDEIRA_COLOR: Record<'visa' | 'mastercard' | 'elo', string> = {
  visa: 'text-blue-700',
  mastercard: 'text-orange-600',
  elo: 'text-yellow-700',
}

const ESTADOS = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
]

// Até 3x sem juros é só um valor de exemplo — a regra real (e as taxas de
// juros de verdade) vêm do gateway de pagamento, ainda não integrado.
const SEM_JUROS_ATE = 3
const PARCELAS_OPCOES = Array.from({ length: 12 }, (_, index) => {
  const parcela = index + 1
  return {
    value: parcela,
    label:
      parcela <= SEM_JUROS_ATE
        ? `${parcela}x sem juros`
        : `${parcela}x com juros`,
  }
})

// ---------------------------------------------------------------------
// Primitivas visuais — mesmo refinamento leve já aplicado no /cadastro:
// bordas finas e translúcidas, fundo com leve transparência, sombra suave
// em vez de contorno pesado.
// ---------------------------------------------------------------------
interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  placeholder?: string
  autoComplete?: string
  helper?: string
  error?: string
  className?: string
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  helper,
  error,
  className = '',
}: FieldProps) {
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-verde-health">{label}</span>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-[#04452E]/12 bg-white/60 px-4 py-2.5 text-sm text-verde-health placeholder:text-verde-health/35 focus:border-dourado-health/60 focus:ring-2 focus:ring-dourado-health/15 focus:outline-none"
      />
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-verde-health/55">{helper}</span>
      ) : null}
    </label>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  className = '',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <label htmlFor={id} className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-verde-health">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#04452E]/12 bg-white/60 px-4 py-2.5 text-sm text-verde-health focus:border-dourado-health/60 focus:ring-2 focus:ring-dourado-health/15 focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}

function PrimaryButton({
  disabled,
  onClick,
  className = '',
  children,
}: {
  disabled?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`font-flatline w-full rounded-full px-8 py-3 text-sm uppercase leading-none transition-all ${
        disabled
          ? 'cursor-not-allowed bg-verde-health/8 text-verde-health/25'
          : 'bg-verde-health text-offwhite shadow-[0_6px_20px_-6px_rgba(4,69,46,0.5)] hover:bg-verde-health/90 hover:shadow-[0_8px_24px_-6px_rgba(4,69,46,0.55)]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------
// Seção 1 — Endereço de entrega, com autopreenchimento via ViaCEP.
// ---------------------------------------------------------------------
export interface EnderecoForm {
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  nomeDestinatario: string
  telefone: string
}

const ENDERECO_INICIAL: EnderecoForm = {
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  nomeDestinatario: '',
  telefone: '',
}

function enderecoCompleto(endereco: EnderecoForm): boolean {
  return (
    endereco.cep.replace(/\D/g, '').length === 8 &&
    endereco.rua.trim().length > 0 &&
    endereco.numero.trim().length > 0 &&
    endereco.bairro.trim().length > 0 &&
    endereco.cidade.trim().length > 0 &&
    endereco.estado.length > 0 &&
    endereco.nomeDestinatario.trim().length > 0 &&
    endereco.telefone.replace(/\D/g, '').length >= 10
  )
}

interface ViaCepResponse {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

function EnderecoSection({
  endereco,
  onChange,
}: {
  endereco: EnderecoForm
  onChange: (field: keyof EnderecoForm, value: string) => void
}) {
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const [cepErro, setCepErro] = useState<string | null>(null)

  async function handleCepBlur() {
    const digits = endereco.cep.replace(/\D/g, '')
    if (digits.length !== 8) {
      setCepErro(digits.length > 0 ? 'CEP precisa ter 8 dígitos.' : null)
      return
    }
    setCepStatus('loading')
    setCepErro(null)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = (await response.json()) as ViaCepResponse
      if (data.erro) {
        setCepStatus('error')
        setCepErro('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      onChange('rua', data.logradouro ?? '')
      onChange('bairro', data.bairro ?? '')
      onChange('cidade', data.localidade ?? '')
      onChange('estado', data.uf ?? '')
      setCepStatus('idle')
    } catch {
      setCepStatus('error')
      setCepErro(
        'Não foi possível buscar o CEP agora. Preencha o endereço manualmente.',
      )
    }
  }

  return (
    <section>
      <h2 className="font-flatline text-lg text-verde-health">
        Endereço de entrega
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Field
            id="checkout-cep"
            label="CEP*"
            value={endereco.cep}
            onChange={(value) => {
              onChange('cep', maskCep(value))
              setCepErro(null)
            }}
            onBlur={handleCepBlur}
            inputMode="numeric"
            placeholder="00000-000"
            error={cepErro ?? undefined}
            helper={
              cepStatus === 'loading' ? 'Buscando endereço...' : undefined
            }
          />
        </div>
        {cepStatus === 'loading' && (
          <div className="flex items-end pb-2.5 sm:col-span-2">
            <Loader2 className="h-4 w-4 animate-spin text-dourado-health" />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          id="checkout-rua"
          label="Rua / Logradouro*"
          value={endereco.rua}
          onChange={(value) => onChange('rua', value)}
          className="sm:col-span-2"
        />
        <Field
          id="checkout-numero"
          label="Número*"
          value={endereco.numero}
          onChange={(value) => onChange('numero', value)}
          inputMode="numeric"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="checkout-complemento"
          label="Complemento"
          value={endereco.complemento}
          onChange={(value) => onChange('complemento', value)}
          placeholder="Apto, bloco, referência..."
        />
        <Field
          id="checkout-bairro"
          label="Bairro*"
          value={endereco.bairro}
          onChange={(value) => onChange('bairro', value)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="checkout-cidade"
          label="Cidade*"
          value={endereco.cidade}
          onChange={(value) => onChange('cidade', value)}
        />
        <SelectField
          id="checkout-estado"
          label="Estado*"
          value={endereco.estado}
          onChange={(value) => onChange('estado', value)}
        >
          <option value="">Selecione</option>
          {ESTADOS.map((estado) => (
            <option key={estado.uf} value={estado.uf}>
              {estado.nome}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="checkout-destinatario"
          label="Nome completo do destinatário*"
          value={endereco.nomeDestinatario}
          onChange={(value) => onChange('nomeDestinatario', value)}
          autoComplete="name"
        />
        <Field
          id="checkout-telefone"
          label="Telefone/WhatsApp de contato*"
          value={endereco.telefone}
          onChange={(value) => onChange('telefone', maskTelefone(value))}
          inputMode="tel"
          placeholder="(00) 00000-0000"
        />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Seção 2 — Forma de pagamento.
// ---------------------------------------------------------------------
export type FormaPagamento = 'pix' | 'credito' | 'debito'

export interface CartaoForm {
  numero: string
  nomeImpresso: string
  validade: string
  cvv: string
  parcelas: number
}

const CARTAO_INICIAL: CartaoForm = {
  numero: '',
  nomeImpresso: '',
  validade: '',
  cvv: '',
  parcelas: 1,
}

function cartaoCompleto(cartao: CartaoForm): boolean {
  return (
    cartao.numero.replace(/\D/g, '').length === 16 &&
    cartao.nomeImpresso.trim().length > 0 &&
    validadeEmDia(cartao.validade) &&
    cartao.cvv.length >= 3 &&
    cartao.cvv.length <= 4
  )
}

const FORMAS_PAGAMENTO: {
  key: FormaPagamento
  label: string
  Icon: typeof QrCode
}[] = [
  { key: 'pix', label: 'Pix', Icon: QrCode },
  { key: 'credito', label: 'Cartão de Crédito', Icon: CreditCard },
  { key: 'debito', label: 'Cartão de Débito', Icon: CreditCard },
]

function CartaoFormFields({
  cartao,
  onChange,
  mostrarParcelas,
}: {
  cartao: CartaoForm
  onChange: (field: keyof CartaoForm, value: string | number) => void
  mostrarParcelas: boolean
}) {
  const bandeira = detectarBandeira(cartao.numero)
  const numeroValido = cartao.numero.replace(/\D/g, '').length === 16
  const validadeInvalida =
    cartao.validade.length === 5 && !validadeEmDia(cartao.validade)

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Field
        id="checkout-cartao-numero"
        label="Número do cartão*"
        value={cartao.numero}
        onChange={(value) => onChange('numero', maskCardNumero(value))}
        inputMode="numeric"
        placeholder="0000 0000 0000 0000"
        helper={
          bandeira
            ? undefined
            : cartao.numero.length > 0
              ? undefined
              : 'Aceitamos Visa, Mastercard e Elo.'
        }
        error={
          cartao.numero.length > 0 && !numeroValido
            ? 'O número do cartão precisa ter 16 dígitos.'
            : undefined
        }
      />
      {bandeira && (
        <span
          className={`-mt-2 text-xs font-bold tracking-wide ${BANDEIRA_COLOR[bandeira]}`}
        >
          {BANDEIRA_LABEL[bandeira]}
        </span>
      )}

      <Field
        id="checkout-cartao-nome"
        label="Nome impresso no cartão*"
        value={cartao.nomeImpresso}
        onChange={(value) => onChange('nomeImpresso', value)}
        autoComplete="cc-name"
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="checkout-cartao-validade"
          label="Validade (MM/AA)*"
          value={cartao.validade}
          onChange={(value) => onChange('validade', maskValidade(value))}
          inputMode="numeric"
          placeholder="MM/AA"
          error={validadeInvalida ? 'Validade vencida ou inválida.' : undefined}
        />
        <Field
          id="checkout-cartao-cvv"
          label="CVV*"
          value={cartao.cvv}
          onChange={(value) => onChange('cvv', maskCvv(value))}
          inputMode="numeric"
          placeholder="000"
        />
      </div>

      {mostrarParcelas && (
        <SelectField
          id="checkout-cartao-parcelas"
          label="Parcelas"
          value={String(cartao.parcelas)}
          onChange={(value) => onChange('parcelas', Number(value))}
        >
          {PARCELAS_OPCOES.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </SelectField>
      )}
    </div>
  )
}

function PagamentoSection({
  forma,
  onSelectForma,
  cartao,
  onChangeCartao,
}: {
  forma: FormaPagamento | null
  onSelectForma: (forma: FormaPagamento) => void
  cartao: CartaoForm
  onChangeCartao: (field: keyof CartaoForm, value: string | number) => void
}) {
  return (
    <section className="mt-8">
      <h2 className="font-flatline text-lg text-verde-health">
        Forma de pagamento
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {FORMAS_PAGAMENTO.map((item) => {
          const selected = forma === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectForma(item.key)}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-2 rounded-2xl border bg-white/70 px-2 py-4 text-center backdrop-blur-sm transition-all sm:px-4 ${
                selected
                  ? 'border-dourado-health/70 bg-dourado-health/8 shadow-[0_4px_20px_-4px_rgba(202,160,45,0.35)]'
                  : 'border-[#04452E]/10 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] hover:border-dourado-health/40'
              }`}
            >
              <item.Icon
                className={`h-6 w-6 ${selected ? 'text-dourado-health' : 'text-verde-health/60'}`}
                strokeWidth={1.6}
              />
              <span className="text-xs leading-tight font-medium text-verde-health sm:text-sm">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {forma === 'pix' && (
        <div className="mt-5 rounded-2xl border border-[#04452E]/10 bg-verde-health/5 p-4 text-sm text-verde-health/80 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.06)] backdrop-blur-sm">
          Você receberá o QR Code e o código Pix para pagamento após
          confirmar o pedido.
        </div>
      )}

      {forma === 'credito' && (
        <CartaoFormFields
          cartao={cartao}
          onChange={onChangeCartao}
          mostrarParcelas
        />
      )}

      {forma === 'debito' && (
        <CartaoFormFields
          cartao={cartao}
          onChange={onChangeCartao}
          mostrarParcelas={false}
        />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------
// Seção 3 — Resumo do pedido.
// ---------------------------------------------------------------------
function itemLineLabel(item: CartItem): string {
  return item.variant ? `${item.nome} (${item.variant})` : item.nome
}

function itemPriceLabel(item: CartItem): string {
  if (item.exclusivoProfissional || item.preco == null) {
    return 'Consultar preço'
  }
  return formatPrice(item.preco)
}

function ResumoPedido({
  items,
  subtotal,
  podeConfirmar,
  onConfirmar,
}: {
  items: CartItem[]
  subtotal: number
  podeConfirmar: boolean
  onConfirmar: () => void
}) {
  return (
    <div className="h-fit rounded-2xl border border-[#04452E]/10 bg-white/70 p-5 shadow-[0_2px_10px_-4px_rgba(4,32,18,0.08)] backdrop-blur-sm">
      <h2 className="font-flatline text-lg text-verde-health">
        Resumo do pedido
      </h2>

      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span className="text-verde-health/80">
              {item.quantidade}x {itemLineLabel(item)}
            </span>
            <span className="shrink-0 font-medium text-verde-health">
              {itemPriceLabel(item)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-2 border-t border-[#04452E]/10 pt-4 text-sm">
        <div className="flex items-center justify-between text-verde-health/80">
          <span>Subtotal</span>
          <span className="font-medium text-verde-health">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between text-verde-health/80">
          <span>Frete</span>
          <span className="font-medium text-verde-health">A calcular</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#04452E]/10 pt-3">
        <span className="font-flatline text-base text-verde-health">
          Total
        </span>
        <span className="font-flatline text-xl text-verde-health">
          {formatPrice(subtotal)}
        </span>
      </div>

      <PrimaryButton
        className="mt-5"
        disabled={!podeConfirmar}
        onClick={onConfirmar}
      >
        Confirmar Pedido
      </PrimaryButton>
    </div>
  )
}

// ---------------------------------------------------------------------
// Página /checkout.
// ---------------------------------------------------------------------
function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [endereco, setEndereco] = useState<EnderecoForm>(ENDERECO_INICIAL)
  const [forma, setForma] = useState<FormaPagamento | null>(null)
  const [cartao, setCartao] = useState<CartaoForm>(CARTAO_INICIAL)

  function updateEndereco(field: keyof EnderecoForm, value: string) {
    setEndereco((current) => ({ ...current, [field]: value }))
  }

  function updateCartao(field: keyof CartaoForm, value: string | number) {
    setCartao((current) => ({ ...current, [field]: value }))
  }

  const pagamentoValido =
    forma === 'pix'
      ? true
      : forma === 'credito' || forma === 'debito'
        ? cartaoCompleto(cartao)
        : false

  const podeConfirmar = enderecoCompleto(endereco) && pagamentoValido

  function handleConfirmarPedido() {
    if (!podeConfirmar) return

    // TODO(backend/gateway de pagamento): ainda não existe integração real.
    // Pix real geraria QR Code + código copia-e-cola aqui; cartão real
    // enviaria os dados pra tokenização no gateway (ex: Stripe, Pagar.me,
    // Mercado Pago) — nunca os dados brutos do cartão pro nosso servidor.
    // A chamada real (algo como POST /api/pedidos com endereço, forma de
    // pagamento e itens) entra aqui — só navegar pra confirmação depois da
    // resposta do servidor. Por enquanto nenhum dado de cartão é enviado
    // ou persistido em lugar nenhum (nem localStorage/sessionStorage) —
    // é só validação de formato na interface.
    clearCart()
    navigate('/pedido-confirmado')
  }

  if (items.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-10 text-center"
      >
        <h1 className="font-flatline text-2xl text-verde-health">
          Seu carrinho está vazio
        </h1>
        <p className="max-w-md text-sm text-verde-health/70">
          Adicione produtos ao carrinho antes de finalizar a compra.
        </p>
        <Link
          to="/tulipia"
          className="font-flatline inline-flex items-center justify-center rounded-full bg-emerald-dark px-8 py-3 text-sm uppercase leading-none text-offwhite transition-colors hover:bg-emerald-dark/90"
        >
          Ver catálogo
        </Link>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <h1 className="font-flatline text-2xl text-verde-health sm:text-3xl">
        Checkout
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="order-2 flex flex-col gap-8 lg:order-1 lg:col-span-2">
          <EnderecoSection endereco={endereco} onChange={updateEndereco} />
          <PagamentoSection
            forma={forma}
            onSelectForma={setForma}
            cartao={cartao}
            onChangeCartao={updateCartao}
          />
        </div>

        <div className="order-1 lg:order-2">
          <ResumoPedido
            items={items}
            subtotal={subtotal}
            podeConfirmar={podeConfirmar}
            onConfirmar={handleConfirmarPedido}
          />
        </div>
      </div>
    </motion.section>
  )
}

export default Checkout
