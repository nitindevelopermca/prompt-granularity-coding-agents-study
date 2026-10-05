import { useState } from 'react'
import { useCart } from './cart'
import { formatMoney } from './format'
import { ProductImage } from './ProductImage'

type CartPageProps = {
  onContinueShopping: () => void
}

export function CartPage({ onContinueShopping }: CartPageProps) {
  const { lines, itemCount, subtotal, setQuantity, removeLine, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderError, setOrderError] = useState('')

  function handlePlaceOrder() {
    if (lines.length === 0) {
      setOrderError('Your cart is empty.')
      return
    }
    setOrderError('')
    clearCart()
    setOrderPlaced(true)
  }

  if (orderPlaced) {
    return (
      <main className="page-main">
        <section className="order-success" aria-labelledby="order-success-heading">
          <h1 id="order-success-heading">Order placed</h1>
          <p role="status">Thank you. Your order was placed successfully.</p>
          <button type="button" className="button-primary" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-main cart-page">
      <h1>Your Cart ({itemCount})</h1>
      {lines.length === 0 ? (
        <div className="empty-cart">
          <p role="status">Your cart is empty.</p>
          <button type="button" className="button-outline" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-table-wrap" aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="visually-hidden">
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
                {lines.map((line) => (
                  <tr key={line.productId}>
                    <td>
                      <div className="cart-product">
                        <ProductImage src={line.thumbnail} alt={line.title} className="cart-thumb" />
                        <div>
                          <p className="cart-title">{line.title}</p>
                          <p className="muted">{formatMoney(line.price)}</p>
                        </div>
                      </div>
                    </td>
                    <td>{formatMoney(line.price)}</td>
                    <td>
                      <div className="qty-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${line.title}`}
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                        >
                          −
                        </button>
                        <span aria-live="polite">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${line.title}`}
                          onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => removeLine(line.productId)}
                      >
                        Remove
                      </button>
                    </td>
                    <td>{formatMoney(line.price * line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="button-outline" onClick={onContinueShopping}>
              Continue Shopping
            </button>
          </section>
          <aside className="order-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
            </dl>
            {orderError ? (
              <p className="field-error" role="alert">
                {orderError}
              </p>
            ) : null}
            <button type="button" className="button-primary button-full" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}
