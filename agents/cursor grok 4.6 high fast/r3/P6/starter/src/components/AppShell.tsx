import type { MouseEvent, ReactNode } from 'react'
import { useCart } from '../cart/CartContext'
import './AppShell.css'

export type AppRoute = 'products' | 'cart'

type AppShellProps = {
  route: AppRoute
  navigate: (path: string) => void
  children: ReactNode
}

function BagMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M18 18c0-4.2 2.7-7 6-7s6 2.8 6 7"
        stroke="#2563eb"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect
        x="12"
        y="16.5"
        width="24"
        height="20"
        rx="6"
        stroke="#2563eb"
        strokeWidth="2.2"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7h15l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.6L5 4H3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="18" cy="20" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function AppShell({ route, navigate, children }: AppShellProps) {
  const { itemCount } = useCart()
  const cartCount = itemCount

  function goTo(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault()
    navigate(path)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="app-brand"
          href="/products"
          aria-label="MyShop, All Products"
          onClick={(event) => goTo(event, '/products')}
        >
          <BagMark />
          <span className="app-brand-name">MyShop</span>
        </a>

        <nav className="app-nav" aria-label="Primary">
          <a
            href="/products"
            aria-current={route === 'products' ? 'page' : undefined}
            onClick={(event) => goTo(event, '/products')}
          >
            Products
          </a>
          <span className="app-nav-inert">Categories</span>
          <span className="app-nav-inert">About Us</span>
        </nav>

        <a
          className="app-cart-link"
          href="/cart"
          aria-current={route === 'cart' ? 'page' : undefined}
          aria-label={`Cart, ${cartCount} items`}
          onClick={(event) => goTo(event, '/cart')}
        >
          <CartIcon />
          <span className="app-cart-badge" aria-hidden="true">
            {cartCount}
          </span>
        </a>
      </header>
      {children}
    </div>
  )
}
