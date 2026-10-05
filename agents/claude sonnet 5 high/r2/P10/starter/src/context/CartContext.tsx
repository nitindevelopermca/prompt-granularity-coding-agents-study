import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartLineItem, Product } from '../types'

interface CartContextValue {
  items: CartLineItem[]
  count: number
  subtotal: number
  total: number
  addItem: (product: Product, quantity: number) => void
  setQuantity: (id: number, quantity: number) => void
  removeItem: (id: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function lineTotal(item: CartLineItem): number {
  const discounted = item.price * (1 - item.discountPercentage / 100)
  return discounted * item.quantity
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([])

  const addItem = (product: Product, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          discountPercentage: product.discountPercentage ?? 0,
          quantity,
        },
      ]
    })
  }

  const setQuantity = (id: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    )
  }

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clear = () => setItems([])

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const total = subtotal

  const value = useMemo(
    () => ({ items, count, subtotal, total, addItem, setQuantity, removeItem, clear }),
    [items, count, subtotal, total],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}

export { lineTotal }
