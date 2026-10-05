import { useEffect, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { ChevronLeftIcon } from '../components/Icons'
import { formatPrice } from '../components/productDisplay'
import { ROUTES, navigate } from '../navigation'
import './CartPage.css'

export function CartPage() {
  const { items, itemCount, subtotal, orderConfirmed, setQuantity, removeItem, placeOrder, dismissOrderConfirmation } =
    useCart()
  const [failedThumbs, setFailedThumbs] = useState<Record<number, true>>({})

  useEffect(() => {
    document.title = 'Cart · MyShop'
  }, [])

  function continueShopping() {
    dismissOrderConfirmation()
    navigate(ROUTES.products)
  }

  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <h1 id="cart-heading">Your Cart ({itemCount})</h1>

      {orderConfirmed ? (
        <p className="cart-success" role="status">
          Your order has been placed. Thank you for shopping with MyShop.
        </p>
      ) : null}

      {items.length === 0 && !orderConfirmed ? (
        <p className="cart-empty">Your cart is empty.</p>
      ) : null}

      {items.length > 0 ? (
        <div className="cart-layout">
          <div className="cart-lines">
            <table className="cart-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const lineTotal = item.price * item.quantity
                  const thumbFailed = failedThumbs[item.productId]
                  return (
                    <tr key={item.productId}>
                      <td>
                        <div className="cart-product">
                          {item.thumbnail && !thumbFailed ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              onError={() =>
                                setFailedThumbs((current) =>
                                  current[item.productId] ? current : { ...current, [item.productId]: true },
                                )
                              }
                            />
                          ) : (
                            <div className="cart-thumb-fallback" role="img" aria-label={`${item.title}, image unavailable`}>
                              No image
                            </div>
                          )}
                          <span className="cart-product-title">{item.title}</span>
                        </div>
                      </td>
                      <td className="cart-price">{formatPrice(item.price)}</td>
                      <td>
                        <div className="cart-qty">
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
                        <button
                          type="button"
                          className="cart-remove"
                          aria-label={`Remove ${item.title} from cart`}
                          onClick={() => removeItem(item.productId)}
                        >
                          Remove
                        </button>
                      </td>
                      <td className="cart-line-total">{formatPrice(lineTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal ({itemLabel})</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="cart-summary-total">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            <button type="button" className="cart-place-order" onClick={placeOrder}>
              Place Order
            </button>
          </aside>
        </div>
      ) : null}

      <div className="cart-continue-wrap">
        <button type="button" className="cart-continue" onClick={continueShopping}>
          <ChevronLeftIcon />
          Continue Shopping
        </button>
      </div>
    </section>
  )
}
