import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from './types'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function toCartItem(product: Product, quantity: number): CartItem {
  const item: CartItem = {
    id: product.id,
    title: product.title,
    price: product.price,
    quantity,
  }
  const thumbnail = product.thumbnail ?? product.images[0]
  if (thumbnail) {
    item.thumbnail = thumbnail
  }
  return item
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addItem: (product: Product, quantity = 1) => {
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id)
          if (existing) {
            return current.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
            )
          }
          return [...current, toCartItem(product, quantity)]
        })
      },
      setQuantity: (productId: number, quantity: number) => {
        const next = Math.max(1, Math.floor(quantity))
        setItems((current) => current.map((item) => (item.id === productId ? { ...item, quantity: next } : item)))
      },
      removeItem: (productId: number) => {
        setItems((current) => current.filter((item) => item.id !== productId))
      },
      clearCart: () => {
        setItems([])
      },
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) {
    throw new Error('useCart must be used within CartProvider')
  }
  return value
}
