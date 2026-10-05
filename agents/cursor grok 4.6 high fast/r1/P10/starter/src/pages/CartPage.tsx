import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext'
import type { CartLine } from '../cart/types'
import './CartPage.css'

const PRODUCTS_PATH = '/products'

type CartPageProps = {
  navigate: (to: string) => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function CartLineRow({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const lineTotal = line.price * line.quantity
  const showImage = Boolean(line.thumbnail) && !imageFailed

  return (
    <article className="cart-line">
      {showImage ? (
        <img src={line.thumbnail ?? ''} alt={line.title} onError={() => setImageFailed(true)} />
      ) : (
        <div className="cart-line-fallback" role="img" aria-label={`${line.title}, image unavailable`}>
          No image
        </div>
      )}

      <div className="cart-line-details">
        <h2>{line.title}</h2>
        <p className="cart-line-price">{formatPrice(line.price)}</p>
      </div>

      <div className="cart-line-actions">
        <div className="cart-stepper">
          <button
            type="button"
            aria-label={`Decrease quantity of ${line.title}`}
            onClick={() => onQuantityChange(line.quantity - 1)}
            disabled={line.quantity <= 1}
          >
            −
          </button>
          <span aria-live="polite">{line.quantity}</span>
          <button
            type="button"
            aria-label={`Increase quantity of ${line.title}`}
            onClick={() => onQuantityChange(line.quantity + 1)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="cart-remove"
          onClick={onRemove}
          aria-label={`Remove ${line.title} from cart`}
        >
          Remove
        </button>
      </div>

      <p className="cart-line-total">
        <span className="visually-hidden">Line total </span>
        {formatPrice(lineTotal)}
      </p>
    </article>
  )
}

export default function CartPage({ navigate }: CartPageProps) {
  const { lines, itemCount, setLineQuantity, removeLine, placeOrder } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Cart | MyShop'
  }, [])

  useEffect(() => {
    if (orderPlaced) {
      successRef.current?.focus()
    }
  }, [orderPlaced])

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

  return (
    <main id="main-content" className="app-shell-main cart-page" tabIndex={-1}>
      <div className="cart-layout">
        <section className="cart-items" aria-labelledby="cart-heading">
          <h1 id="cart-heading">Your Cart ({itemCount})</h1>

          {orderPlaced ? (
            <div
              ref={successRef}
              className="cart-success"
              role="status"
              tabIndex={-1}
              aria-live="polite"
            >
              <h2>Order placed</h2>
              <p>Your order was placed successfully. Thank you for shopping at MyShop.</p>
            </div>
          ) : null}

          {orderError ? (
            <p className="cart-order-error" role="alert">
              {orderError}
            </p>
          ) : null}

          {!orderPlaced && lines.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : !orderPlaced && lines.length > 0 ? (
            <ul className="cart-list">
              {lines.map((line) => (
                <li key={line.id}>
                  <CartLineRow
                    line={line}
                    onQuantityChange={(quantity) => setLineQuantity(line.id, quantity)}
                    onRemove={() => removeLine(line.id)}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <button type="button" className="cart-continue" onClick={() => navigate(PRODUCTS_PATH)}>
            ← Continue Shopping
          </button>
        </section>

        <aside className="cart-summary" aria-labelledby="order-summary-heading">
          <h2 id="order-summary-heading">Order Summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="cart-summary-total">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="cart-place-order"
            disabled={lines.length === 0}
            onClick={() => {
              setOrderError(null)
              const placed = placeOrder()
              if (!placed) {
                setOrderError('Your cart is empty. Add a product before placing an order.')
                return
              }
              setOrderPlaced(true)
            }}
          >
            Place Order
          </button>
        </aside>
      </div>
    </main>
  )
}
