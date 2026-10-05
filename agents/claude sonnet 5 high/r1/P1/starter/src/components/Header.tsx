import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { BagIcon, CartIcon } from './icons'

export function Header() {
  const { logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/products" className="app-header__brand">
          <BagIcon className="app-header__brand-icon" />
          <span>MyShop</span>
        </Link>

        <nav className="app-header__nav" aria-label="Main navigation">
          <a href="#" className="app-header__nav-link" aria-disabled="true" onClick={(e) => e.preventDefault()}>
            Home
          </a>
          <Link to="/products" className="app-header__nav-link app-header__nav-link--active">
            Products
          </Link>
          <a href="#" className="app-header__nav-link" aria-disabled="true" onClick={(e) => e.preventDefault()}>
            Categories
          </a>
          <a href="#" className="app-header__nav-link" aria-disabled="true" onClick={(e) => e.preventDefault()}>
            About Us
          </a>
        </nav>

        <div className="app-header__actions">
          <Link to="/cart" className="app-header__cart" aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}>
            <CartIcon />
            <span className="app-header__cart-badge" aria-hidden="true">
              {itemCount}
            </span>
          </Link>
          <button type="button" className="app-header__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
