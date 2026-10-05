import { createContext, useContext, useState, type ReactNode } from 'react'
import { addToCart } from '../api/cart'
import { toErrorMessage } from '../api/errors'
import type { CartLine, Product } from '../types'

interface PlacedOrder {
  orderId: string
  itemCount: number
  total: number
}

interface CartContextValue {
  items: CartLine[]
  totalQuantity: number
  subtotal: number
  total: number
  error: string | null
  pendingProductId: number | null
  lastOrder: PlacedOrder | null
  addItem: (product: Product, userId: number, quantity?: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearError: () => void
  placeOrder: () => void
  dismissLastOrder: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function lineDiscountedPrice(line: CartLine): number {
  return line.discountPercentage > 0 ? line.price * (1 - line.discountPercentage / 100) : line.price
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pendingProductId, setPendingProductId] = useState<number | null>(null)
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null)

  async function addItem(product: Product, userId: number, quantity = 1) {
    setError(null)
    setPendingProductId(product.id)
    try {
      await addToCart(userId, product.id, quantity)
      // Keep existing valid cart state and only merge in the new line on success.
      setItems((prev) => {
        const existing = prev.find((line) => line.productId === product.id)
        if (existing) {
          return prev.map((line) =>
            line.productId === product.id ? { ...line, quantity: line.quantity + quantity } : line,
          )
        }
        const newLine: CartLine = {
          productId: product.id,
          title: product.title,
          price: product.price,
          discountPercentage: product.discountPercentage,
          thumbnail: product.thumbnail,
          quantity,
        }
        return [...prev, newLine]
      })
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to add this item to your cart. Please try again.'))
    } finally {
      setPendingProductId(null)
    }
  }

  function updateQuantity(productId: number, quantity: number) {
    const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1
    setItems((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity: safeQuantity } : line)))
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((line) => line.productId !== productId))
  }

  function clearError() {
    setError(null)
  }

  function placeOrder() {
    if (items.length === 0) return
    const total = items.reduce((sum, line) => sum + lineDiscountedPrice(line) * line.quantity, 0)
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0)
    setLastOrder({
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      itemCount,
      total,
    })
    setItems([])
  }

  function dismissLastOrder() {
    setLastOrder(null)
  }

  const totalQuantity = items.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = items.reduce((sum, line) => sum + lineDiscountedPrice(line) * line.quantity, 0)
  const total = subtotal

  const value: CartContextValue = {
    items,
    totalQuantity,
    subtotal,
    total,
    error,
    pendingProductId,
    lastOrder,
    addItem,
    updateQuantity,
    removeItem,
    clearError,
    placeOrder,
    dismissLastOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}

export function lineTotal(line: CartLine): number {
  return lineDiscountedPrice(line) * line.quantity
}

export function displayPrice(line: CartLine): number {
  return lineDiscountedPrice(line)
}
