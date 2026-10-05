import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useCart, type CartLine } from '../cart/CartContext'
import './CartPage.css'

type CartPageProps = {
  navigate: (path: string) => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function CartImage({ line }: { line: CartLine }) {
  const [failed, setFailed] = useState(line.thumbnail === '')

  if (failed) {
    return (
      <div className="cart-image-fallback" role="img" aria-label={`No image available for ${line.title}`}>
        No image
      </div>
    )
  }

  return <img src={line.thumbnail} alt={line.title} onError={() => setFailed(true)} />
}

export function CartPage({ navigate }: CartPageProps) {
  const mainRef = useRef<HTMLElement>(null)
  const { items, itemCount, setQuantity, removeItem, clearCart } = useCart()
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')

  const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const total = subtotal

  useEffect(() => {
    document.title = 'Cart | MyShop'
    mainRef.current?.focus()
  }, [])

  function handleQuantityInput(line: CartLine, value: string) {
    const next = Number.parseInt(value, 10)
    if (Number.isNaN(next)) return
    if (next < 1) {
      setOrderError('Quantity must be at least 1.')
      return
    }
    setOrderError('')
    setQuantity(line.id, next)
  }

  function handlePlaceOrder() {
    if (items.length === 0) {
      setOrderError('Your cart is empty.')
      return
    }

    setOrderError('')
    clearCart()
    setOrderSuccess(true)
  }

  function handleContinue(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    navigate('/products')
  }

  return (
    <main className="cart-main" ref={mainRef} tabIndex={-1}>
      <h1>Your Cart ({itemCount})</h1>

      {orderSuccess ? (
        <p className="cart-success" role="status">
          Your order has been placed successfully.
        </p>
      ) : null}

      {orderError ? (
        <p className="cart-empty" role="alert">
          {orderError}
        </p>
      ) : null}

      {items.length === 0 && !orderSuccess ? <p className="cart-empty">Your cart is empty.</p> : null}

      {items.length > 0 ? (
        <div className="cart-layout">
          <div className="cart-table-wrap">
            <table className="cart-table">
              <caption className="sr-only">Items in your cart</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <div className="cart-product">
                        <CartImage line={line} />
                        <p className="cart-product-title">{line.title}</p>
                      </div>
                    </td>
                    <td>{formatPrice(line.price)}</td>
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
                        <input
                          id={`qty-${line.id}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          value={line.quantity}
                          aria-label={`Quantity of ${line.title}`}
                          onChange={(event) => handleQuantityInput(line, event.target.value)}
                        />
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${line.title}`}
                          onClick={() => {
                            setOrderError('')
                            setQuantity(line.id, line.quantity + 1)
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{formatPrice(line.price * line.quantity)}</td>
                    <td>
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => {
                          setOrderError('')
                          removeItem(line.id)
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order summary</h2>
            <p className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </p>
            <p className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </p>
            <button
              type="button"
              className="cart-place-order"
              disabled={items.length === 0}
              onClick={handlePlaceOrder}
            >
              Place Order
            </button>
          </aside>
        </div>
      ) : null}

      <a className="cart-continue" href="/products" onClick={handleContinue}>
        Continue Shopping
      </a>
    </main>
  )
}
