import { BagIcon, CartIcon } from './icons.tsx'

export type AppView = 'products' | 'cart'

interface HeaderProps {
  cartCount: number
  activeView: AppView
  onNavigate: (view: AppView) => void
}

export function Header({ cartCount, activeView, onNavigate }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <BagIcon size={26} />
        <span>MyShop</span>
      </div>

      <nav className="app-header__nav" aria-label="Main">
        <a href="#" onClick={(event) => event.preventDefault()}>
          Home
        </a>
        <a
          href="#"
          className={activeView === 'products' ? 'is-active' : undefined}
          aria-current={activeView === 'products' ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault()
            onNavigate('products')
          }}
        >
          Products
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          Categories
        </a>
        <a href="#" onClick={(event) => event.preventDefault()}>
          About Us
        </a>
      </nav>

      <button
        type="button"
        className="app-header__cart"
        onClick={() => onNavigate('cart')}
        aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
      >
        <CartIcon />
        <span className="app-header__cart-badge" aria-hidden="true">
          {cartCount}
        </span>
      </button>
    </header>
  )
}
