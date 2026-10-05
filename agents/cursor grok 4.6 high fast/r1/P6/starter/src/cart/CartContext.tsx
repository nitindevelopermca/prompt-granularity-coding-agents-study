import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { addToCartRequest, CartRequestError } from '../api/cart'
import { useAuth } from '../auth/AuthContext'
import type { CartItem, CartItemSnapshot } from '../types/cart'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addProduct: (product: CartItemSnapshot, quantity?: number) => Promise<void>
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return {
      items,
      itemCount,
      subtotal,
      async addProduct(product: CartItemSnapshot, quantity = 1) {
        if (!session) {
          throw new CartRequestError('You must be signed in to add items to your cart.', 'unknown')
        }

        const amount = quantity > 0 ? quantity : 1

        await addToCartRequest({
          userId: session.id,
          products: [{ id: product.id, quantity: amount }],
        })

        setItems((current) => {
          const existing = current.find((item) => item.id === product.id)
          if (existing) {
            return current.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    ...product,
                    quantity: item.quantity + amount,
                  }
                : item,
            )
          }
          return [...current, { ...product, quantity: amount }]
        })
      },
      setQuantity(productId: number, quantity: number) {
        const next = Math.floor(quantity)
        if (next < 1) {
          return
        }

        setItems((current) =>
          current.map((item) => (item.id === productId ? { ...item, quantity: next } : item)),
        )
      },
      removeItem(productId: number) {
        setItems((current) => current.filter((item) => item.id !== productId))
      },
      clearCart() {
        setItems([])
      },
    }
  }, [items, session])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
