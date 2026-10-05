import { useEffect } from 'react'
import { navigate, usePathname } from './app/navigation'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { CartProvider } from './cart/CartContext'
import { AppShell } from './layout/AppShell'
import { CartPage } from './pages/CartPage'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'

function isAuthenticatedPath(pathname: string): boolean {
  return pathname === '/products' || pathname === '/cart'
}

function AppRoutes() {
  const pathname = usePathname()
  const { session } = useAuth()

  useEffect(() => {
    if (!session && pathname !== '/') {
      navigate('/', { replace: true })
      return
    }

    if (session && !isAuthenticatedPath(pathname)) {
      navigate('/products', { replace: true })
    }
  }, [pathname, session])

  if (!session) {
    return <LoginPage />
  }

  return (
    <AppShell>
      {pathname === '/cart' ? <CartPage /> : <ProductsPage />}
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
