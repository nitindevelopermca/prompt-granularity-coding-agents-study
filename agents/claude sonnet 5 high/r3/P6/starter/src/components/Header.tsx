// Shared authenticated header: MyShop mark, text nav, and cart icon with a
// numeric badge. Home / Categories / About Us are inert per
// spec/SPEC_FREEZE.md ("Categories / About Us as real pages" is out of scope).

import type { MouseEvent } from 'react';
import { useRouter } from '../router/Router';
import { useCart } from '../context/CartContext';
import { BagIcon, CartIcon } from './Icons';

export default function Header() {
  const { path, navigate } = useRouter();
  const { itemCount } = useCart();

  const goToProducts = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/products');
  };

  const goToCart = () => {
    navigate('/cart');
  };

  const inert = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a href="/products" className="app-header__brand" onClick={goToProducts}>
          <BagIcon aria-hidden="true" />
          <span>MyShop</span>
        </a>

        <nav className="app-header__nav" aria-label="Primary">
          <a href="/" onClick={inert}>
            Home
          </a>
          <a
            href="/products"
            onClick={goToProducts}
            aria-current={path === '/products' ? 'page' : undefined}
            className={path === '/products' ? 'is-active' : undefined}
          >
            Products
          </a>
          <a href="/" onClick={inert}>
            Categories
          </a>
          <a href="/" onClick={inert}>
            About Us
          </a>
        </nav>

        <button
          type="button"
          className="app-header__cart"
          onClick={goToCart}
          aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
        >
          <CartIcon aria-hidden="true" />
          <span className="app-header__cart-badge" aria-hidden="true">
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}
