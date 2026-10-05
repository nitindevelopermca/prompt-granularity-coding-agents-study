import { useCart } from '../context/CartContext'
import { useRouter, type Route } from '../context/RouterContext'

const NAV_LINKS: { route: Route; label: string }[] = [
  { route: '/products', label: 'Products' },
  { route: '/cart', label: 'Cart' },
]

export default function AppHeader() {
  const { route, navigate } = useRouter()
  const { itemCount } = useCart()

  return (
    <header className="app-header">
      <a className="app-brand" href="/products" onClick={(e) => { e.preventDefault(); navigate('/products') }}>
        <svg
          className="app-brand-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        <span>MyShop</span>
      </a>

      <nav className="app-nav" aria-label="Main">
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.route}>
              <a
                href={link.route}
                aria-current={route === link.route ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(link.route)
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <a
        className="cart-link"
        href="/cart"
        onClick={(e) => { e.preventDefault(); navigate('/cart') }}
        aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"
          />
        </svg>
        <span className="cart-badge" aria-hidden="true">
          {itemCount}
        </span>
      </a>
    </header>
  )
}
