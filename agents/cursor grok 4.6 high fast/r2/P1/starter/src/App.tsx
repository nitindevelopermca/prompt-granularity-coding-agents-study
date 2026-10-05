import { useEffect } from 'react'
import { AuthProvider, useAuth } from './auth'
import { CartProvider } from './cart'
import { Header } from './components/Header'
import { CartPage } from './pages/CartPage'
import { LoginPage } from './pages/LoginPage'
import { ProductsPage } from './pages/ProductsPage'
import { navigate, pageTitle, useRoute } from './router'

function AuthenticatedApp() {
  const route = useRoute()
  const current = route === 'login' ? 'products' : route

  useEffect(() => {
    if (route === 'login') {
      navigate('products')
    }
  }, [route])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header current={current} />
      <main className="app-main" id="main-content">
        {current === 'cart' ? <CartPage /> : <ProductsPage />}
      </main>
    </div>
  )
}

function ShopRoot() {
  const { session } = useAuth()
  const route = useRoute()

  useEffect(() => {
    document.title = pageTitle(route, Boolean(session))
  }, [route, session])

  useEffect(() => {
    if (!session && route !== 'login') {
      navigate('login')
    }
  }, [session, route])

  if (!session) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ShopRoot />
      </CartProvider>
    </AuthProvider>
  )
}
