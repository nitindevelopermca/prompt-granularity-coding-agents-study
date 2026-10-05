import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { addToCartRequest } from '../lib/cart'
import { useAuth } from './AuthContext'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addToCart: (product: Product, quantity?: number) => Promise<void>
  updateQuantity: (id: number, quantity: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      if (!user) {
        throw new Error('You must be logged in to add items to the cart.')
      }

      // The cart add API is a simulated write with no persisted server-side
      // cart, so the request quantity is the amount being added right now.
      await addToCartRequest(user.id, product.id, quantity)

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
            discountPercentage: product.discountPercentage,
            thumbnail: product.thumbnail || product.images?.[0] || '',
            quantity,
          },
        ]
      })
    },
    [user],
  )

  const updateQuantity = useCallback((id: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== id)
      }
      return prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    })
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, subtotal, addToCart, updateQuantity, removeItem, clearCart }),
    [items, itemCount, subtotal, addToCart, updateQuantity, removeItem, clearCart],
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
