import { BagIcon, CartIcon } from '../icons'
import { navigate } from '../router'
import { useCart } from '../cart'
import type { Route } from '../types'

type HeaderProps = {
  current: Route
}

export function Header({ current }: HeaderProps) {
  const { itemCount } = useCart()

  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="header-brand" href="#/products">
          <span className="brand-mark small" aria-hidden="true">
            <BagIcon />
          </span>
          <span className="brand-name">MyShop</span>
        </a>

        <nav className="header-nav" aria-label="Primary">
          <a
            href="#/products"
            className={current === 'products' ? 'nav-link active' : 'nav-link'}
            aria-current={current === 'products' ? 'page' : undefined}
          >
            Products
          </a>
          <a
            href="#/cart"
            className={current === 'cart' ? 'nav-link active' : 'nav-link'}
            aria-current={current === 'cart' ? 'page' : undefined}
          >
            Cart
          </a>
        </nav>

        <button
          type="button"
          className="cart-button"
          onClick={() => navigate('cart')}
          aria-label={`Cart, ${itemCount} items`}
        >
          <CartIcon className="cart-icon" />
          <span className="cart-badge" aria-hidden="true">
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  )
}
