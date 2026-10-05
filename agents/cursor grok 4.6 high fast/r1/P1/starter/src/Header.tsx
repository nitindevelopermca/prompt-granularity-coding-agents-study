import { useCart } from './cart'
import { BagIcon, CartIcon } from './icons'
import type { Route } from './types'

type HeaderProps = {
  route: Route
  onNavigate: (route: Route) => void
}

export function Header({ route, onNavigate }: HeaderProps) {
  const { itemCount } = useCart()

  return (
    <header className="app-header">
      <div className="header-inner">
        <a
          className="header-brand"
          href="#/products"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('products')
          }}
        >
          <BagIcon className="header-bag" />
          <span className="brand-name">MyShop</span>
        </a>

        <nav className="header-nav" aria-label="Primary">
          <a
            href="#/products"
            className="nav-link"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('products')
            }}
          >
            Home
          </a>
          <a
            href="#/products"
            className={route === 'products' ? 'nav-link is-active' : 'nav-link'}
            aria-current={route === 'products' ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              onNavigate('products')
            }}
          >
            Products
          </a>
          <span className="nav-link is-inert">Categories</span>
          <span className="nav-link is-inert">About Us</span>
        </nav>

        <a
          className="cart-link"
          href="#/cart"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('cart')
          }}
          aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        >
          <CartIcon className="cart-icon" />
          <span className="cart-badge" aria-hidden="true">
            {itemCount}
          </span>
        </a>
      </div>
    </header>
  )
}
