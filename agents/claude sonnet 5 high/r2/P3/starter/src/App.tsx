import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { RouterContext, routeFromPath, type AppRoute } from './router'
import { Header } from './components/Header'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'
import { CartPage } from './pages/CartPage'

function useBrowserRouter() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    function handlePopState() {
      setRoute(routeFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(to: AppRoute, options?: { replace?: boolean }) {
    if (window.location.pathname !== to) {
      if (options?.replace) {
        window.history.replaceState({}, '', to)
      } else {
        window.history.pushState({}, '', to)
      }
    }
    setRoute(to)
  }

  return { route, navigate }
}

function AuthenticatedApp({ route, navigate }: { route: AppRoute; navigate: (to: AppRoute, options?: { replace?: boolean }) => void }) {
  // Authenticated users should never sit on the login route.
  useEffect(() => {
    if (route === '/login') {
      navigate('/products', { replace: true })
    }
    // navigate is intentionally omitted: it is re-created every render but is
    // stable in behavior, and including it would not change when this runs.
  }, [route])

  return (
    <div className="app-shell">
      <Header />
      {route === '/cart' ? <CartPage /> : <ProductsPage />}
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const { route, navigate } = useBrowserRouter()

  // Unauthenticated visitors only ever see the login screen, regardless of URL.
  useEffect(() => {
    if (!isAuthenticated && route !== '/login') {
      navigate('/login', { replace: true })
    }
    // navigate is intentionally omitted: see AuthenticatedApp for rationale.
  }, [isAuthenticated, route])

  if (!isAuthenticated) {
    return (
      <RouterContext.Provider value={{ route: '/login', navigate }}>
        <LoginPage />
      </RouterContext.Provider>
    )
  }

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      <CartProvider>
        <AuthenticatedApp route={route} navigate={navigate} />
      </CartProvider>
    </RouterContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
