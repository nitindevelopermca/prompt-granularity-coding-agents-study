import { type MouseEvent, type ReactNode } from 'react'
import { navigate, usePathname } from '../app/navigation'
import { useCart } from '../cart/CartContext'
import './AppShell.css'

function BagMark() {
  return (
    <svg className="app-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 8.2h9.6l-.85 11.1a1.6 1.6 0 0 1-1.6 1.48H9.65a1.6 1.6 0 0 1-1.6-1.48L7.2 8.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.2V7.15a2.9 2.9 0 0 1 5.8 0V8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="app-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      <path
        d="M4.5 5h1.7l1.2 10.2a1.6 1.6 0 0 0 1.6 1.4h8.3a1.6 1.6 0 0 0 1.58-1.28L20 8.2H7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function handleAppLink(event: MouseEvent<HTMLAnchorElement>, to: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  event.preventDefault()
  navigate(to)
}

function AppHeader() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const onProducts = pathname === '/products'
  const onCart = pathname === '/cart'
  const cartLabel = `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a
          className="app-brand"
          href="/products"
          onClick={(event) => handleAppLink(event, '/products')}
        >
          <BagMark />
          <span>MyShop</span>
        </a>

        <nav className="app-nav" aria-label="Primary">
          <a
            className="app-nav-link"
            href="/products"
            onClick={(event) => handleAppLink(event, '/products')}
          >
            Home
          </a>
          <a
            className="app-nav-link"
            href="/products"
            aria-current={onProducts ? 'page' : undefined}
            onClick={(event) => handleAppLink(event, '/products')}
          >
            Products
          </a>
          <span className="app-nav-link is-inert">Categories</span>
          <span className="app-nav-link is-inert">About Us</span>
        </nav>

        <a
          className="app-cart-link"
          href="/cart"
          aria-label={cartLabel}
          aria-current={onCart ? 'page' : undefined}
          onClick={(event) => handleAppLink(event, '/cart')}
        >
          <CartIcon />
          <span className="app-cart-badge" aria-hidden="true">
            {itemCount}
          </span>
        </a>
      </div>
    </header>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppHeader />
      {children}
    </div>
  )
}
