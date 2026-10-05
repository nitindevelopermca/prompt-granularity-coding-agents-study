// Shared authenticated header: brand mark, primary nav (Products, Cart with
// a numeric badge), and log out. Rendered once by AppLayout so it appears
// above every authenticated destination.

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BagIcon, CartIcon } from './icons';
import styles from './AppHeader.module.css';

function navLinkClassName(isActive: boolean): string {
  return isActive ? `${styles.link} ${styles.linkActive}` : styles.link;
}

function cartLinkClassName(isActive: boolean): string {
  return isActive ? `${styles.cartLink} ${styles.linkActive}` : styles.cartLink;
}

export default function AppHeader() {
  const { logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className={styles.header}>
      <NavLink to="/products" className={styles.brand}>
        <BagIcon width={24} height={24} />
        <span className={styles.brandText}>MyShop</span>
      </NavLink>

      <nav className={styles.nav} aria-label="Main">
        <NavLink to="/products" className={({ isActive }) => navLinkClassName(isActive)}>
          Products
        </NavLink>
        <NavLink
          to="/cart"
          className={({ isActive }) => cartLinkClassName(isActive)}
          aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
        >
          <CartIcon />
          <span className={styles.badge} aria-hidden="true">
            {itemCount}
          </span>
        </NavLink>
      </nav>

      <button type="button" className={styles.logout} onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}
