import { BagIcon, CartIcon } from './Icons'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Header.css'

export type AppPage = 'products' | 'cart'

interface HeaderProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { totalQuantity } = useCart()
  const { setUser } = useAuth()

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__brand"
        onClick={() => onNavigate('products')}
        aria-label="MyShop, go to products"
      >
        <BagIcon className="app-header__brand-icon" />
        <span className="app-header__brand-name">MyShop</span>
      </button>

      <nav className="app-header__nav" aria-label="Primary">
        <button
          type="button"
          className="app-header__nav-link"
          onClick={() => onNavigate('products')}
        >
          Home
        </button>
        <button
          type="button"
          className="app-header__nav-link"
          aria-current={currentPage === 'products' ? 'page' : undefined}
          data-active={currentPage === 'products'}
          onClick={() => onNavigate('products')}
        >
          Products
        </button>
        <button type="button" className="app-header__nav-link" aria-disabled="true">
          Categories
        </button>
        <button type="button" className="app-header__nav-link" aria-disabled="true">
          About Us
        </button>
      </nav>

      <div className="app-header__actions">
        <button
          type="button"
          className="app-header__cart-button"
          aria-current={currentPage === 'cart' ? 'page' : undefined}
          onClick={() => onNavigate('cart')}
          aria-label={`Cart, ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
        >
          <CartIcon />
          <span className="app-header__cart-badge" aria-hidden="true">
            {totalQuantity}
          </span>
        </button>
        <button type="button" className="app-header__logout" onClick={() => setUser(null)}>
          Log out
        </button>
      </div>
    </header>
  )
}
