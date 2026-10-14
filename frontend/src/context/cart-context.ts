import { createContext } from 'react'

// Um item de carrinho é identificado por produto + variação (ex: dois
// sabores do mesmo Sweet Lips são duas linhas separadas no carrinho).
export interface CartItem {
  /** chave única: `${productId}::${variant ?? 'default'}` */
  key: string
  productId: string
  nome: string
  displayName: string
  linha: string | null
  categoria: string
  tamanho: string
  variant: string | null
  preco: number | null
  exclusivoProfissional: boolean
  imagem?: string
  quantidade: number
}

export type AddToCartInput = Omit<CartItem, 'key' | 'quantidade'>

export interface CartContextValue {
  items: CartItem[]
  /** soma das quantidades — usado no badge do ícone do header */
  itemCount: number
  /** soma de preco * quantidade, ignorando itens sem preço público */
  subtotal: number
  addItem: (input: AddToCartInput, quantidade?: number) => void
  updateQuantity: (key: string, quantidade: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
