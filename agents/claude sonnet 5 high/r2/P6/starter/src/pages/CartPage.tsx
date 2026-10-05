import { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import styles from './CartPage.module.css'

interface CartPageProps {
  onContinueShopping: () => void
}

export default function CartPage({ onContinueShopping }: CartPageProps) {
  const {
    lines,
    count,
    subtotal,
    total,
    updateQuantity,
    removeLine,
    orderPlaced,
    placeOrder,
    startNewOrder,
  } = useCart()

  useEffect(() => {
    document.title = 'Cart \u2014 MyShop'
  }, [])

  function handleContinueShopping() {
    startNewOrder()
    onContinueShopping()
  }

  if (orderPlaced) {
    return (
      <div className={styles.page}>
        <div className={styles.confirmation} role="status">
          <h1 className={styles.confirmationTitle}>Order placed successfully!</h1>
          <p>Thank you for shopping with MyShop. Your order has been received.</p>
          <div className={styles.continueRow}>
            <button type="button" className="btn btn-primary" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Your Cart ({count})</h1>

      {lines.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Your cart is empty.</p>
          <button type="button" className="btn btn-primary" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className={styles.layout}>
          <ul className={styles.lineList} aria-label="Cart items">
            {lines.map((line) => {
              const lineTotal = Math.round(line.price * line.quantity * 100) / 100
              return (
                <li key={line.productId} className={styles.lineItem}>
                  {line.thumbnail ? (
                    <img src={line.thumbnail} alt={line.title} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumb} aria-hidden="true" />
                  )}
                  <div className={styles.info}>
                    <p className={styles.title}>{line.title}</p>
                    <p className={styles.unitPrice}>${line.price.toFixed(2)} each</p>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      className={styles.stepperButton}
                      onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      aria-label={`Decrease quantity of ${line.title}`}
                    >
                      &minus;
                    </button>
                    <span className={styles.stepperValue} aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className={styles.stepperButton}
                      onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      aria-label={`Increase quantity of ${line.title}`}
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.lineTotal}>${lineTotal.toFixed(2)}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeLine(line.productId)}
                    aria-label={`Remove ${line.title} from cart`}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>

          <aside className={styles.summary} aria-label="Order summary">
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryTotalRow}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={placeOrder}>
              Place Order
            </button>
            <div className={styles.continueRow}>
              <button type="button" className="btn btn-secondary btn-block" onClick={onContinueShopping}>
                Continue Shopping
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
