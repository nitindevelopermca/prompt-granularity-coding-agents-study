import { useCart } from '../cart/CartContext'
import { interceptInAppLink } from '../navigation'

export type AuthedPath = '/products' | '/cart'

type AppHeaderProps = {
  currentPath: AuthedPath
}

function BagMark() {
  return (
    <svg className="app-logo-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M10 12V10.5a6 6 0 0 1 12 0V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="7" y="12" width="18" height="15" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M13.5 12v2.2a2.5 2.5 0 0 0 5 0V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="app-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.2 7.2h13.1l-1.2 8.4H8L6.2 7.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M6.2 7.2 5.2 4H3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9.2" cy="19.2" r="1.2" fill="currentColor" />
      <circle cx="16.8" cy="19.2" r="1.2" fill="currentColor" />
    </svg>
  )
}

export default function AppHeader({ currentPath }: AppHeaderProps) {
  const { itemCount } = useCart()
  const cartLabel = `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a
          className="app-logo"
          href="/products"
          onClick={(event) => interceptInAppLink(event, '/products')}
        >
          <BagMark />
          <span>MyShop</span>
        </a>

        <nav className="app-nav" aria-label="Primary">
          <ul>
            <li>
              <a href="/products" onClick={(event) => interceptInAppLink(event, '/products')}>
                Home
              </a>
            </li>
            <li>
              <a
                href="/products"
                aria-current={currentPath === '/products' ? 'page' : undefined}
                onClick={(event) => interceptInAppLink(event, '/products')}
              >
                Products
              </a>
            </li>
            <li>
              <a href="#categories" aria-disabled="true" onClick={(event) => event.preventDefault()}>
                Categories
              </a>
            </li>
            <li>
              <a href="#about" aria-disabled="true" onClick={(event) => event.preventDefault()}>
                About Us
              </a>
            </li>
          </ul>
        </nav>

        <a
          className="app-cart"
          href="/cart"
          aria-label={cartLabel}
          aria-current={currentPath === '/cart' ? 'page' : undefined}
          onClick={(event) => interceptInAppLink(event, '/cart')}
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
