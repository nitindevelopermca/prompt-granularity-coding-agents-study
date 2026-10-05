import { useCallback, useEffect } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { CartProvider, useCart } from './cart/CartContext'
import { AppShell } from './components/AppShell'
import { CART_PATH, LOGIN_PATH, PRODUCTS_PATH, usePathname } from './navigation'
import { CartPage } from './pages/CartPage'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'

const AUTHENTICATED_PATHS = new Set([PRODUCTS_PATH, CART_PATH])

function AppRoutes() {
  const { session } = useAuth()
  const { itemCount } = useCart()
  const { pathname, navigate } = usePathname()

  const goToProducts = useCallback(() => {
    navigate(PRODUCTS_PATH)
  }, [navigate])

  useEffect(() => {
    if (!session) {
      if (pathname !== LOGIN_PATH) {
        navigate(LOGIN_PATH)
      }
      return
    }

    if (!AUTHENTICATED_PATHS.has(pathname)) {
      navigate(PRODUCTS_PATH)
    }
  }, [session, pathname, navigate])

  if (!session) {
    return <LoginPage onSuccess={goToProducts} />
  }

  return (
    <AppShell pathname={pathname} cartCount={itemCount} onNavigate={navigate}>
      {pathname === CART_PATH ? <CartPage /> : <ProductsPage />}
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}
