import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header, { type View } from './components/Header'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'

function AuthenticatedShell() {
  const [view, setView] = useState<View>('products')

  return (
    <CartProvider>
      <Header view={view} onNavigate={setView} />
      <main id="main-content">
        {view === 'products' ? (
          <ProductsPage />
        ) : (
          <CartPage onContinueShopping={() => setView('products')} />
        )}
      </main>
    </CartProvider>
  )
}

function AppShell() {
  const { user } = useAuth()
  if (!user) {
    return <LoginPage />
  }
  return <AuthenticatedShell />
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
