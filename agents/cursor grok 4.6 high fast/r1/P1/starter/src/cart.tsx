import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartLine, Product } from './types'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, quantity: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const addItem = useCallback((product: Product, quantity: number) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id)
      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail ?? product.images?.[0],
          quantity,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setLines((current) => current.filter((line) => line.productId !== productId))
  }, [])

  const clear = useCallback(() => {
    setLines([])
  }, [])

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  )
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  )

  const value = useMemo(
    () => ({ lines, itemCount, subtotal, addItem, setQuantity, removeItem, clear }),
    [lines, itemCount, subtotal, addItem, setQuantity, removeItem, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
