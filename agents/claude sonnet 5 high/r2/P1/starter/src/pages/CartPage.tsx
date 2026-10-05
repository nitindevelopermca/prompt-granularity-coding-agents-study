import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils/format'
import { ChevronLeftIcon, ImageOffIcon, MinusIcon, PlusIcon, CheckCircleIcon } from '../components/Icons'
import './CartPage.css'

interface CartPageProps {
  onContinueShopping: () => void
}

export default function CartPage({ onContinueShopping }: CartPageProps) {
  const { items, totalQuantity, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [brokenThumbs, setBrokenThumbs] = useState<Record<number, boolean>>({})

  useEffect(() => {
    document.title = orderPlaced ? 'Order Confirmed - MyShop' : 'Your Cart - MyShop'
  }, [orderPlaced])

  const handlePlaceOrder = () => {
    if (items.length === 0) return
    const generatedOrderNumber = Math.floor(100000 + Math.random() * 900000)
    setOrderNumber(generatedOrderNumber)
    setOrderPlaced(true)
    clearCart()
  }

  const handleContinueAfterOrder = () => {
    setOrderPlaced(false)
    setOrderNumber(null)
    onContinueShopping()
  }

  if (orderPlaced) {
    return (
      <section className="order-success" aria-labelledby="order-success-heading">
        <CheckCircleIcon width={56} height={56} className="order-success__icon" />
        <h1 id="order-success-heading">Order placed successfully!</h1>
        <p>
          Thank you for your purchase. Your order number is <strong>#{orderNumber}</strong>. A confirmation has
          been recorded for this session.
        </p>
        <button type="button" className="primary-button" onClick={handleContinueAfterOrder}>
          Continue Shopping
        </button>
      </section>
    )
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <div className="cart-page__top">
        <h1 id="cart-heading">Your Cart ({totalQuantity})</h1>
        <button type="button" className="cart-page__continue" onClick={onContinueShopping}>
          <ChevronLeftIcon width={16} height={16} /> Continue Shopping
        </button>
      </div>

      {items.length === 0 ? (
        <p className="cart-page__empty">Your cart is empty. Add some products to get started.</p>
      ) : (
        <div className="cart-page__layout">
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
                <tr key={item.id}>
                  <td>
                    <div className="cart-table__product">
                      {item.thumbnail && !brokenThumbs[item.id] ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          onError={() => setBrokenThumbs((prev) => ({ ...prev, [item.id]: true }))}
                        />
                      ) : (
                        <div className="cart-table__product-fallback" aria-hidden="true">
                          <ImageOffIcon width={20} height={20} />
                        </div>
                      )}
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <div className="cart-table__quantity">
                      <div className="quantity-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <MinusIcon width={14} height={14} />
                        </button>
                        <span aria-live="polite" aria-label={`Quantity: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <PlusIcon width={14} height={14} />
                        </button>
                      </div>
                      <button type="button" className="cart-table__remove" onClick={() => removeItem(item.id)}>
                        Remove
                      </button>
                    </div>
                  </td>
                  <td className="cart-table__line-total">{formatCurrency(item.price * item.quantity)}</td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>

          <aside className="order-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <div className="order-summary__row">
              <span>Subtotal ({totalQuantity} item{totalQuantity === 1 ? '' : 's'})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="order-summary__row order-summary__row--total">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <button type="button" className="primary-button order-summary__place-order" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </section>
  )
}
