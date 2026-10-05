import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import type { CatalogProduct } from '../products/types'
import { addProductToCart } from './cartsApi'
import type { CartLine } from './types'

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  addToCart: (product: CatalogProduct, quantity?: number) => Promise<void>
  setLineQuantity: (productId: number, quantity: number) => void
  removeLine: (productId: number) => void
  placeOrder: () => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [lines, setLines] = useState<CartLine[]>([])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

    return {
      lines,
      itemCount,
      setLineQuantity: (productId: number, quantity: number) => {
        const nextQuantity = Math.max(1, Math.floor(quantity))
        setLines((current) =>
          current.map((line) => (line.id === productId ? { ...line, quantity: nextQuantity } : line)),
        )
      },
      removeLine: (productId: number) => {
        setLines((current) => current.filter((line) => line.id !== productId))
      },
      placeOrder: () => {
        if (lines.length === 0) {
          return false
        }
        setLines([])
        return true
      },
      addToCart: async (product: CatalogProduct, quantity = 1) => {
        if (!session) {
          throw new Error('You must be signed in to add items to your cart.')
        }

        await addProductToCart(session.id, product.id, quantity)
        setLines((current) => {
          const existing = current.find((line) => line.id === product.id)
          if (existing) {
            return current.map((line) =>
              line.id === product.id ? { ...line, quantity: line.quantity + quantity } : line,
            )
          }

          return [
            ...current,
            {
              id: product.id,
              quantity,
              title: product.title,
              price: product.price,
              thumbnail: product.thumbnail,
              discountPercentage: product.discountPercentage,
            },
          ]
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
