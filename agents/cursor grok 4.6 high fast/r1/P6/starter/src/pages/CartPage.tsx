import { useEffect, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { PRODUCTS_PATH, usePathname } from '../navigation'
import type { CartItem } from '../types/cart'
import './CartPage.css'

function money(value: number): string {
  return `$${value.toFixed(2)}`
}

function CartLine({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart()
  const [imageFailed, setImageFailed] = useState(false)
  const photo = item.thumbnail && !imageFailed ? item.thumbnail : undefined
  const lineTotal = item.price * item.quantity

  return (
    <article className="cart-line">
      {photo ? (
        <img
          src={photo}
          alt={item.title}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="cart-line-fallback">No image available</div>
      )}

      <div className="cart-line-info">
        <h2>{item.title}</h2>
        <p className="cart-line-price">{money(item.price)}</p>
      </div>

      <div className="cart-line-qty" role="group" aria-label={`Quantity for ${item.title}`}>
        <button
          type="button"
          aria-label={`Decrease quantity of ${item.title}`}
          disabled={item.quantity <= 1}
          onClick={() => setQuantity(item.id, item.quantity - 1)}
        >
          −
        </button>
        <span aria-live="polite">{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity of ${item.title}`}
          onClick={() => setQuantity(item.id, item.quantity + 1)}
        >
          +
        </button>
      </div>

      <div className="cart-line-end">
        <p className="cart-line-total">{money(lineTotal)}</p>
        <button
          type="button"
          className="cart-remove"
          onClick={() => removeItem(item.id)}
        >
          Remove
          <span className="visually-hidden"> {item.title} from cart</span>
        </button>
      </div>
    </article>
  )
}

export function CartPage() {
  const { items, itemCount, subtotal, clearCart } = useCart()
  const { navigate } = usePathname()
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    document.title = 'Cart · MyShop'
  }, [])

  useEffect(() => {
    if (itemCount > 0 && orderPlaced) {
      setOrderPlaced(false)
    }
  }, [itemCount, orderPlaced])

  function handlePlaceOrder() {
    if (items.length === 0) {
      return
    }
    clearCart()
    setOrderPlaced(true)
  }

  return (
    <main className="cart-page">
      <h1>Your Cart ({itemCount})</h1>

      {orderPlaced ? (
        <p className="cart-success" role="status">
          Your order was placed successfully.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="cart-empty">
          {orderPlaced ? null : <p>Your cart is empty.</p>}
          <button type="button" className="cart-continue" onClick={() => navigate(PRODUCTS_PATH)}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <CartLine item={item} />
                </li>
              ))}
            </ul>

            <button type="button" className="cart-continue" onClick={() => navigate(PRODUCTS_PATH)}>
              Continue Shopping
            </button>
          </section>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div className="cart-summary-total">
                <dt>Total</dt>
                <dd>{money(subtotal)}</dd>
              </div>
            </dl>
            <button type="button" className="cart-place" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}
