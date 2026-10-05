import { useState } from 'react'
import { useCart, lineTotal } from '../context/CartContext'

interface CartPageProps {
  onContinueShopping: () => void
}

export default function CartPage({ onContinueShopping }: CartPageProps) {
  const { items, count, subtotal, total, setQuantity, removeItem, clear } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)

  const handlePlaceOrder = () => {
    if (items.length === 0) return
    setOrderPlaced(true)
    clear()
  }

  if (orderPlaced) {
    return (
      <main className="cart-page">
        <div className="cart-page__success" role="status">
          <h1>Order placed!</h1>
          <p>Thank you for your purchase. Your order has been placed successfully.</p>
          <button type="button" className="cart-page__continue-btn" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <h1 className="cart-page__heading">Your Cart ({count})</h1>

      {items.length === 0 ? (
        <div className="cart-page__empty">
          <p>Your cart is empty.</p>
          <button type="button" className="cart-page__continue-btn" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <table className="cart-table">
            <caption className="sr-only">Items in your cart</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Price</th>
                <th scope="col">Quantity</th>
                <th scope="col">Line total</th>
                <th scope="col">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="cart-table__product">
                      <img src={item.thumbnail} alt="" className="cart-table__thumb" />
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <div className="cart-table__stepper">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.title}`}
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>${lineTotal(item).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="cart-table__remove"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-page__footer">
            <button type="button" className="cart-page__continue-btn" onClick={onContinueShopping}>
              Continue Shopping
            </button>

            <div className="cart-summary">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button type="button" className="cart-summary__place-order" onClick={handlePlaceOrder}>
                Place Order
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
