import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { addToCartRequest, ApiError } from '../api/dummyjson'
import { useAuth } from './AuthContext'
import type { CartLine, Product } from '../types'

function discountedPrice(product: Product): number {
  const discount = product.discountPercentage > 0 ? product.discountPercentage : 0
  return Math.round(product.price * (1 - discount / 100) * 100) / 100
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  total: number
  addingProductId: number | null
  cartError: string | null
  errorProductId: number | null
  addToCart: (product: Product) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => void
  removeLine: (productId: number) => void
  clearCartError: () => void
  orderPlaced: boolean
  placeOrder: () => void
  startNewOrder: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [lines, setLines] = useState<CartLine[]>([])
  const [addingProductId, setAddingProductId] = useState<number | null>(null)
  const [cartError, setCartError] = useState<string | null>(null)
  const [errorProductId, setErrorProductId] = useState<number | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const addToCart = useCallback(
    async (product: Product) => {
      if (!user) {
        setCartError('You must be logged in to add items to the cart.')
        setErrorProductId(product.id)
        return
      }

      setAddingProductId(product.id)
      setCartError(null)
      setErrorProductId(null)
      try {
        await addToCartRequest({
          userId: user.id,
          products: [{ id: product.id, quantity: 1 }],
        })
        setLines((prev) => {
          const existing = prev.find((line) => line.productId === product.id)
          if (existing) {
            return prev.map((line) =>
              line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
            )
          }
          return [
            ...prev,
            {
              productId: product.id,
              title: product.title,
              price: discountedPrice(product),
              thumbnail: product.thumbnail || product.images?.[0] || '',
              quantity: 1,
            },
          ]
        })
      } catch (err) {
        setCartError(err instanceof ApiError ? err.message : 'Could not add item to cart. Please try again.')
        setErrorProductId(product.id)
      } finally {
        setAddingProductId(null)
      }
    },
    [user],
  )

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setLines((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.max(1, Math.min(99, quantity)) } : line,
      ),
    )
  }, [])

  const removeLine = useCallback((productId: number) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId))
  }, [])

  const clearCartError = useCallback(() => {
    setCartError(null)
    setErrorProductId(null)
  }, [])

  const placeOrder = useCallback(() => {
    setOrderPlaced(true)
    setLines([])
  }, [])

  const startNewOrder = useCallback(() => {
    setOrderPlaced(false)
  }, [])

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines])
  const subtotal = useMemo(
    () => Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100,
    [lines],
  )
  const total = subtotal

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      total,
      addingProductId,
      cartError,
      errorProductId,
      addToCart,
      updateQuantity,
      removeLine,
      clearCartError,
      orderPlaced,
      placeOrder,
      startNewOrder,
    }),
    [
      lines,
      count,
      subtotal,
      total,
      addingProductId,
      cartError,
      errorProductId,
      addToCart,
      updateQuantity,
      removeLine,
      clearCartError,
      orderPlaced,
      placeOrder,
      startNewOrder,
    ],
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
