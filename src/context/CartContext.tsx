import { useState } from 'react'
import type { ReactNode } from 'react'
import type { AddToCartInput, CartItem } from './cart-context'
import { CartContext } from './cart-context'

const CART_STORAGE_KEY = 'instituto-health-carrinho'

function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage indisponível (ex: navegação privada) — carrinho fica só
    // na sessão atual, sem quebrar a página.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  function addItem(input: AddToCartInput, quantidade = 1) {
    const key = `${input.productId}::${input.variant ?? 'default'}`
    setItems((current) => {
      const existing = current.find((item) => item.key === key)
      const next = existing
        ? current.map((item) =>
            item.key === key
              ? { ...item, quantidade: item.quantidade + quantidade }
              : item,
          )
        : [...current, { ...input, key, quantidade }]
      saveCart(next)
      return next
    })
  }

  function updateQuantity(key: string, quantidade: number) {
    setItems((current) => {
      const next =
        quantidade <= 0
          ? current.filter((item) => item.key !== key)
          : current.map((item) =>
              item.key === key ? { ...item, quantidade } : item,
            )
      saveCart(next)
      return next
    })
  }

  function removeItem(key: string) {
    setItems((current) => {
      const next = current.filter((item) => item.key !== key)
      saveCart(next)
      return next
    })
  }

  function clearCart() {
    setItems([])
    saveCart([])
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + (item.preco ?? 0) * item.quantidade,
    0,
  )

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
