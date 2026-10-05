import { useEffect, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { formatPrice } from '../components/productDisplay'
import { ROUTES, navigate } from '../navigation'
import './CartPage.css'

function CartLineImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src])

  if (!src || broken) {
    return (
      <div className="cart-line-fallback" role="img" aria-label={alt}>
        No image
      </div>
    )
  }

  return <img className="cart-line-image" src={src} alt={alt} onError={() => setBroken(true)} />
}

export function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    orderConfirmed,
    setQuantity,
    removeItem,
    placeOrder,
    dismissOrderConfirmation,
  } = useCart()

  useEffect(() => {
    document.title = 'Cart · MyShop'
  }, [])

  function goToProducts() {
    dismissOrderConfirmation()
    navigate(ROUTES.products)
  }

  function handlePlaceOrder() {
    if (items.length === 0) {
      return
    }
    placeOrder()
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <h1 id="cart-heading">Your Cart ({itemCount})</h1>

      {orderConfirmed ? (
        <div className="cart-success" role="status">
          <h2>Order placed</h2>
          <p>Thank you. Your order was placed successfully.</p>
          <button type="button" className="cart-continue" onClick={goToProducts}>
            Continue Shopping
          </button>
        </div>
      ) : null}

      {!orderConfirmed && items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <button type="button" className="cart-continue" onClick={goToProducts}>
            Continue Shopping
          </button>
        </div>
      ) : null}

      {!orderConfirmed && items.length > 0 ? (
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
                  <th scope="col">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="cart-product">
                        <CartLineImage src={item.thumbnail} alt={item.title} />
                        <span className="cart-product-title">{item.title}</span>
                      </div>
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td>
                      <div className="cart-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.title}`}
                          disabled={item.quantity <= 1}
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                    <td>
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="cart-summary-total">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            <button type="button" className="cart-place-order" onClick={handlePlaceOrder}>
              Place Order
            </button>
            <button type="button" className="cart-continue-secondary" onClick={goToProducts}>
              Continue Shopping
            </button>
          </aside>
        </div>
      ) : null}
    </section>
  )
}
