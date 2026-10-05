import { useState } from 'react'
import { useCart } from '../context/CartContext.tsx'
import { usePageMeta } from '../hooks/usePageMeta.ts'

interface CartPageProps {
  onContinueShopping: () => void
}

export function CartPage({ onContinueShopping }: CartPageProps) {
  usePageMeta(
    'Your Cart | MyShop',
    'Review the items in your MyShop cart, update quantities, and place your order.',
  )

  const { items, subtotal, totalQuantity, updateQuantity, removeItem, clearCart } = useCart()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  function handlePlaceOrder() {
    const generated = `MS-${Date.now().toString().slice(-8)}`
    setOrderNumber(generated)
    clearCart()
  }

  if (orderNumber) {
    return (
      <main className="cart-page cart-page--confirmation">
        <div className="order-confirmation" role="status">
          <h1>Order placed!</h1>
          <p>
            Thank you for your purchase. Your order number is <strong>{orderNumber}</strong>.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setOrderNumber(null)
              onContinueShopping()
            }}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <h1>Your Cart ({totalQuantity})</h1>

      {items.length === 0 ? (
        <div className="cart-page__empty">
          <p>Your cart is empty.</p>
          <button type="button" className="btn btn-primary" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-page__layout">
          <div className="cart-page__main">
            <table className="cart-table">
              <caption className="visually-hidden">Items in your cart</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="cart-table__product">
                      <img src={item.thumbnail} alt="" width={64} height={64} />
                      <span>{item.title}</span>
                    </td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <div className="quantity-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span aria-live="polite">
                          <span className="visually-hidden">Quantity: </span>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" className="btn btn-secondary" onClick={onContinueShopping}>
              ← Continue Shopping
            </button>
          </div>

          <aside className="order-summary" aria-label="Order summary">
            <h2>Order Summary</h2>
            <div className="order-summary__row">
              <span>Subtotal ({totalQuantity} item{totalQuantity === 1 ? '' : 's'})</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="order-summary__row order-summary__row--total">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button type="button" className="btn btn-primary btn-full" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}
