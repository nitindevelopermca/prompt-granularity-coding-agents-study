import { useState } from 'react'
import AppShell from '../components/AppShell'
import { useCart } from '../context/CartContext'
import { useRouter } from '../context/RouterContext'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function CartPage() {
  useDocumentMeta(
    'Cart – MyShop',
    'Review the items in your MyShop cart, adjust quantities, and place your order.',
  )

  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const { navigate } = useRouter()
  const [orderPlaced, setOrderPlaced] = useState(false)

  const total = subtotal

  function handleContinueShopping() {
    navigate('/products')
  }

  function handlePlaceOrder() {
    clearCart()
    setOrderPlaced(true)
  }

  if (orderPlaced) {
    return (
      <AppShell>
        <div className="order-success" role="status">
          <h1>Order placed!</h1>
          <p>Thank you for your purchase. Your order has been placed successfully.</p>
          <button type="button" className="continue-shopping-button" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="cart-page-header">
        <h1>Your Cart ({itemCount})</h1>
        <button type="button" className="continue-shopping-link" onClick={handleContinueShopping}>
          Continue Shopping
        </button>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <button type="button" className="continue-shopping-button" onClick={handleContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-line-items">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity
              return (
                <li key={item.productId} className="cart-line-item">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="cart-line-thumbnail"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                    }}
                  />
                  <div className="cart-line-details">
                    <p className="cart-line-title">{item.title}</p>
                    <p className="cart-line-price">${item.price.toFixed(2)} each</p>
                  </div>

                  <div className="quantity-stepper" role="group" aria-label={`Quantity for ${item.title}`}>
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.title}`}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.title}`}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <p className="cart-line-total">${lineTotal.toFixed(2)}</p>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="order-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="order-summary-row order-summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button type="button" className="place-order-button" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
