import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import type { AppPage } from './components/Header'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'

function AuthenticatedApp() {
  const [page, setPage] = useState<AppPage>('products')

  return (
    <CartProvider>
      <div className="app-shell">
        <Header currentPage={page} onNavigate={setPage} />
        <main id="main-content">
          {page === 'products' ? (
            <ProductsPage />
          ) : (
            <CartPage onContinueShopping={() => setPage('products')} />
          )}
        </main>
      </div>
    </CartProvider>
  )
}

function AppContent() {
  const { user } = useAuth()
  return user ? <AuthenticatedApp /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
