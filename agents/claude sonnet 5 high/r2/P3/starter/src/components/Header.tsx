import { useRouter } from '../router'
import { useCart } from '../context/CartContext'
import { BagIcon, CartIcon } from './icons'
import './Header.css'

export function Header() {
  const { route, navigate } = useRouter()
  const { totalQuantity } = useCart()

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a
          className="app-header__brand"
          href="/products"
          onClick={(event) => {
            event.preventDefault()
            navigate('/products')
          }}
        >
          <BagIcon className="app-header__brand-icon" />
          <span>MyShop</span>
        </a>

        <nav className="app-header__nav" aria-label="Primary">
          <a
            href="/products"
            className={route === '/products' ? 'app-header__link app-header__link--active' : 'app-header__link'}
            aria-current={route === '/products' ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              navigate('/products')
            }}
          >
            Products
          </a>
          <a
            href="#categories"
            className="app-header__link app-header__link--inert"
            onClick={(event) => event.preventDefault()}
          >
            Categories
          </a>
          <a
            href="#about"
            className="app-header__link app-header__link--inert"
            onClick={(event) => event.preventDefault()}
          >
            About Us
          </a>
        </nav>

        <a
          href="/cart"
          className="app-header__cart"
          aria-label={`Cart, ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
          onClick={(event) => {
            event.preventDefault()
            navigate('/cart')
          }}
        >
          <CartIcon className="app-header__cart-icon" />
          <span className="app-header__cart-badge" aria-hidden="true">
            {totalQuantity}
          </span>
        </a>
      </div>
    </header>
  )
}
