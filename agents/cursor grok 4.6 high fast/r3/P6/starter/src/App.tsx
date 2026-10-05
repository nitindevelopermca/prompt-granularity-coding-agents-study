import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { CartProvider } from './cart/CartContext'
import { AppShell } from './components/AppShell'
import { CartPage } from './pages/CartPage'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'

function AppView() {
  const { session } = useAuth()
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    function onPopState() {
      setPath(window.location.pathname)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!session) {
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/')
        setPath('/')
      }
      return
    }

    if (path === '/products' || path === '/cart') {
      return
    }

    window.history.replaceState({}, '', '/products')
    setPath('/products')
  }, [session, path])

  function navigate(to: string) {
    if (window.location.pathname === to) return
    window.history.pushState({}, '', to)
    setPath(to)
  }

  if (!session) {
    return <LoginPage />
  }

  const route = path === '/cart' ? 'cart' : 'products'

  return (
    <AppShell route={route} navigate={navigate}>
      {route === 'cart' ? <CartPage navigate={navigate} /> : <ProductsPage />}
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppView />
      </CartProvider>
    </AuthProvider>
  )
}
