import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { BagIcon, CartIcon } from './icons'
import styles from './Header.module.css'

export type View = 'products' | 'cart'

interface HeaderProps {
  view: View
  onNavigate: (view: View) => void
}

export default function Header({ view, onNavigate }: HeaderProps) {
  const { logout } = useAuth()
  const { count } = useCart()

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => onNavigate('products')}
          aria-label="MyShop, go to products"
        >
          <span className={styles.brandIcon}>
            <BagIcon width={18} height={18} />
          </span>
          <span className={styles.brandName}>MyShop</span>
        </button>

        <nav className={styles.nav} aria-label="Primary">
          <button
            type="button"
            className={`${styles.navLink} ${view === 'products' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate('products')}
            aria-current={view === 'products' ? 'page' : undefined}
          >
            Products
          </button>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.cartButton} ${view === 'cart' ? styles.cartButtonActive : ''}`}
            onClick={() => onNavigate('cart')}
            aria-current={view === 'cart' ? 'page' : undefined}
            aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <CartIcon />
            <span aria-hidden="true" className={styles.badge}>
              {count}
            </span>
          </button>
          <button type="button" className={styles.logout} onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
