// Cart / order screen. UX: spec/ux/ux-design-of-cart.png. Local frontend
// state only (no GET-cart API). Place Order gives an in-app success
// confirmation only; no payment, shipping, or tax per spec/SPEC_FREEZE.md.

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../router/Router';
import { MinusIcon, PlusIcon } from '../components/Icons';

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const { navigate } = useRouter();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const total = subtotal;

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  const goToProducts = () => navigate('/products');

  if (orderPlaced) {
    return (
      <div className="cart-page cart-page--success">
        <div className="order-success" role="status">
          <h1>Order placed!</h1>
          <p>Thank you for your purchase. Your order has been placed successfully.</p>
          <button type="button" className="btn btn-primary" onClick={goToProducts}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Cart ({itemCount})</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <button type="button" className="btn btn-outline" onClick={goToProducts}>
            &larr; Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-table-wrap">
            <table className="cart-table">
              <caption className="sr-only">Items in your cart</caption>
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
                      <div className="cart-item">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="cart-item__thumb" />
                        ) : (
                          <div className="cart-item__thumb cart-item__thumb--fallback" aria-hidden="true" />
                        )}
                        <div>
                          <p className="cart-item__title">{item.title}</p>
                          <button type="button" className="link-button" onClick={() => removeItem(item.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <div className="quantity-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <MinusIcon aria-hidden="true" />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <PlusIcon aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" className="btn btn-outline cart-continue" onClick={goToProducts}>
              &larr; Continue Shopping
            </button>
          </div>

          <aside className="order-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <div className="order-summary__row">
              <span>
                Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})
              </span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="order-summary__row order-summary__row--total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
