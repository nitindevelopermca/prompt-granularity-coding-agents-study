import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { PRODUCTS_PATH } from '../layout/AppShell'
import './CartPage.css'

type CartPlaceholderProps = {
  navigate: (to: string) => void
}

function money(value: number): string {
  return `$${value.toFixed(2)}`
}

function LineImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="cart-line-fallback" role="img" aria-label={alt}>
        No image
      </div>
    )
  }

  return <img className="cart-line-image" src={src} alt={alt} onError={() => setFailed(true)} />
}

export default function CartPlaceholder({ navigate }: CartPlaceholderProps) {
  const { lines, itemCount, subtotal, setQuantity, removeLine, clearCart } = useCart()
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [placedTotal, setPlacedTotal] = useState(0)
  const successRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = orderSuccess ? 'Order confirmed | MyShop' : 'Cart | MyShop'
  }, [orderSuccess])

  useEffect(() => {
    if (orderSuccess) {
      successRef.current?.focus()
    }
  }, [orderSuccess])

  function placeOrder() {
    if (itemCount === 0) {
      setOrderError('Add an item before placing an order.')
      return
    }

    setPlacedTotal(subtotal)
    setOrderError(null)
    setOrderSuccess(true)
    clearCart()
  }

  return (
    <main id="main-content" className="app-shell-main" tabIndex={-1}>
      <h1>Your Cart ({itemCount})</h1>

      {orderSuccess ? (
        <section className="cart-success" aria-labelledby="order-success-heading">
          <h2 id="order-success-heading" ref={successRef} tabIndex={-1}>
            Order placed
          </h2>
          <p role="status">
            Thank you. Your order was placed successfully. Total {money(placedTotal)}.
          </p>
        </section>
      ) : itemCount === 0 ? (
        <p className="cart-empty">Your cart is empty.</p>
      ) : (
        <div className="cart-layout">
          <table className="cart-table">
            <caption className="visually-hidden">Items in your cart</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Price</th>
                <th scope="col">Quantity</th>
                <th scope="col">Total</th>
                <th scope="col">
                  <span className="visually-hidden">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <div className="cart-product">
                      <LineImage src={line.thumbnail} alt={line.title} />
                      <span className="cart-product-title">{line.title}</span>
                    </div>
                  </td>
                  <td>{money(line.price)}</td>
                  <td>
                    <div className="cart-stepper">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${line.title}`}
                        disabled={line.quantity <= 1}
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.title}`}
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{money(line.price * line.quantity)}</td>
                  <td>
                    <button
                      type="button"
                      className="cart-remove"
                      aria-label={`Remove ${line.title} from cart`}
                      onClick={() => removeLine(line.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <aside className="cart-summary" aria-labelledby="cart-summary-heading">
            <h2 id="cart-summary-heading">Order summary</h2>
            <p>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </p>
            <p className="cart-summary-total">
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </p>
            {orderError ? (
              <p className="cart-order-error" role="alert">
                {orderError}
              </p>
            ) : null}
            <button type="button" className="cart-place-order" onClick={placeOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}

      <button type="button" className="cart-continue" onClick={() => navigate(PRODUCTS_PATH)}>
        Continue Shopping
      </button>
    </main>
  )
}
