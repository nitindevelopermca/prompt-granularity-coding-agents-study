// Cart destination: line items, quantity stepper, Remove, Continue Shopping,
// order summary, and in-app Place Order confirmation (no payment or extra pages).

import { useId, useState } from 'react';
import Dialog from '../components/Dialog';
import { useCart } from '../context/useCart';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { CartLine } from '../types/cart';
import './CartPage.css';

interface CartPageProps {
  onContinueShopping: () => void;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function CartLineImage({ line }: { line: CartLine }) {
  const [broken, setBroken] = useState(false);

  if (!line.thumbnail || broken) {
    return <div className="cart-line-image-fallback">No image</div>;
  }

  return (
    <img
      src={line.thumbnail}
      alt={line.title}
      className="cart-line-image"
      onError={() => setBroken(true)}
    />
  );
}

export default function CartPage({ onContinueShopping }: CartPageProps) {
  useDocumentTitle('MyShop – Cart');
  const { lines, itemCount, setLineQuantity, removeLine, clearCart } = useCart();
  const successTitleId = useId();

  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ itemCount: number; total: number } | null>(null);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function handlePlaceOrder() {
    if (lines.length === 0) {
      setOrderError('Your cart is empty. Add a product before placing an order.');
      return;
    }

    setOrderError(null);
    setPlacedOrder({ itemCount, total: subtotal });
    clearCart();
  }

  function handleCloseSuccess() {
    setPlacedOrder(null);
  }

  return (
    <main className="cart-main" id="main-content">
      <h1>Your Cart ({itemCount})</h1>

      {lines.length === 0 ? (
        <div className="cart-empty">
          <p role="status">Your cart is empty.</p>
          <button type="button" className="cart-continue" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="visually-hidden">
              Cart items
            </h2>
            <table className="cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                  <th scope="col">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const lineTotal = line.price * line.quantity;
                  return (
                    <tr key={line.id}>
                      <td>
                        <div className="cart-line-product">
                          <CartLineImage line={line} />
                          <span className="cart-line-title">{line.title}</span>
                        </div>
                      </td>
                      <td>{formatPrice(line.price)}</td>
                      <td>
                        <div className="cart-stepper">
                          <button
                            type="button"
                            className="cart-stepper-button"
                            aria-label={`Decrease quantity of ${line.title}`}
                            disabled={line.quantity <= 1}
                            onClick={() => setLineQuantity(line.id, line.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="cart-stepper-value" aria-live="polite">
                            <span className="visually-hidden">Quantity of {line.title}: </span>
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="cart-stepper-button"
                            aria-label={`Increase quantity of ${line.title}`}
                            onClick={() => setLineQuantity(line.id, line.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{formatPrice(lineTotal)}</td>
                      <td>
                        <button
                          type="button"
                          className="cart-remove"
                          aria-label={`Remove ${line.title} from cart`}
                          onClick={() => removeLine(line.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button type="button" className="cart-continue" onClick={onContinueShopping}>
              Continue Shopping
            </button>
          </section>

          <aside className="cart-summary" aria-labelledby="cart-summary-heading">
            <h2 id="cart-summary-heading">Order Summary</h2>
            <dl className="cart-summary-list">
              <div className="cart-summary-row">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="cart-summary-row cart-summary-total">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            {orderError && (
              <p className="cart-order-error" role="alert">
                {orderError}
              </p>
            )}
            <button type="button" className="cart-place-order" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}

      {placedOrder && (
        <Dialog labelledBy={successTitleId} onClose={handleCloseSuccess}>
          <div className="cart-success">
            <h2 id={successTitleId} className="cart-success-title">
              Order placed
            </h2>
            <p className="cart-success-message">
              Thank you. Your order for {placedOrder.itemCount} item
              {placedOrder.itemCount === 1 ? '' : 's'} totaling {formatPrice(placedOrder.total)} was
              placed successfully.
            </p>
            <button
              type="button"
              className="cart-place-order"
              onClick={() => {
                handleCloseSuccess();
                onContinueShopping();
              }}
            >
              Continue Shopping
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
