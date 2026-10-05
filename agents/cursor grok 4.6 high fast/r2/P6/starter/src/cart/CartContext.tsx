import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../auth/AuthContext'
import type { Product } from '../products/types'
import { addToCartRequest } from './api'
import type { CartItem } from './types'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addProduct: (product: Product, quantity?: number) => Promise<void>
  setItemQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function mergeItem(items: CartItem[], product: Product, quantity: number): CartItem[] {
  const existing = items.find((item) => item.id === product.id)
  if (!existing) {
    return [
      ...items,
      {
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        quantity,
      },
    ]
  }

  return items.map((item) =>
    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
  )
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  const addProduct = useCallback(
    async (product: Product, quantity = 1) => {
      if (!session) {
        throw new Error('You must be signed in to add items to the cart.')
      }

      await addToCartRequest({
        userId: session.id,
        productId: product.id,
        quantity,
      })
      setItems((current) => mergeItem(current, product, quantity))
    },
    [session],
  )

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const setItemQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) {
        return current.filter((item) => item.id !== productId)
      }

      return current.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      )
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addProduct,
      setItemQuantity,
      removeItem,
      clearCart,
    }),
    [addProduct, clearCart, itemCount, items, removeItem, setItemQuantity, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) {
    throw new Error('useCart must be used within CartProvider')
  }
  return value
}
