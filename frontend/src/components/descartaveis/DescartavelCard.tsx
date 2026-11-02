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
import { linkDoWhatsapp, mensagemDoProduto } from '../../lib/descartaveis'
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

// Card de um descartável: foto ou ícone da categoria, marca, nome, embalagem
// (só se confirmada), preço, escolha da variação (sem pré-seleção), quantidade,
// "Adicionar ao carrinho" e o botão secundário de atacado/licitação. A
// quantidade vale para o carrinho e para a mensagem do WhatsApp.
function DescartavelCard({ produto, onAdicionar }: DescartavelCardProps) {
  const temVariacao = produto.variacoes.length > 1
  const [skuEscolhido, setSkuEscolhido] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [campoDeQuantidade, setCampoDeQuantidade] = useState('1')
  const [adicionado, setAdicionado] = useState(false)
  const [imagemComErro, setImagemComErro] = useState(false)

  const Icone = ICONE_DA_CATEGORIA[produto.categoria] ?? Package
  const mostrarImagem = Boolean(produto.imagem) && !imagemComErro
  const variacaoEscolhida = temVariacao
    ? (produto.variacoes.find((v) => v.sku === skuEscolhido) ?? null)
    : produto.variacoes[0]
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
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-2xl bg-linear-to-br from-[#04452E]/8 to-[#CAA02D]/15">
        {mostrarImagem ? (
          <img
            src={produto.imagem}
            alt={produto.nome}
            loading="lazy"
            decoding="async"
            onError={() => setImagemComErro(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icone
            aria-hidden="true"
            strokeWidth={1.4}
            className="h-14 w-14 text-[#04452E]/35"
          />
        )}
      </div>

      <div className="font-inter flex flex-1 flex-col items-center gap-1 p-3 text-center xs:p-4">
        {produto.marca && (
          <span className="text-[10px] leading-none tracking-wide text-dourado-health uppercase">
            {produto.marca}
          </span>
        )}
        <h3 className="line-clamp-3 text-sm leading-snug font-normal text-verde-health">
          {produto.nome}
        </h3>
        {produto.embalagem && (
          <p className="text-xs text-verde-health/60">{produto.embalagem}</p>
        )}
        <PriceTag
          value={variacaoEscolhida?.preco ?? produto.preco}
          className="mt-1 leading-none text-verde-health"
          mainClassName="text-lg font-semibold"
        />

        {temVariacao && (
          <fieldset className="mt-2 w-full">
            <legend className="mb-1.5 w-full text-[11px] text-verde-health/60">
              {rotuloDaVariacao}
            </legend>
            <div className="flex flex-wrap justify-center gap-1.5">
              {produto.variacoes.map((v) => {
                const selecionada = v.sku === skuEscolhido
                return (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => setSkuEscolhido(v.sku)}
                    aria-pressed={selecionada}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
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

        <div className="mt-3 flex w-full flex-col items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-verde-health/15">
            <button
              type="button"
              onClick={() => mudarQuantidade(quantidade - 1)}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
              className="h-8 w-8 text-base text-verde-health transition-colors hover:text-dourado-health disabled:cursor-not-allowed disabled:opacity-35"
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
              className="h-8 w-12 bg-transparent text-center text-sm text-verde-health focus:outline-none"
            />
            <button
              type="button"
              onClick={() => mudarQuantidade(quantidade + 1)}
              disabled={quantidade >= QUANTIDADE_MAXIMA}
              aria-label="Aumentar quantidade"
              className="h-8 w-8 text-base text-verde-health transition-colors hover:text-dourado-health disabled:cursor-not-allowed disabled:opacity-35"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={adicionar}
            disabled={faltaEscolher}
            aria-disabled={faltaEscolher}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-dourado-health px-3 py-2 text-xs font-medium text-verde-profundo transition-colors hover:bg-dourado-claro disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-dourado-health"
          >
            <CartPlusIcon className="h-4 w-4" />
            {adicionado
              ? 'Adicionado ✓'
              : faltaEscolher
                ? `Escolha ${produto.rotuloDaVariacao === 'Tamanho' ? 'o' : 'a'} ${rotuloDaVariacao.toLowerCase()}`
                : 'Adicionar ao carrinho'}
          </button>

          <a
            href={linkAtacado}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-[10px] border border-verde-health/25 px-3 py-2 text-[11px] leading-tight text-verde-health transition-colors hover:border-dourado-health hover:text-dourado-health"
          >
            Atacado ou licitação? Fale com a gente
          </a>
        </div>
      </div>
    </div>
  )
}

export default DescartavelCard
