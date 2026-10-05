import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { CartProvider } from './cart/CartContext'
import { AppHeader } from './components/AppHeader'
import { ROUTES, navigate, replaceLocation } from './navigation'
import { CartPage } from './pages/CartPage'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return pathname
}

function AuthenticatedShell() {
  const pathname = usePathname()
  const isCart = pathname === ROUTES.cart

  useEffect(() => {
    if (pathname !== ROUTES.cart && pathname !== ROUTES.products) {
      replaceLocation(ROUTES.products)
    }
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader current={isCart ? 'cart' : 'products'} />
      <main id="main-content" className="app-main">
        {isCart ? <CartPage /> : <ProductsPage />}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { session } = useAuth()
  const pathname = usePathname()

  if (!session) {
    return (
      <LoginPage
        onSuccess={() => {
          navigate(pathname === ROUTES.cart ? ROUTES.cart : ROUTES.products)
        }}
      />
    )
  }

  return <AuthenticatedShell />
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
