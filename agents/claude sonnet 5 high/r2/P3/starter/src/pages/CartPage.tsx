import { displayPrice, lineTotal, useCart } from '../context/CartContext'
import { useRouter } from '../router'
import { usePageMeta } from '../hooks/usePageMeta'
import { ImageOffIcon } from '../components/icons'
import { useState } from 'react'
import './CartPage.css'

export function CartPage() {
  usePageMeta(
    'Your Cart — MyShop',
    'Review items in your MyShop cart, adjust quantities, and place your order.',
  )

  const { items, subtotal, total, totalQuantity, updateQuantity, removeItem, placeOrder, lastOrder, dismissLastOrder } =
    useCart()
  const { navigate } = useRouter()
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({})

  function goToProducts() {
    navigate('/products')
  }

  if (lastOrder) {
    return (
      <main className="cart-page">
        <div className="cart-success" role="status">
          <h1 className="cart-success__title">Order placed!</h1>
          <p className="cart-success__message">
            Thank you — your order <strong>{lastOrder.orderId}</strong> for {lastOrder.itemCount} item
            {lastOrder.itemCount === 1 ? '' : 's'} (${lastOrder.total.toFixed(2)}) has been placed.
          </p>
          <button
            type="button"
            className="cart-continue-btn"
            onClick={() => {
              dismissLastOrder()
              goToProducts()
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
      <h1 className="cart-page__heading">Your Cart ({totalQuantity})</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <button type="button" className="cart-continue-btn" onClick={goToProducts}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            <table className="cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                  <th scope="col" className="visually-hidden">
                    Remove
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((line) => (
                  <tr key={line.productId}>
                    <td className="cart-table__product">
                      {brokenImages[line.productId] || !line.thumbnail ? (
                        <span className="cart-table__image-fallback" aria-hidden="true">
                          <ImageOffIcon />
                        </span>
                      ) : (
                        <img
                          src={line.thumbnail}
                          alt=""
                          className="cart-table__image"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [line.productId]: true }))}
                        />
                      )}
                      <span className="cart-table__title">{line.title}</span>
                    </td>

                    <td className="cart-table__price">${displayPrice(line).toFixed(2)}</td>

                    <td className="cart-table__qty">
                      <div className="qty-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${line.title}`}
                          onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                        >
                          −
                        </button>
                        <span aria-live="polite">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${line.title}`}
                          onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button type="button" className="cart-table__remove" onClick={() => removeItem(line.productId)}>
                        Remove
                      </button>
                    </td>

                    <td className="cart-table__line-total">${lineTotal(line).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" className="cart-continue-btn cart-continue-btn--inline" onClick={goToProducts}>
              ← Continue Shopping
            </button>
          </section>

          <aside className="cart-summary" aria-label="Order summary">
            <h2 className="cart-summary__title">Order Summary</h2>
            <div className="cart-summary__row">
              <span>Subtotal ({totalQuantity} item{totalQuantity === 1 ? '' : 's'})</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button type="button" className="cart-summary__place-order" onClick={placeOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}
