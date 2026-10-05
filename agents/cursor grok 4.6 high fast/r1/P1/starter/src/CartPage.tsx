import { useState } from 'react'
import { useCart } from './cart'
import { formatMoney } from './format'
import { ArrowLeftIcon } from './icons'
import { ProductImage } from './ProductImage'

type CartPageProps = {
  onContinueShopping: () => void
}

export function CartPage({ onContinueShopping }: CartPageProps) {
  const { lines, itemCount, subtotal, setQuantity, removeItem, clear } = useCart()
  const [placed, setPlaced] = useState(false)

  function handlePlaceOrder() {
    if (lines.length === 0) {
      return
    }
    clear()
    setPlaced(true)
  }

  if (placed) {
    return (
      <div className="page-wrap">
        <section className="order-success" aria-labelledby="order-success-heading">
          <h1 id="order-success-heading">Order placed</h1>
          <p role="status">Thank you. Your order has been placed successfully.</p>
          <button type="button" className="btn btn-primary" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="page-wrap cart-layout">
      <section className="cart-panel" aria-labelledby="cart-heading">
        <h1 id="cart-heading">Your Cart ({itemCount})</h1>

        {lines.length === 0 ? (
          <p className="empty-copy">Your cart is empty.</p>
        ) : (
          <div className="cart-table-wrap">
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
                        <ProductImage
                          className="cart-thumb"
                          src={line.thumbnail}
                          alt={line.title}
                        />
                        <div>
                          <p className="cart-title">{line.title}</p>
                          <p className="price-current">{formatMoney(line.price)}</p>
                        </div>
                      </div>
                    </td>
                    <td>{formatMoney(line.price)}</td>
                    <td>
                      <div className="stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${line.title}`}
                          onClick={() => setQuantity(line.productId, Math.max(1, line.quantity - 1))}
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
                        onClick={() => removeItem(line.productId)}
                      >
                        Remove
                      </button>
                    </td>
                    <td className="line-total">{formatMoney(line.price * line.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="button" className="btn btn-outline continue-btn" onClick={onContinueShopping}>
          <ArrowLeftIcon className="btn-icon" />
          Continue Shopping
        </button>
      </section>

      <aside className="summary-panel" aria-labelledby="summary-heading">
        <h2 id="summary-heading">Order Summary</h2>
        <dl className="summary-list">
          <div>
            <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div className="summary-total">
            <dt>Total</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handlePlaceOrder}
          disabled={lines.length === 0}
        >
          Place Order
        </button>
      </aside>
    </div>
  )
}
