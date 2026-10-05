import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CatalogProduct } from '../api/products'
import { isRecord } from '../auth/session'

const STORAGE_KEY = 'myshop.cart'

export type CartLine = {
  id: number
  quantity: number
  title: string
  price: number
  thumbnail: string
  discountPercentage: number
}

type CartContextValue = {
  items: CartLine[]
  itemCount: number
  addItem: (product: CatalogProduct, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function parseLine(value: unknown): CartLine | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.quantity !== 'number' ||
    value.quantity < 1
  ) {
    return null
  }

  return {
    id: value.id,
    quantity: value.quantity,
    title: typeof value.title === 'string' ? value.title : '',
    price: typeof value.price === 'number' ? value.price : 0,
    thumbnail: typeof value.thumbnail === 'string' ? value.thumbnail : '',
    discountPercentage:
      typeof value.discountPercentage === 'number' ? value.discountPercentage : 0,
  }
}

function loadCart(): CartLine[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(parseLine)
      .filter((line): line is CartLine => line !== null)
  } catch {
    return []
  }
}

function persistCart(items: CartLine[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(loadCart)

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0)

    return {
      items,
      itemCount,
      addItem(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((line) => line.id === product.id)
          const next = existing
            ? current.map((line) =>
                line.id === product.id
                  ? { ...line, quantity: line.quantity + quantity }
                  : line,
              )
            : [
                ...current,
                {
                  id: product.id,
                  quantity,
                  title: product.title,
                  price: product.price,
                  thumbnail: product.thumbnail,
                  discountPercentage: product.discountPercentage,
                },
              ]
          persistCart(next)
          return next
        })
      },
      setQuantity(productId, quantity) {
        if (quantity < 1) return
        setItems((current) => {
          const next = current.map((line) =>
            line.id === productId ? { ...line, quantity } : line,
          )
          persistCart(next)
          return next
        })
      },
      removeItem(productId) {
        setItems((current) => {
          const next = current.filter((line) => line.id !== productId)
          persistCart(next)
          return next
        })
      },
      clearCart() {
        persistCart([])
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
