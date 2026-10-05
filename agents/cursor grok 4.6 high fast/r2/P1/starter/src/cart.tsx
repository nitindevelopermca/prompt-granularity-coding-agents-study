import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { addToCartRequest } from './api'
import type { CartItem, Product } from './types'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addProduct: (userId: number, product: Product, quantity?: number) => Promise<void>
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return {
      items,
      itemCount,
      subtotal,
      async addProduct(userId, product, quantity = 1) {
        await addToCartRequest(userId, product.id, quantity)
        setItems((current) => {
          const existing = current.find((item) => item.productId === product.id)
          if (existing) {
            return current.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          }
          return [
            ...current,
            {
              productId: product.id,
              title: product.title,
              price: product.price,
              thumbnail: product.thumbnail,
              quantity,
            },
          ]
        })
      },
      setQuantity(productId, quantity) {
        if (quantity < 1) {
          return
        }
        setItems((current) =>
          current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        )
      },
      removeItem(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId))
      },
      clearCart() {
        setItems([])
      },
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
