import type { View } from '../App'
import { useCart } from '../context/CartContext'

interface HeaderProps {
  currentView: View
  onNavigate: (view: View) => void
}

export default function Header({ currentView, onNavigate }: HeaderProps) {
  const { count } = useCart()

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__bag" aria-hidden="true">
          🛍️
        </span>
        <span className="app-header__logo">MyShop</span>
      </div>
      <nav className="app-header__nav" aria-label="Main navigation">
        <button
          type="button"
          className={`app-header__link${currentView === 'products' ? ' app-header__link--active' : ''}`}
          onClick={() => onNavigate('products')}
          aria-current={currentView === 'products' ? 'page' : undefined}
        >
          Products
        </button>
        <button
          type="button"
          className={`app-header__link${currentView === 'cart' ? ' app-header__link--active' : ''}`}
          onClick={() => onNavigate('cart')}
          aria-current={currentView === 'cart' ? 'page' : undefined}
        >
          <span aria-hidden="true">🛒</span> Cart
          <span className="app-header__badge" aria-label={`${count} item${count === 1 ? '' : 's'} in cart`}>
            {count}
          </span>
        </button>
      </nav>
    </header>
  )
}
