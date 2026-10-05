import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { addToCart, CartRequestError } from '../api/cart'
import { useAuth } from '../auth/AuthContext'
import type { CartLine } from '../types/cart'
import type { Product } from '../types/product'

type CartContextValue = {
  items: CartLine[]
  itemCount: number
  subtotal: number
  orderConfirmed: boolean
  addProduct: (product: Product) => Promise<void>
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  placeOrder: () => void
  dismissOrderConfirmation: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function mergeLine(items: CartLine[], product: Product): CartLine[] {
  const existing = items.find((item) => item.productId === product.id)
  if (existing) {
    return items.map((item) =>
      item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    )
  }
  return [
    ...items,
    {
      productId: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: 1,
    },
  ]
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [items, setItems] = useState<CartLine[]>([])
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return {
      items,
      itemCount,
      subtotal,
      orderConfirmed,
      async addProduct(product: Product) {
        if (!session) {
          throw new CartRequestError('You must be signed in to add items to your cart.')
        }
        await addToCart(session.id, product.id, 1)
        setItems((current) => mergeLine(current, product))
        setOrderConfirmed(false)
      },
      setQuantity(productId: number, quantity: number) {
        if (quantity < 1) {
          return
        }
        setItems((current) =>
          current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        )
      },
      removeItem(productId: number) {
        setItems((current) => current.filter((item) => item.productId !== productId))
      },
      placeOrder() {
        if (items.length === 0) {
          return
        }
        setItems([])
        setOrderConfirmed(true)
      },
      dismissOrderConfirmation() {
        setOrderConfirmed(false)
      },
    }
  }, [items, orderConfirmed, session])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
