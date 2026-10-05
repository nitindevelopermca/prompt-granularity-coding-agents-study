import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { CartProvider } from './cart/CartContext'
import AppShell from './layout/AppShell'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import ProductsPlaceholder from './pages/ProductsPlaceholder'

const PRODUCTS_PATH = '/products'
const CART_PATH = '/cart'

function AppRoutes() {
  const { session } = useAuth()
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!session) {
      if (path !== '/') {
        window.history.replaceState(null, '', '/')
        setPath('/')
      }
      return
    }

    if (path !== PRODUCTS_PATH && path !== CART_PATH) {
      window.history.replaceState(null, '', PRODUCTS_PATH)
      setPath(PRODUCTS_PATH)
    }
  }, [session, path])

  function navigate(to: string) {
    if (window.location.pathname !== to) {
      window.history.pushState(null, '', to)
    }
    setPath(to)
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <AppShell path={path} navigate={navigate}>
      {path === CART_PATH ? <CartPage navigate={navigate} /> : <ProductsPlaceholder />}
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
