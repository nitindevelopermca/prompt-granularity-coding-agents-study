import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import type { CatalogProduct } from '../products/types'
import { addToCartRequest, CartRequestError } from './cartsApi'
import type { CartLine } from './types'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  addProduct: (product: CatalogProduct, quantity?: number) => Promise<void>
  setQuantity: (productId: number, quantity: number) => void
  removeLine: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [lines, setLines] = useState<CartLine[]>([])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

    return {
      lines,
      itemCount,
      subtotal,
      setQuantity: (productId: number, quantity: number) => {
        if (quantity < 1) {
          return
        }
        setLines((current) =>
          current.map((line) => (line.id === productId ? { ...line, quantity } : line)),
        )
      },
      removeLine: (productId: number) => {
        setLines((current) => current.filter((line) => line.id !== productId))
      },
      clearCart: () => {
        setLines([])
      },
      addProduct: async (product: CatalogProduct, quantity = 1) => {
        if (!session) {
          throw new CartRequestError('You must be signed in to add items to your cart.')
        }

        await addToCartRequest(session.id, product.id, quantity)

        setLines((current) => {
          const existing = current.find((line) => line.id === product.id)
          if (!existing) {
            return [
              ...current,
              {
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity,
              },
            ]
          }

          return current.map((line) =>
            line.id === product.id ? { ...line, quantity: line.quantity + quantity } : line,
          )
        })
      },
    }
  }, [lines, session])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
