import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { interceptInAppLink } from '../navigation'

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function CartLineImage({ title, thumbnail }: { title: string; thumbnail: string }) {
  const [failed, setFailed] = useState(false)

  if (!thumbnail || failed) {
    return (
      <div className="cart-line-fallback" role="img" aria-label={`${title} image unavailable`}>
        No image
      </div>
    )
  }

  return <img className="cart-line-image" src={thumbnail} alt={title} onError={() => setFailed(true)} />
}

export default function CartPage() {
  const { items, itemCount, setItemQuantity, removeItem, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'MyShop — Cart'
  }, [])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`

  function handlePlaceOrder() {
    if (items.length === 0) {
      setPlaceError('Add an item to your cart before placing an order.')
      return
    }

    clearCart()
    setPlaceError('')
    setOrderPlaced(true)
    requestAnimationFrame(() => {
      successRef.current?.focus()
    })
  }

  return (
    <main id="main-content" className="app-main cart-page">
      <h1>Your Cart ({itemCount})</h1>

      {orderPlaced ? (
        <div ref={successRef} className="cart-success" role="status" tabIndex={-1}>
          <h2>Order placed</h2>
          <p>Your order was placed successfully. No payment was taken.</p>
        </div>
      ) : null}

      {placeError ? (
        <p className="cart-place-error" role="alert">
          {placeError}
        </p>
      ) : null}

      {items.length === 0 && !orderPlaced ? (
        <p className="cart-empty" role="status">
          Your cart is empty.
        </p>
      ) : null}

      {items.length === 0 && orderPlaced ? (
        <p className="cart-empty">Your cart is now empty.</p>
      ) : null}

      {items.length > 0 ? (
        <div className="cart-layout">
          <section className="cart-items" aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="sr-only">
              Cart items
            </h2>
            <table className="cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const lineTotal = item.price * item.quantity
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="cart-product">
                          <CartLineImage title={item.title} thumbnail={item.thumbnail} />
                          <div>
                            <p className="cart-product-title">{item.title}</p>
                            <p className="cart-product-price">{formatMoney(item.price)}</p>
                          </div>
                        </div>
                      </td>
                      <td>{formatMoney(item.price)}</td>
                      <td>
                        <div className="cart-stepper">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.title}`}
                            disabled={item.quantity <= 1}
                            onClick={() => setItemQuantity(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.title}`}
                            onClick={() => setItemQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          Remove
                        </button>
                      </td>
                      <td>{formatMoney(lineTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal ({itemLabel})</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              <div className="cart-summary-total">
                <dt>Total</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
            </dl>
            <button type="button" className="cart-place-order" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      ) : null}

      <a className="cart-continue" href="/products" onClick={(event) => interceptInAppLink(event, '/products')}>
        Continue Shopping
      </a>
    </main>
  )
}
