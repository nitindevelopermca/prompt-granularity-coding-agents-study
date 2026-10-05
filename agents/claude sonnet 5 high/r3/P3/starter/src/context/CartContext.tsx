import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { addToCart } from '../api/cart'
import { toErrorMessage } from '../api/errors'
import type { CartLine, Product } from '../types'

interface PlacedOrder {
  orderId: string
  itemCount: number
  total: number
}

interface CartActions {
  addItem: (product: Product, userId: number, quantity?: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearError: () => void
  placeOrder: () => void
  dismissLastOrder: () => void
}

interface CartDataValue {
  items: CartLine[]
  totalQuantity: number
  subtotal: number
  total: number
  error: string | null
  lastOrder: PlacedOrder | null
}

type CartContextValue = CartDataValue & CartActions

// Actions never change identity once created, so components that only need
// to *dispatch* cart operations (e.g. a product card's "Add to Cart" button)
// can subscribe to this context without re-rendering whenever cart data
// (items, totals, errors, …) changes elsewhere in the app.
const CartActionsContext = createContext<CartActions | null>(null)

// Full cart state (data + actions) for components that actually need to
// display cart contents/totals (header badge, cart page, banners).
const CartContext = createContext<CartContextValue | null>(null)

function lineDiscountedPrice(line: CartLine): number {
  return line.discountPercentage > 0 ? line.price * (1 - line.discountPercentage / 100) : line.price
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null)

  // Lets `placeOrder` read the latest cart contents without needing `items`
  // in its dependency array, keeping the action's identity stable forever.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const addItem = useCallback(async (product: Product, userId: number, quantity = 1) => {
    setError(null)
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
    }
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1
    setItems((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity: safeQuantity } : line)))
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((line) => line.productId !== productId))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const placeOrder = useCallback(() => {
    const currentItems = itemsRef.current
    if (currentItems.length === 0) return
    const total = currentItems.reduce((sum, line) => sum + lineDiscountedPrice(line) * line.quantity, 0)
    const itemCount = currentItems.reduce((sum, line) => sum + line.quantity, 0)
    setLastOrder({
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      itemCount,
      total,
    })
    setItems([])
  }, [])

  const dismissLastOrder = useCallback(() => {
    setLastOrder(null)
  }, [])

  // Stable across the provider's lifetime: every member is itself stable, so
  // this object never changes identity and consumers of *only* actions
  // (e.g. ProductCard) never re-render due to cart data changes.
  const actions = useMemo<CartActions>(
    () => ({ addItem, updateQuantity, removeItem, clearError, placeOrder, dismissLastOrder }),
    [addItem, updateQuantity, removeItem, clearError, placeOrder, dismissLastOrder],
  )

  const totalQuantity = useMemo(() => items.reduce((sum, line) => sum + line.quantity, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((sum, line) => sum + lineDiscountedPrice(line) * line.quantity, 0),
    [items],
  )
  const total = subtotal

  const value = useMemo<CartContextValue>(
    () => ({ items, totalQuantity, subtotal, total, error, lastOrder, ...actions }),
    [items, totalQuantity, subtotal, total, error, lastOrder, actions],
  )

  return (
    <CartActionsContext.Provider value={actions}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}

/**
 * Subscribe to cart actions only (add/update/remove/etc). Prefer this over
 * `useCart` in components that never display cart data — the returned
 * object's identity never changes, so it won't cause re-renders when cart
 * items/totals/errors change elsewhere (e.g. every ProductCard in a grid).
 */
export function useCartActions(): CartActions {
  const ctx = useContext(CartActionsContext)
  if (!ctx) {
    throw new Error('useCartActions must be used within a CartProvider')
  }
  return ctx
}

export function lineTotal(line: CartLine): number {
  return lineDiscountedPrice(line) * line.quantity
}

export function displayPrice(line: CartLine): number {
  return lineDiscountedPrice(line)
}
