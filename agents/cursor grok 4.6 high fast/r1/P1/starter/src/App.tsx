import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth'
import { CartPage } from './CartPage'
import { CartProvider } from './cart'
import { Header } from './Header'
import { LoginPage } from './LoginPage'
import { ProductsPage } from './ProductsPage'
import { ShellInertProvider } from './shell'
import type { Route } from './types'

function readRoute(): Route {
  return window.location.hash === '#/cart' ? 'cart' : 'products'
}

function ShopApp() {
  const { session } = useAuth()
  const [route, setRoute] = useState<Route>(readRoute)
  const [shellInert, setShellInert] = useState(false)

  useEffect(() => {
    function onHashChange() {
      setRoute(readRoute())
    }
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      window.location.hash = '/products'
    }
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!session) {
      document.title = 'MyShop — Sign in'
      return
    }
    document.title = route === 'cart' ? 'MyShop — Your Cart' : 'MyShop — All Products'
  }, [session, route])

  function navigate(next: Route) {
    window.location.hash = next === 'cart' ? '/cart' : '/products'
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <ShellInertProvider value={setShellInert}>
      <div className="app">
        <div inert={shellInert || undefined}>
          <Header route={route} onNavigate={navigate} />
          <main id="main">
            <div hidden={route !== 'products'}>
              <ProductsPage />
            </div>
            {route === 'cart' ? <CartPage onContinueShopping={() => navigate('products')} /> : null}
          </main>
        </div>
      </div>
    </ShellInertProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ShopApp />
      </CartProvider>
    </AuthProvider>
  )
}
