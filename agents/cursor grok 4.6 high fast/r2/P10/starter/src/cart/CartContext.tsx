import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CartError, addCartProducts } from '../api/cart'
import { useAuth } from '../auth/AuthContext'

export type CartItem = {
  id: number
  quantity: number
  title: string
  price: number
  thumbnail: string
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  addProductToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>
  setItemQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  const setItemQuantity = useCallback((productId: number, quantity: number) => {
    const nextQuantity = Math.max(1, Math.floor(quantity))
    setItems((current) =>
      current.map((item) => (item.id === productId ? { ...item, quantity: nextQuantity } : item)),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      setItemQuantity,
      removeItem,
      clearCart,
      addProductToCart: async (product, quantity = 1) => {
        if (!session) {
          throw new CartError('You must be signed in to add items to your cart.')
        }

        await addCartProducts({
          userId: session.id,
          products: [{ id: product.id, quantity }],
        })

        setItems((current) => {
          const existing = current.find((item) => item.id === product.id)
          if (existing) {
            return current.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
            )
          }

          return [...current, { ...product, quantity }]
        })
      },
    }),
    [items, session, setItemQuantity, removeItem, clearCart],
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
