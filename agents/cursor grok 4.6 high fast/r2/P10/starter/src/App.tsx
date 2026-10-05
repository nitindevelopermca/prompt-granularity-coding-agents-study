import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { CartProvider } from './cart/CartContext'
import AppHeader, { type AuthedPath } from './components/AppHeader'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'

function resolveAuthedPath(pathname: string): AuthedPath {
  return pathname === '/cart' ? '/cart' : '/products'
}

function AuthenticatedApp() {
  const [path, setPath] = useState<AuthedPath>(() => resolveAuthedPath(window.location.pathname))

  useEffect(() => {
    const sync = () => {
      const next = resolveAuthedPath(window.location.pathname)
      if (window.location.pathname !== next) {
        window.history.replaceState(null, '', next)
      }
      setPath(next)
    }

    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader currentPath={path} />
      {path === '/cart' ? <CartPage /> : <ProductsPage />}
    </div>
  )
}

function Shell() {
  const { session } = useAuth()

  useEffect(() => {
    if (!session && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/')
    }
  }, [session])

  return session ? (
    <CartProvider>
      <AuthenticatedApp />
    </CartProvider>
  ) : (
    <LoginPage />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
