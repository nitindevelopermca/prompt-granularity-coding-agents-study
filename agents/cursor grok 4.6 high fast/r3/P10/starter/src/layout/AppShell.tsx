import type { MouseEvent, ReactNode } from 'react'
import { useCart } from '../cart/CartContext'
import './AppShell.css'

export const PRODUCTS_PATH = '/products'
export const CART_PATH = '/cart'

type AppShellProps = {
  path: string
  navigate: (to: string) => void
  children: ReactNode
}

function BagMark() {
  return (
    <svg className="app-shell-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M14 18h20l-1.6 20.2A3 3 0 0 1 29.41 41H18.59a3 3 0 0 1-2.99-2.8L14 18Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M18 18v-3.5a6 6 0 0 1 12 0V18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="app-shell-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 7h15l-1.4 9.2A2 2 0 0 1 17.63 18H8.5A2 2 0 0 1 6.54 16.3L4.2 4H2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20.2" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20.2" r="1.3" fill="currentColor" />
    </svg>
  )
}

export default function AppShell({ path, navigate, children }: AppShellProps) {
  const { itemCount: cartCount } = useCart()

  function goTo(event: MouseEvent<HTMLAnchorElement>, to: string) {
    event.preventDefault()
    navigate(to)
  }

  return (
    <div className="app-shell">
      <a className="app-shell-skip" href="#main-content">
        Skip to main content
      </a>

      <header className="app-shell-header">
        <a className="app-shell-brand" href={PRODUCTS_PATH} onClick={(event) => goTo(event, PRODUCTS_PATH)}>
          <BagMark />
          <span className="app-shell-brand-name">MyShop</span>
        </a>

        <nav className="app-shell-nav" aria-label="Primary">
          <a
            href={PRODUCTS_PATH}
            className="app-shell-nav-link"
            aria-current={path === PRODUCTS_PATH ? 'page' : undefined}
            onClick={(event) => goTo(event, PRODUCTS_PATH)}
          >
            Products
          </a>
          <span className="app-shell-nav-link app-shell-nav-inert">Categories</span>
          <span className="app-shell-nav-link app-shell-nav-inert">About Us</span>
        </nav>

        <a
          className="app-shell-cart"
          href={CART_PATH}
          aria-label={`Cart, ${cartCount} items`}
          aria-current={path === CART_PATH ? 'page' : undefined}
          onClick={(event) => goTo(event, CART_PATH)}
        >
          <CartIcon />
          <span className="app-shell-cart-badge" aria-hidden="true">
            {cartCount}
          </span>
        </a>
      </header>

      {children}
    </div>
  )
}
