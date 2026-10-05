import { useState } from 'react'
import type { Product } from './Products'

export type CartItem = {
  product: Product
  quantity: number
}

type CartPageProps = {
  items: CartItem[]
  onIncrease: (productId: number) => void
  onDecrease: (productId: number) => void
  onRemove: (productId: number) => void
  onContinueShopping: () => void
  onPlaceOrder: () => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function CartImage({ product }: { product: Product }) {
  const candidates = [product.thumbnail, ...product.images].filter(
    (image, index, images) =>
      Boolean(image) && images.indexOf(image) === index,
  )
  const [sourceIndex, setSourceIndex] = useState(0)
  const source = candidates[sourceIndex]

  if (!source) {
    return (
      <div
        className="cart-image-fallback"
        role="img"
        aria-label={`Image unavailable for ${product.title}`}
      >
        ▧
      </div>
    )
  }

  return (
    <img
      className="cart-product-image"
      src={source}
      alt={product.title}
      onError={() => setSourceIndex((current) => current + 1)}
    />
  )
}

export default function CartPage({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onContinueShopping,
  onPlaceOrder,
}: CartPageProps) {
  const [orderPlaced, setOrderPlaced] = useState(false)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  function placeOrder() {
    if (items.length === 0) return
    onPlaceOrder()
    setOrderPlaced(true)
  }

  if (orderPlaced) {
    return (
      <section
        className="order-success"
        aria-labelledby="order-success-heading"
        role="status"
      >
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>
        <h1 id="order-success-heading">Order placed!</h1>
        <p>
          Thank you for your order. Your confirmation is complete in MyShop.
        </p>
        <button type="button" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </section>
    )
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <h1 id="cart-heading">Your Cart ({itemCount})</h1>

      {items.length === 0 ? (
        <div className="empty-cart">
          <div aria-hidden="true">◇</div>
          <h2>Your cart is empty</h2>
          <p>Add products to your cart to see them here.</p>
          <button type="button" onClick={onContinueShopping}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-area">
            <div className="cart-table-wrap">
              <table className="cart-table">
                <caption className="visually-hidden">
                  Products in your shopping cart
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Price</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ product, quantity }) => (
                    <tr key={product.id}>
                      <td>
                        <div className="cart-product">
                          <CartImage product={product} />
                          <div>
                            <h2>{product.title}</h2>
                            <button
                              className="remove-item"
                              type="button"
                              onClick={() => onRemove(product.id)}
                              aria-label={`Remove ${product.title} from cart`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="cart-price">
                        {formatCurrency(product.price)}
                      </td>
                      <td>
                        <div
                          className="quantity-stepper"
                          aria-label={`Quantity for ${product.title}`}
                        >
                          <button
                            type="button"
                            onClick={() => onDecrease(product.id)}
                            disabled={quantity === 1}
                            aria-label={`Decrease quantity of ${product.title}`}
                          >
                            −
                          </button>
                          <output aria-live="polite">{quantity}</output>
                          <button
                            type="button"
                            onClick={() => onIncrease(product.id)}
                            aria-label={`Increase quantity of ${product.title}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="line-total">
                        {formatCurrency(product.price * quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="continue-shopping"
              type="button"
              onClick={onContinueShopping}
            >
              <span aria-hidden="true">←</span> Continue Shopping
            </button>
          </div>

          <aside className="order-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd aria-live="polite">{formatCurrency(subtotal)}</dd>
              </div>
            </dl>
            <button
              className="place-order"
              type="button"
              onClick={placeOrder}
            >
              Place Order
            </button>
            <p>No payment is required for this demo order.</p>
          </aside>
        </div>
      )}
    </section>
  )
}
