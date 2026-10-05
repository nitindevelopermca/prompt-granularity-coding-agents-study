import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { MinusIcon, PlusIcon, ChevronLeftIcon } from '../components/icons'
import { IMAGE_PLACEHOLDER } from '../lib/imagePlaceholder'

export function CartPage() {
  useDocumentMeta(
    'Your Cart – MyShop',
    'Review the items in your MyShop cart, update quantities, and place your order.',
  )

  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  function handlePlaceOrder() {
    setOrderNumber(`MYSHOP-${Date.now().toString().slice(-8)}`)
    setOrderPlaced(true)
    clearCart()
  }

  if (orderPlaced) {
    return (
      <div className="cart-page cart-page--confirmation">
        <div className="order-confirmation" role="status">
          <h1 className="order-confirmation__title">Order placed successfully!</h1>
          <p className="order-confirmation__message">
            Thank you for shopping with MyShop. Your order{' '}
            {orderNumber && <strong>#{orderNumber}</strong>} has been received.
          </p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-page__heading">Your Cart (0)</h1>
        <p className="status-text">Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1 className="cart-page__heading">Your Cart ({itemCount})</h1>

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
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="cart-line__product">
                      <img
                        src={item.thumbnail || IMAGE_PLACEHOLDER}
                        alt={item.title}
                        className="cart-line__image"
                        onError={(event) => {
                          event.currentTarget.src = IMAGE_PLACEHOLDER
                        }}
                      />
                      <span className="cart-line__title">{item.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cart-line__price">${item.price.toFixed(2)}</span>
                  </td>
                  <td>
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        className="quantity-stepper__button"
                        aria-label={`Decrease quantity of ${item.title}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <MinusIcon />
                      </button>
                      <span aria-live="polite" className="quantity-stepper__value">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="quantity-stepper__button"
                        aria-label={`Increase quantity of ${item.title}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                  <td>
                    <span className="cart-line__total">${(item.price * item.quantity).toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Link to="/products" className="btn btn-outline cart-page__continue">
            <ChevronLeftIcon />
            Continue Shopping
          </Link>
        </div>

        <aside className="order-summary" aria-label="Order summary">
          <h2 className="order-summary__heading">Order Summary</h2>
          <div className="order-summary__row">
            <span>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
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
    </div>
  )
}
