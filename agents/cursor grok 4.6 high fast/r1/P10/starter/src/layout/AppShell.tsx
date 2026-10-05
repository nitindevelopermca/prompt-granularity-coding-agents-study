import type { MouseEvent, ReactNode } from 'react'
import { useCart } from '../cart/CartContext'
import './AppShell.css'

const PRODUCTS_PATH = '/products'
const CART_PATH = '/cart'

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
        d="M6 7h15l-1.4 9.2A2 2 0 0 1 17.63 18H8.5a2 2 0 0 1-1.97-1.64L5 4H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20.2" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20.2" r="1.2" fill="currentColor" />
    </svg>
  )
}

export default function AppShell({ path, navigate, children }: AppShellProps) {
  const { itemCount: cartCount } = useCart()
  const onProducts = path === PRODUCTS_PATH
  const onCart = path === CART_PATH

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
        <a
          className="app-shell-brand"
          href={PRODUCTS_PATH}
          onClick={(event) => goTo(event, PRODUCTS_PATH)}
        >
          <BagMark />
          <span>MyShop</span>
        </a>

        <nav className="app-shell-nav" aria-label="Primary">
          <a href={PRODUCTS_PATH} onClick={(event) => goTo(event, PRODUCTS_PATH)}>
            Home
          </a>
          <a
            href={PRODUCTS_PATH}
            onClick={(event) => goTo(event, PRODUCTS_PATH)}
            aria-current={onProducts ? 'page' : undefined}
          >
            Products
          </a>
          <span>Categories</span>
          <span>About Us</span>
        </nav>

        <a
          className="app-shell-cart"
          href={CART_PATH}
          onClick={(event) => goTo(event, CART_PATH)}
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          aria-current={onCart ? 'page' : undefined}
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
