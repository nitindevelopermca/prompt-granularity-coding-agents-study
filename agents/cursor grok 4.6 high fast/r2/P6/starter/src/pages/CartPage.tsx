import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { navigate } from '../app/navigation'
import { useCart } from '../cart/CartContext'
import type { CartItem } from '../cart/types'
import './CartPage.css'

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function handleContinueShopping(event: MouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  event.preventDefault()
  navigate('/products')
}

function CartLine({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem
  onQuantityChange: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
}) {
  const [imageBroken, setImageBroken] = useState(false)
  const lineTotal = item.price * item.quantity

  return (
    <tr>
      <td>
        <div className="cart-product">
          <div className="cart-product-image">
            {item.thumbnail && !imageBroken ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                onError={() => setImageBroken(true)}
              />
            ) : (
              <span className="cart-image-fallback">No image</span>
            )}
          </div>
          <div>
            <p className="cart-product-title">{item.title}</p>
            <p className="cart-product-price">{formatPrice(item.price)}</p>
          </div>
        </div>
      </td>
      <td data-label="Price">{formatPrice(item.price)}</td>
      <td data-label="Quantity">
        <div className="cart-stepper">
          <button
            type="button"
            aria-label={`Decrease quantity of ${item.title}`}
            disabled={item.quantity <= 1}
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          >
            −
          </button>
          <span aria-live="polite" aria-label={`Quantity of ${item.title}`}>
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity of ${item.title}`}
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="cart-remove"
          aria-label={`Remove ${item.title} from cart`}
          onClick={() => onRemove(item.id)}
        >
          Remove
        </button>
      </td>
      <td data-label="Total">{formatPrice(lineTotal)}</td>
    </tr>
  )
}

export function CartPage() {
  const { items, itemCount, subtotal, setItemQuantity, removeItem, clearCart } = useCart()
  const [confirmation, setConfirmation] = useState<{ count: number; total: number } | null>(null)
  const [orderError, setOrderError] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'MyShop — Cart'
  }, [])

  useEffect(() => {
    if (confirmation) {
      successRef.current?.focus()
    }
  }, [confirmation])

  function placeOrder() {
    setOrderError('')

    if (items.length === 0) {
      setOrderError('Your cart is empty. Add a product before placing an order.')
      return
    }

    setConfirmation({ count: itemCount, total: subtotal })
    clearCart()
  }

  if (confirmation) {
    return (
      <main className="app-main cart-page">
        <div
          ref={successRef}
          className="cart-success"
          role="status"
          tabIndex={-1}
        >
          <h1>Order placed</h1>
          <p>
            Thank you. Your order for {confirmation.count}{' '}
            {confirmation.count === 1 ? 'item' : 'items'} totaling{' '}
            {formatPrice(confirmation.total)} has been placed.
          </p>
          <a className="cart-continue" href="/products" onClick={handleContinueShopping}>
            Continue Shopping
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="app-main cart-page">
      <h1>Your Cart ({itemCount})</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty. Add products to continue.</p>
          <a className="cart-continue" href="/products" onClick={handleContinueShopping}>
            Continue Shopping
          </a>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines" aria-labelledby="cart-items-heading">
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
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <CartLine
                    key={item.id}
                    item={item}
                    onQuantityChange={setItemQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </tbody>
            </table>
            <a className="cart-continue" href="/products" onClick={handleContinueShopping}>
              ← Continue Shopping
            </a>
          </section>

          <aside className="cart-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <dl>
              <div>
                <dt>
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="cart-summary-total">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            {orderError ? (
              <p className="cart-order-error" role="alert">
                {orderError}
              </p>
            ) : null}
            <button type="button" className="cart-place-order" onClick={placeOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}
