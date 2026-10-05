import { AppLink } from './AppLink'
import { BrandMark } from './BrandMark'
import { useCart } from './cart'
import type { AppPath } from './types'

type AppHeaderProps = {
  currentPath: AppPath
}

export function AppHeader({ currentPath }: AppHeaderProps) {
  const { itemCount } = useCart()
  const cartLabel = `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`

  return (
    <header className="app-header">
      <AppLink to="/products" className="header-brand" aria-label="MyShop home">
        <BrandMark />
      </AppLink>

      <nav className="header-nav" aria-label="Primary">
        <AppLink to="/products" className="header-nav-link" aria-current={currentPath === '/products' ? 'page' : undefined}>
          Products
        </AppLink>
        <span className="header-nav-inert">Categories</span>
        <span className="header-nav-inert">About Us</span>
      </nav>

      <AppLink to="/cart" className="header-cart" aria-label={cartLabel} aria-current={currentPath === '/cart' ? 'page' : undefined}>
        <span className="header-cart-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6.5 7h13l-1.2 9.2A2 2 0 0 1 16.32 18H9.18a2 2 0 0 1-1.97-1.7L5.6 5.5H3.75"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="20.2" r="1.15" fill="currentColor" />
            <circle cx="16.2" cy="20.2" r="1.15" fill="currentColor" />
          </svg>
        </span>
        <span className="header-cart-badge" aria-hidden="true">
          {itemCount}
        </span>
      </AppLink>
    </header>
  )
}
