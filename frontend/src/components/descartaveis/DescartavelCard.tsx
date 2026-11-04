import {
  Coffee,
  Hand,
  Package,
  Scroll,
  ShoppingBag,
  SprayCan,
  Stethoscope,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { WHATSAPP_NUMBER } from '../../data/contact'
import type { Descartavel } from '../../data/descartaveis'
import {
  fotoDoDescartavel,
  linkDoWhatsapp,
  mensagemDoProduto,
} from '../../lib/descartaveis'
import { CartPlusIcon } from '../icons'
import PriceTag from '../PriceTag'

// Sem foto, cada categoria usa um ícone neutro sobre o mesmo fundo em gradiente
// dos cards da Tulípia
const ICONE_DA_CATEGORIA: Record<string, LucideIcon> = {
  Luvas: Hand,
  Atendimento: Stethoscope,
  Papéis: Scroll,
  Copa: Coffee,
  'Higiene e limpeza': SprayCan,
  'Sacos e embalagens': ShoppingBag,
}

const QUANTIDADE_MAXIMA = 9999

interface DescartavelCardProps {
  produto: Descartavel
  /** o card já garante variação escolhida (quando o produto tem) e quantidade >= 1 */
  onAdicionar: (variacaoSku: string, quantidade: number) => void
}

// Card de um descartável: foto inteira ou ícone da categoria, marca, nome, embalagem
// (só se confirmada), preço, escolha da variação (sem pré-seleção), quantidade,
// "Adicionar ao carrinho" e o botão secundário de atacado/licitação. A
// quantidade vale para o carrinho e para a mensagem do WhatsApp.
function DescartavelCard({ produto, onAdicionar }: DescartavelCardProps) {
  const temVariacao = produto.variacoes.length > 1
  const [skuEscolhido, setSkuEscolhido] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [campoDeQuantidade, setCampoDeQuantidade] = useState('1')
  const [adicionado, setAdicionado] = useState(false)
  // Fotos que não carregaram (arquivo corrompido, por exemplo); só elas voltam
  // para o ícone, as outras variações continuam com a foto
  const [fotosComErro, setFotosComErro] = useState<string[]>([])

  const Icone = ICONE_DA_CATEGORIA[produto.categoria] ?? Package
  const variacaoEscolhida = temVariacao
    ? (produto.variacoes.find((v) => v.sku === skuEscolhido) ?? null)
    : produto.variacoes[0]
  // A foto troca conforme o tamanho escolhido, quando o produto tem uma por
  // variação; antes de escolher mostra a do M (ou a primeira que existir)
  const foto = fotoDoDescartavel(produto, variacaoEscolhida)
  const mostrarImagem = Boolean(foto) && !fotosComErro.includes(foto ?? '')
  const faltaEscolher = temVariacao && !variacaoEscolhida
  const rotuloDaVariacao = produto.rotuloDaVariacao ?? 'variação'

  function mudarQuantidade(nova: number) {
    const limpa = Math.min(QUANTIDADE_MAXIMA, Math.max(1, Math.round(nova)))
    setQuantidade(limpa)
    setCampoDeQuantidade(String(limpa))
  }

  function aoDigitarQuantidade(texto: string) {
    // Deixa apagar para digitar outro número; só vale quando for um inteiro
    const digitos = texto.replace(/\D/g, '').slice(0, 4)
    setCampoDeQuantidade(digitos)
    if (digitos !== '') {
      setQuantidade(Math.min(QUANTIDADE_MAXIMA, Math.max(1, Number(digitos))))
    }
  }

  function aoSairDaQuantidade() {
    setCampoDeQuantidade(String(quantidade))
  }

  function adicionar() {
    if (!variacaoEscolhida) return
    onAdicionar(variacaoEscolhida.sku, quantidade)
    setAdicionado(true)
    window.setTimeout(() => setAdicionado(false), 1600)
  }

  const linkAtacado = linkDoWhatsapp(
    WHATSAPP_NUMBER,
    mensagemDoProduto(produto, variacaoEscolhida, quantidade),
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-2px_rgba(4,32,18,0.12)] transition-shadow hover:shadow-[0_6px_20px_-4px_rgba(4,32,18,0.18)]">
      {/* Área da foto SEMPRE quadrada, para a grade ficar alinhada com frascos em
          pé e caixas deitadas. A foto aparece inteira (object-contain), sobre
          fundo branco e com respiro; sem foto, o ícone da categoria sobre o
          gradiente de sempre. */}
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-t-2xl ${
          mostrarImagem
            ? 'bg-white'
            : 'bg-linear-to-br from-[#04452E]/8 to-[#CAA02D]/15'
        }`}
      >
        {mostrarImagem ? (
          <img
            src={foto}
            alt={
              variacaoEscolhida?.rotulo
                ? `${produto.nome}, ${variacaoEscolhida.rotulo}`
                : produto.nome
            }
            loading="lazy"
            decoding="async"
            onError={() => setFotosComErro((atuais) => [...atuais, foto ?? ''])}
            className="h-full w-full object-contain p-1.5 xs:p-4"
          />
        ) : (
          <Icone
            aria-hidden="true"
            strokeWidth={1.4}
            className="h-14 w-14 text-[#04452E]/35"
          />
        )}
      </div>

      <div className="font-inter flex min-w-0 flex-1 flex-col items-center gap-1 p-2 text-center xs:p-4">
        {produto.marca && (
          <span className="max-w-full truncate text-[9px] leading-none tracking-wide text-dourado-health uppercase xs:text-[10px]">
            {produto.marca}
          </span>
        )}
        <h3
          title={produto.nome}
          className="line-clamp-3 text-[13px] leading-snug font-normal wrap-anywhere text-verde-health xs:text-sm"
        >
          {produto.nome}
        </h3>
        {produto.embalagem && (
          <p className="line-clamp-2 text-[11px] leading-tight text-verde-health/60 xs:text-xs">
            {produto.embalagem}
          </p>
        )}
        <PriceTag
          value={variacaoEscolhida?.preco ?? produto.preco}
          className="mt-1 leading-none text-verde-health"
          mainClassName="text-base font-semibold xs:text-lg"
        />

        {temVariacao && (
          <fieldset className="mt-1 w-full min-w-0 xs:mt-2">
            <legend className="mb-1 w-full text-center text-[11px] text-verde-health/60 xs:mb-1.5">
              {rotuloDaVariacao}
            </legend>
            <div className="flex flex-wrap justify-center gap-1 xs:gap-1.5">
              {produto.variacoes.map((v) => {
                const selecionada = v.sku === skuEscolhido
                return (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => setSkuEscolhido(v.sku)}
                    aria-pressed={selecionada}
                    className={`min-h-10 flex-auto rounded-full border px-3 text-[11px] leading-tight font-medium wrap-break-word transition-colors xs:min-h-0 xs:flex-none xs:px-3 xs:py-1 xs:text-xs ${
                      selecionada
                        ? 'border-dourado-health bg-dourado-health text-verde-profundo'
                        : 'border-verde-health/20 text-verde-health hover:border-dourado-health/60'
                    }`}
                  >
                    {v.rotulo}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="mt-2 flex w-full flex-col items-center gap-1.5 xs:mt-3 xs:gap-2">
          <div className="flex w-full items-center rounded-full border border-verde-health/15 xs:inline-flex xs:w-auto">
            <button
              type="button"
              onClick={() => mudarQuantidade(quantidade - 1)}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
              className="h-10 w-10 shrink-0 text-base text-verde-health xs:h-8 xs:w-8 transition-colors hover:text-dourado-health disabled:cursor-not-allowed disabled:opacity-35"
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={campoDeQuantidade}
              onChange={(e) => aoDigitarQuantidade(e.target.value)}
              onBlur={aoSairDaQuantidade}
              aria-label={`Quantidade de ${produto.nome}`}
              className="h-10 min-w-0 flex-1 bg-transparent text-center text-sm text-verde-health focus:outline-none xs:h-8 xs:w-12 xs:flex-none"
            />
            <button
              type="button"
              onClick={() => mudarQuantidade(quantidade + 1)}
              disabled={quantidade >= QUANTIDADE_MAXIMA}
              aria-label="Aumentar quantidade"
              className="h-10 w-10 shrink-0 text-base text-verde-health xs:h-8 xs:w-8 transition-colors hover:text-dourado-health disabled:cursor-not-allowed disabled:opacity-35"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={adicionar}
            disabled={faltaEscolher}
            aria-disabled={faltaEscolher}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-dourado-health px-2 py-2 text-center text-xs leading-tight xs:min-h-0 xs:px-3 font-medium text-verde-profundo transition-colors hover:bg-dourado-claro disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-dourado-health"
          >
            <CartPlusIcon className="h-4 w-4 shrink-0" />
            {adicionado ? (
              'Adicionado ✓'
            ) : faltaEscolher ? (
              `Escolha ${produto.rotuloDaVariacao === 'Tamanho' ? 'o' : 'a'} ${rotuloDaVariacao.toLowerCase()}`
            ) : (
              <>
                <span className="xs:hidden">Adicionar</span>
                <span className="hidden xs:inline">Adicionar ao carrinho</span>
              </>
            )}
          </button>

          <a
            href={linkAtacado}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 w-full items-center justify-center text-[11px] leading-tight text-verde-health underline underline-offset-2 transition-colors hover:text-dourado-health xs:min-h-0 xs:rounded-[10px] xs:border xs:border-verde-health/25 xs:px-3 xs:py-2 xs:no-underline xs:hover:border-dourado-health"
          >
            <span className="xs:hidden">Atacado ou licitação?</span>
            <span className="hidden xs:inline">
              Atacado ou licitação? Fale com a gente
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default DescartavelCard
