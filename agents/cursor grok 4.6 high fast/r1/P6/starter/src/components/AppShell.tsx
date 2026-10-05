import type { MouseEvent, ReactNode } from 'react'
import { CART_PATH, PRODUCTS_PATH } from '../navigation'
import { BagMark, CartIcon } from './Icons'
import './AppShell.css'

interface AppShellProps {
  pathname: string
  cartCount: number
  onNavigate: (to: string) => void
  children: ReactNode
}

export function AppShell({ pathname, cartCount, onNavigate, children }: AppShellProps) {
  const onProducts = pathname === PRODUCTS_PATH
  const onCart = pathname === CART_PATH

  function goTo(event: MouseEvent<HTMLAnchorElement>, to: string) {
    event.preventDefault()
    onNavigate(to)
  }

  function ignore(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
  }

  const cartLabel = `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="app-brand" href={PRODUCTS_PATH} onClick={(event) => goTo(event, PRODUCTS_PATH)}>
          <BagMark className="app-brand-mark" />
          <span>MyShop</span>
        </a>

        <nav className="app-nav" aria-label="Primary">
          <a href={PRODUCTS_PATH} onClick={(event) => goTo(event, PRODUCTS_PATH)}>
            Home
          </a>
          <a
            href={PRODUCTS_PATH}
            className={onProducts ? 'is-active' : undefined}
            aria-current={onProducts ? 'page' : undefined}
            onClick={(event) => goTo(event, PRODUCTS_PATH)}
          >
            Products
          </a>
          <a href="#categories" aria-disabled="true" onClick={ignore}>
            Categories
          </a>
          <a href="#about" aria-disabled="true" onClick={ignore}>
            About Us
          </a>
        </nav>

        <a
          className="app-cart"
          href={CART_PATH}
          aria-label={cartLabel}
          aria-current={onCart ? 'page' : undefined}
          onClick={(event) => goTo(event, CART_PATH)}
        >
          <CartIcon className="app-cart-icon" />
          <span className="app-cart-badge" aria-hidden="true">
            {cartCount}
          </span>
        </a>
      </header>
      {children}
    </div>
  )
}
