import { useEffect, useRef, useState } from 'react'
import type { Product } from './ProductCatalog'

export type CartItem = {
  product: Product
  quantity: number
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function CartImage({ product }: { product: Product }) {
  const source = product.thumbnail?.trim() || product.images?.[0] || ''
  const [failed, setFailed] = useState(!source)

  if (failed) {
    return (
      <div className="cart-image cart-image--missing" role="img" aria-label={`Image unavailable for ${product.title}`}>
        <span aria-hidden="true">◇</span>
      </div>
    )
  }

  return (
    <img
      className="cart-image"
      src={source}
      alt={product.title}
      onError={() => setFailed(true)}
    />
  )
}

export default function CartPage({
  items,
  onContinueShopping,
  onQuantityChange,
  onRemove,
  onPlaceOrder,
}: {
  items: CartItem[]
  onContinueShopping: () => void
  onQuantityChange: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onPlaceOrder: () => void
}) {
  const [orderPlaced, setOrderPlaced] = useState(false)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  useEffect(() => {
    if (orderPlaced) confirmationRef.current?.focus()
  }, [orderPlaced])

  function placeOrder() {
    onPlaceOrder()
    setOrderPlaced(true)
  }

  if (orderPlaced) {
    return (
      <main className="cart-main">
        <section
          className="order-success"
          ref={confirmationRef}
          tabIndex={-1}
          role="status"
          aria-labelledby="order-success-heading"
        >
          <span className="order-success__mark" aria-hidden="true">✓</span>
          <p className="order-success__eyebrow">Order confirmed</p>
          <h1 id="order-success-heading">Thank you for your order!</h1>
          <p>Your order has been placed successfully.</p>
          <button type="button" onClick={onContinueShopping}>
            Continue shopping
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="cart-main">
      <div className="cart-container">
        <div className="cart-title">
          <p>Shopping bag</p>
          <h1>Your Cart ({itemCount})</h1>
        </div>

        {items.length === 0 ? (
          <section className="empty-cart" aria-labelledby="empty-cart-heading">
            <span aria-hidden="true">⌑</span>
            <h2 id="empty-cart-heading">Your cart is empty</h2>
            <p>Explore our products and find something you love.</p>
            <button type="button" onClick={onContinueShopping}>
              Continue shopping
            </button>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Items in your cart">
              <div className="cart-list-heading" aria-hidden="true">
                <span>Product</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              <ul>
                {items.map(({ product, quantity }) => (
                  <li className="cart-line" key={product.id}>
                    <div className="cart-product">
                      <CartImage product={product} />
                      <div>
                        <p className="cart-product__brand">
                          {product.brand?.trim() || 'Brand unavailable'}
                        </p>
                        <h2>{product.title}</h2>
                        <p className="cart-product__price">{currency.format(product.price)} each</p>
                        <button type="button" onClick={() => onRemove(product.id)}>
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="quantity-stepper" aria-label={`Quantity for ${product.title}`}>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label={`Decrease quantity of ${product.title}`}
                      >
                        −
                      </button>
                      <output aria-live="polite" aria-label={`${quantity} in cart`}>
                        {quantity}
                      </output>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product.id, quantity + 1)}
                        aria-label={`Increase quantity of ${product.title}`}
                      >
                        +
                      </button>
                    </div>

                    <p className="cart-line__total">
                      {currency.format(product.price * quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <button className="continue-link" type="button" onClick={onContinueShopping}>
                <span aria-hidden="true">←</span> Continue Shopping
              </button>
            </section>

            <aside className="order-summary" aria-labelledby="summary-heading">
              <h2 id="summary-heading">Order Summary</h2>
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{currency.format(subtotal)}</dd>
                </div>
                <div className="order-summary__total">
                  <dt>Total</dt>
                  <dd>{currency.format(subtotal)}</dd>
                </div>
              </dl>
              <button type="button" onClick={placeOrder}>
                Place Order
              </button>
              <p>No payment or shipping information is required.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
