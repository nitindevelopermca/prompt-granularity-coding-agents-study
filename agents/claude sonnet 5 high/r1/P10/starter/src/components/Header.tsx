// Shared header for the authenticated app shell (Products + Cart).
// Renders the MyShop mark, primary text nav, and a cart icon with a
// numeric badge. Badge count is the sum of local cart quantities after
// successful POST /carts/add — DummyJSON has no session GET-cart.

import { BagIcon, CartIcon } from './icons';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import type { AppView } from '../types/navigation';
import './Header.css';

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

export default function Header({ activeView, onNavigate }: HeaderProps) {
  const { session, clearSession } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-brand">
          <BagIcon className="app-header-brand-icon" />
          <span className="app-header-brand-name">MyShop</span>
        </div>

        <nav className="app-header-nav" aria-label="Primary">
          <button
            type="button"
            className="app-header-nav-link"
            aria-current={activeView === 'products' ? 'page' : undefined}
            onClick={() => onNavigate('products')}
          >
            Products
          </button>
        </nav>

        <div className="app-header-actions">
          <button
            type="button"
            className="app-header-cart"
            aria-current={activeView === 'cart' ? 'page' : undefined}
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
            onClick={() => onNavigate('cart')}
          >
            <CartIcon className="app-header-cart-icon" />
            <span className="app-header-cart-badge" aria-hidden="true">
              {itemCount}
            </span>
          </button>

          <button type="button" className="app-header-logout" onClick={clearSession}>
            Log out{session?.username ? ` (${session.username})` : ''}
          </button>
        </div>
      </div>
    </header>
  );
}
