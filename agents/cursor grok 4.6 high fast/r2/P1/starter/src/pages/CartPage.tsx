import { useState } from 'react'
import { SafeImage } from '../components/SafeImage'
import { useCart } from '../cart'
import { navigate } from '../router'
import { formatPrice } from '../utils'

export function CartPage() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderError, setOrderError] = useState('')

  function handlePlaceOrder() {
    if (items.length === 0) {
      setOrderError('Your cart is empty.')
      return
    }
    setOrderError('')
    clearCart()
    setOrderPlaced(true)
  }

  return (
    <div className="cart-page">
      <div className="page-heading">
        <h1>Your Cart ({itemCount})</h1>
      </div>

      {orderPlaced ? (
        <p className="success-banner" role="status" aria-live="polite">
          Your order has been placed successfully.
        </p>
      ) : null}

      {orderError ? (
        <p className="form-error" role="alert">
          {orderError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="empty-cart">
          <p className="empty-state" role="status">
            {orderPlaced ? 'Your cart is now empty.' : 'Your cart is empty.'}
          </p>
          <button type="button" className="secondary-button" onClick={() => navigate('products')}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-table-wrap">
            <table className="cart-table">
              <caption className="visually-hidden">Items in your cart</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="cart-product">
                        <SafeImage
                          className="cart-thumb"
                          src={item.thumbnail}
                          alt={item.title}
                        />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td>
                      <div className="qty-stepper">
                        <button
                          type="button"
                          className="stepper-button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          className="stepper-button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                    <td>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="order-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Order summary</h2>
            <dl>
              <div className="summary-row">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="summary-row total">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            <button type="button" className="primary-button full-width" onClick={handlePlaceOrder}>
              Place Order
            </button>
            <button type="button" className="secondary-button full-width" onClick={() => navigate('products')}>
              Continue Shopping
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
