import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { addToCartRequest } from './api'
import type { CartLine, Product } from './types'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  addProduct: (userId: number, product: Product, quantity?: number) => Promise<void>
  setQuantity: (productId: number, quantity: number) => void
  removeLine: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

    return {
      lines,
      itemCount,
      subtotal,
      addProduct: async (userId, product, quantity = 1) => {
        await addToCartRequest(userId, product.id, quantity)
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
              thumbnail: product.thumbnail || product.images[0] || '',
              quantity,
            },
          ]
        })
      },
      setQuantity: (productId, quantity) => {
        setLines((current) =>
          current.map((line) =>
            line.productId === productId ? { ...line, quantity: Math.max(1, quantity) } : line,
          ),
        )
      },
      removeLine: (productId) => {
        setLines((current) => current.filter((line) => line.productId !== productId))
      },
      clearCart: () => setLines([]),
    }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
