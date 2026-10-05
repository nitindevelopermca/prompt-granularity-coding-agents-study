import { useEffect, useState } from 'react'
import { AppHeader } from './AppHeader'
import { CartPage } from './CartPage'
import { CartProvider } from './cart'
import { LoginPage } from './LoginPage'
import { currentPath, navigate, pathTitle } from './navigation'
import { ProductsPage } from './ProductsPage'
import { AuthProvider, useAuth } from './session'
import type { AppPath } from './types'

function useAppPath(): AppPath {
  const [path, setPath] = useState<AppPath>(currentPath)

  useEffect(() => {
    function onPopState() {
      setPath(currentPath())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return path
}

function AuthenticatedApp() {
  const path = useAppPath()
  const route: AppPath = path === '/cart' ? '/cart' : '/products'

  useEffect(() => {
    if (path !== '/products' && path !== '/cart') {
      navigate('/products', true)
    }
  }, [path])

  useEffect(() => {
    document.title = pathTitle(route, true)
  }, [route])

  return (
    <CartProvider>
      <div className="app-shell">
        <AppHeader currentPath={route} />
        {route === '/cart' ? <CartPage /> : <ProductsPage />}
      </div>
    </CartProvider>
  )
}

function AppRoutes() {
  const { session } = useAuth()
  const path = useAppPath()

  useEffect(() => {
    if (!session && path !== '/login') {
      navigate('/login', true)
    }
  }, [session, path])

  useEffect(() => {
    if (!session) {
      document.title = pathTitle('/login', false)
    }
  }, [session])

  if (!session) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
