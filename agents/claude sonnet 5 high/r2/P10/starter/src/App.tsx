import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import LoginPage from './pages/Login'
import ProductsPage from './pages/Products'
import CartPage from './pages/Cart'

export type View = 'products' | 'cart'

function AuthenticatedApp() {
  const [view, setView] = useState<View>('products')

  return (
    <div className="app-shell">
      <Header currentView={view} onNavigate={setView} />
      {view === 'products' ? (
        <ProductsPage />
      ) : (
        <CartPage onContinueShopping={() => setView('products')} />
      )}
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()

  if (!user) {
    return <LoginPage onSuccess={() => undefined} />
  }

  return <AuthenticatedApp />
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}
