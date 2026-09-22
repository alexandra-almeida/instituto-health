import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER } from '../data/contact'
import { formatPrice } from '../data/tulipiaProducts'
import { useCart } from '../context/useCart'
import type { CartItem } from '../context/cart-context'

function itemLineLabel(item: CartItem): string {
  return item.variant ? `${item.nome} (${item.variant})` : item.nome
}

function itemPriceLabel(item: CartItem): string {
  if (item.exclusivoProfissional || item.preco == null) {
    return 'Consultar preço'
  }
  return formatPrice(item.preco)
}

// Monta a mensagem de pedido formatada e abre o WhatsApp em nova aba — não
// há pagamento integrado ainda, só o fechamento manual por WhatsApp.
function buildWhatsappMessage(items: CartItem[], subtotal: number): string {
  const lines = items.map((item) => {
    const total =
      item.preco != null && !item.exclusivoProfissional
        ? formatPrice(item.preco * item.quantidade)
        : 'consultar'
    return `${item.quantidade}x ${itemLineLabel(item)} — ${itemPriceLabel(item)} (${total})`
  })

  const hasConsultaItems = items.some(
    (item) => item.exclusivoProfissional || item.preco == null,
  )

  const parts = [
    'Olá! Gostaria de finalizar o seguinte pedido no Instituto Health:',
    '',
    ...lines,
    '',
    `Total: ${formatPrice(subtotal)}${hasConsultaItems ? ' + itens a consultar' : ''}`,
  ]

  return parts.join('\n')
}

function CartRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem
  onUpdateQuantity: (key: string, quantidade: number) => void
  onRemove: (key: string) => void
}) {
  return (
    <div className="flex gap-3 border-b border-[#04452E]/10 py-4 last:border-b-0 sm:gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-[#04452E]/8 to-[#CAA02D]/15 sm:h-24 sm:w-24">
        {item.imagem ? (
          <img
            src={item.imagem}
            alt={item.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="p-1 text-center text-[10px] font-medium text-[#04452E]/45 uppercase">
            {item.displayName}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0">
          {item.linha && (
            <span className="font-flatline text-[10px] leading-none tracking-wide text-[#CAA02D] uppercase">
              {item.linha}
            </span>
          )}
          <h3 className="font-flatline truncate text-sm text-[#04452E] sm:text-base">
            {item.displayName}
          </h3>
          <p className="text-xs text-[#04452E]/60">
            {item.tamanho}
            {item.variant ? ` · ${item.variant}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-full border border-[#04452E]/15">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.key, item.quantidade - 1)}
              aria-label="Diminuir quantidade"
              className="flex h-7 w-7 items-center justify-center text-[#04452E] transition-colors hover:text-[#CAA02D]"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm text-[#04452E]">
              {item.quantidade}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.key, item.quantidade + 1)}
              aria-label="Aumentar quantidade"
              className="flex h-7 w-7 items-center justify-center text-[#04452E] transition-colors hover:text-[#CAA02D]"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-flatline text-sm text-[#04452E] sm:text-base">
              {itemPriceLabel(item)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.key)}
              aria-label={`Remover ${item.displayName} do carrinho`}
              className="text-xs text-[#04452E]/50 underline decoration-[#04452E]/30 underline-offset-2 transition-colors hover:text-[#CAA02D]"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Carrinho() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()
  const hasConsultaItems = items.some(
    (item) => item.exclusivoProfissional || item.preco == null,
  )

  function handleCheckout() {
    const message = buildWhatsappMessage(items, subtotal)
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full py-10"
    >
      <h1 className="font-flatline text-2xl text-[#04452E] sm:text-3xl">
        Carrinho
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-sm text-[#04452E]/70">
            Seu carrinho está vazio. Que tal dar uma olhada nos produtos
            Tulípia?
          </p>
          <Link
            to="/tulipia"
            className="rounded-full bg-[#04452E] px-6 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-[#04452E]/90"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#04452E]/10 bg-white px-4 sm:px-5 lg:col-span-2">
            {items.map((item) => (
              <CartRow
                key={item.key}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-[#04452E]/10 bg-white p-5">
            <h2 className="font-flatline text-lg text-[#04452E]">Resumo</h2>
            <div className="mt-4 flex items-center justify-between text-sm text-[#04452E]/80">
              <span>Subtotal</span>
              <span className="font-flatline text-base text-[#04452E]">
                {formatPrice(subtotal)}
              </span>
            </div>
            {hasConsultaItems && (
              <p className="mt-2 text-xs text-[#04452E]/60 italic">
                Alguns itens exigem consulta de preço com um profissional —
                o valor final será combinado pelo WhatsApp.
              </p>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              className="mt-5 w-full rounded-full bg-[#04452E] px-6 py-3 text-sm font-semibold text-offwhite transition-colors hover:bg-[#04452E]/90"
            >
              Finalizar pelo WhatsApp
            </button>
            <p className="mt-3 text-center text-xs text-[#04452E]/50">
              Ainda não há pagamento online — o pedido é fechado
              diretamente com a equipe pelo WhatsApp.
            </p>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default Carrinho
