import type { MouseEvent } from 'react'
import { useCart } from '../cart/CartContext'
import { ROUTES, navigate } from '../navigation'
import { BagMark, CartIcon } from './Icons'
import './AppHeader.css'

type AppHeaderProps = {
  current: 'products' | 'cart'
}

function goTo(event: MouseEvent<HTMLAnchorElement>, path: string) {
  event.preventDefault()
  navigate(path)
}

export function AppHeader({ current }: AppHeaderProps) {
  const { itemCount } = useCart()
  const cartLabel = itemCount === 1 ? 'Cart, 1 item' : `Cart, ${itemCount} items`

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a className="app-brand" href={ROUTES.products} onClick={(event) => goTo(event, ROUTES.products)}>
          <BagMark className="app-brand-mark" />
          <span>MyShop</span>
        </a>

        <nav className="app-nav" aria-label="Primary">
          <a href={ROUTES.products} onClick={(event) => goTo(event, ROUTES.products)}>
            Home
          </a>
          <a
            href={ROUTES.products}
            aria-current={current === 'products' ? 'page' : undefined}
            onClick={(event) => goTo(event, ROUTES.products)}
          >
            Products
          </a>
          <span className="app-nav-inert">Categories</span>
          <span className="app-nav-inert">About Us</span>
        </nav>

          <a
            className="app-cart"
            href={ROUTES.cart}
            aria-label={cartLabel}
            aria-live="polite"
            aria-current={current === 'cart' ? 'page' : undefined}
            onClick={(event) => goTo(event, ROUTES.cart)}
          >
          <CartIcon className="app-cart-icon" />
          <span className="app-cart-badge" aria-hidden="true">
            {itemCount}
          </span>
        </a>
      </div>
    </header>
  )
}
