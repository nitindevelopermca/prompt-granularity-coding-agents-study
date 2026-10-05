import { BagIcon, CartIcon } from './icons'
import type { AppView } from './types'

type HeaderProps = {
  cartCount: number
  currentView: AppView
  onNavigate: (view: Exclude<AppView, 'login'>) => void
}

export function Header({ cartCount, currentView, onNavigate }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <p className="header-brand">
          <span className="brand-mark compact" aria-hidden="true">
            <BagIcon className="icon-md" />
          </span>
          <span>MyShop</span>
        </p>
        <nav className="header-nav" aria-label="Primary">
          <button
            type="button"
            className={currentView === 'products' ? 'nav-link current' : 'nav-link'}
            aria-current={currentView === 'products' ? 'page' : undefined}
            onClick={() => onNavigate('products')}
          >
            Home
          </button>
          <button
            type="button"
            className={currentView === 'products' ? 'nav-link current' : 'nav-link'}
            onClick={() => onNavigate('products')}
          >
            Products
          </button>
          <span className="nav-link inert">Categories</span>
          <span className="nav-link inert">About Us</span>
        </nav>
        <button
          type="button"
          className="cart-button"
          onClick={() => onNavigate('cart')}
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          aria-current={currentView === 'cart' ? 'page' : undefined}
        >
          <CartIcon className="icon-md" />
          <span className="cart-badge" aria-hidden="true">
            {cartCount}
          </span>
        </button>
      </div>
    </header>
  )
}
