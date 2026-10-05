import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem, Product } from '../types'
import { addToCart } from '../api/cart'
import { useAuth } from './AuthContext'

interface CartContextValue {
  items: CartItem[]
  totalQuantity: number
  subtotal: number
  /** Calls POST /carts/add, then merges the product into local cart state on success. */
  addProductToCart: (product: Product) => Promise<void>
  updateQuantity: (id: number, quantity: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  const addProductToCart = useCallback(
    async (product: Product) => {
      if (!user) {
        throw new Error('You must be logged in to add items to the cart.')
      }

      // DummyJSON's cart endpoint is stateless/simulated: it does not remember
      // previous calls, so the cumulative cart is maintained locally rather
      // than trusted from the response of this single-item POST.
      await addToCart({ userId: user.id, products: [{ id: product.id, quantity: 1 }] })

      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id)
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        }
        return [
          ...prev,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail || product.images[0] || '',
            quantity: 1,
            discountPercentage: product.discountPercentage,
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

  const clearCart = useCallback(() => setItems([]), [])

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, totalQuantity, subtotal, addProductToCart, updateQuantity, removeItem, clearCart }),
    [items, totalQuantity, subtotal, addProductToCart, updateQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
