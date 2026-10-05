import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { RouterProvider, useRouter } from './context/RouterContext'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const { route, navigate } = useRouter()

  useEffect(() => {
    if (!isAuthenticated && route !== '/login') {
      navigate('/login')
    }
    if (isAuthenticated && route === '/login') {
      navigate('/products')
    }
  }, [isAuthenticated, route, navigate])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  switch (route) {
    case '/cart':
      return <CartPage />
    case '/products':
    default:
      return <ProductsPage />
  }
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider>
          <AppRoutes />
        </RouterProvider>
      </CartProvider>
    </AuthProvider>
  )
}
