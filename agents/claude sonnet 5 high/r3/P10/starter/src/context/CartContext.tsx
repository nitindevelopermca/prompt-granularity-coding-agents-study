import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface CartLineItem {
  productId: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}

export interface CartItemInput {
  productId: number
  title: string
  price: number
  thumbnail: string
}

interface CartContextValue {
  items: CartLineItem[]
  /** Total quantity across all line items, shown on the header badge. */
  itemCount: number
  subtotal: number
  addItem: (item: CartItemInput, quantity: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([])

  const addItem = useCallback((item: CartItemInput, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((line) => line.productId === item.productId)
      if (existing) {
        return prev.map((line) =>
          line.productId === item.productId ? { ...line, quantity: line.quantity + quantity } : line,
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, quantity: Math.max(1, quantity) } : line)),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((line) => line.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const itemCount = useMemo(() => items.reduce((sum, line) => sum + line.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, line) => sum + line.price * line.quantity, 0), [items])

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart }),
    [items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart],
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
