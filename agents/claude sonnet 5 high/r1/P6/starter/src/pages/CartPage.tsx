// Cart screen: line items, quantity stepper, remove, order summary, and an
// in-app-only Place Order confirmation.
// UX: spec/ux/ux-design-of-cart.png
//
// Per spec/SPEC_FREEZE.md this work unit intentionally omits shipping
// forms, payment, and tax rows (out of scope) — only Subtotal, Total, and
// Place Order are shown. There is no GET-cart API; all totals are derived
// from local state populated by successful POST /carts/add calls.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { CartIcon, CheckCircleIcon } from '../components/icons';
import styles from './CartPage.module.css';

export default function CartPage() {
  useDocumentMeta('Cart – MyShop', 'Review the items in your MyShop cart and place your order.');

  const { items, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  // No shipping/tax in scope for this work unit — total equals subtotal.
  const total = subtotal;

  useEffect(() => {
    if (orderPlaced) {
      successHeadingRef.current?.focus();
    }
  }, [orderPlaced]);

  function handlePlaceOrder() {
    if (items.length === 0) return;
    // In-app success confirmation only — no payment provider, shipping
    // form, or further checkout pages.
    clearCart();
    setOrderPlaced(true);
  }

  if (orderPlaced) {
    return (
      <div className={styles.page}>
        <div className={styles.successPanel} role="status">
          <CheckCircleIcon className={styles.successIcon} />
          <h1 className={styles.successHeading} tabIndex={-1} ref={successHeadingRef}>
            Order placed successfully!
          </h1>
          <p className={styles.successText}>
            Thank you for your order. This is a demo checkout, so no payment was processed.
          </p>
          <Link to="/products" className={styles.continueShoppingButton}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Your Cart ({itemCount})</h1>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Your cart is empty.</p>
          <Link to="/products" className={styles.continueShoppingLink}>
            ← Continue Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Items in your cart</caption>
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
                    <td className={styles.productCell}>
                      <img src={item.thumbnail} alt="" className={styles.thumbnail} />
                      <span className={styles.productTitle}>{item.title}</span>
                    </td>
                    <td className={styles.priceCell}>${item.unitPrice.toFixed(2)}</td>
                    <td className={styles.quantityCell}>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          className={styles.stepperButton}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          −
                        </button>
                        <span className={styles.quantityValue} aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className={styles.stepperButton}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        Remove
                      </button>
                    </td>
                    <td className={styles.totalCell}>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Link to="/products" className={styles.continueShoppingLink}>
              ← Continue Shopping
            </Link>
          </div>

          <aside className={styles.summary} aria-label="Order summary">
            <h2 className={styles.summaryHeading}>Order Summary</h2>
            <div className={styles.summaryRow}>
              <span>
                Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})
              </span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button type="button" className={styles.placeOrderButton} onClick={handlePlaceOrder}>
              <CartIcon width={18} height={18} />
              Place Order
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
