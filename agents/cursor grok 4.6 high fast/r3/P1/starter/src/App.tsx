import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth'
import { CartPage } from './CartPage'
import { CartProvider, useCart } from './cart'
import { Header } from './Header'
import { LoginPage } from './LoginPage'
import { ProductsPage } from './ProductsPage'
import type { AppView } from './types'

function AuthenticatedApp() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [view, setView] = useState<AppView>(user ? 'products' : 'login')

  useEffect(() => {
    document.title = view === 'cart' ? 'MyShop — Cart' : view === 'products' ? 'MyShop — Products' : 'MyShop — Sign in'
  }, [view])

  if (!user || view === 'login') {
    return <LoginPage onSuccess={() => setView('products')} />
  }

  return (
    <div className="app-shell">
      <Header cartCount={itemCount} currentView={view} onNavigate={setView} />
      {view === 'cart' ? (
        <CartPage onContinueShopping={() => setView('products')} />
      ) : (
        <ProductsPage />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AuthenticatedApp />
      </CartProvider>
    </AuthProvider>
  )
}
