import { useState } from 'react'
import { AppLink } from './AppLink'
import { useCart } from './cart'
import { ProductImage } from './ProductImage'

export function CartPage() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderError, setOrderError] = useState('')

  function placeOrder() {
    if (items.length === 0) {
      setOrderError('Your cart is empty. Add a product before placing an order.')
      return
    }
    setOrderError('')
    clearCart()
    setOrderPlaced(true)
  }

  return (
    <main className="page-main">
      <h1>Your Cart ({itemCount})</h1>

      {orderPlaced ? (
        <div className="order-success" role="status">
          <h2>Order placed</h2>
          <p>Your order was placed successfully. Thank you for shopping at MyShop.</p>
          <AppLink to="/products" className="continue-shopping">
            Continue Shopping
          </AppLink>
        </div>
      ) : null}

      {!orderPlaced && items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <AppLink to="/products" className="continue-shopping">
            Continue Shopping
          </AppLink>
        </div>
      ) : null}

      {!orderPlaced && items.length > 0 ? (
        <div className="cart-layout">
          <section className="cart-items" aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="visually-hidden">
              Cart items
            </h2>
            <ul className="cart-list">
              {items.map((item) => {
                const lineTotal = item.price * item.quantity
                return (
                  <li key={item.id} className="cart-line">
                    <ProductImage className="cart-line-image" src={item.thumbnail} alt={item.title} />
                    <div className="cart-line-details">
                      <h3 className="cart-line-title">{item.title}</h3>
                      <p className="cart-line-price">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="qty-stepper">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite" aria-label={`Quantity of ${item.title}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.title}`}
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="cart-line-total">${lineTotal.toFixed(2)}</p>
                    <button
                      type="button"
                      className="cart-remove"
                      aria-label={`Remove ${item.title} from cart`}
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
            <AppLink to="/products" className="continue-shopping">
              Continue Shopping
            </AppLink>
          </section>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            {orderError ? (
              <p className="form-alert" role="alert">
                {orderError}
              </p>
            ) : null}
            <p className="cart-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </p>
            <p className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </p>
            <button type="button" className="place-order" onClick={placeOrder}>
              Place Order
            </button>
          </aside>
        </div>
      ) : null}
    </main>
  )
}
