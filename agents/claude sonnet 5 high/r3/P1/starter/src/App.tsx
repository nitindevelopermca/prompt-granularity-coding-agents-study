import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { CartProvider, useCart } from './context/CartContext.tsx'
import { ProductsProvider } from './context/ProductsContext.tsx'
import { CartPage } from './components/CartPage.tsx'
import { Header } from './components/Header.tsx'
import type { AppView } from './components/Header.tsx'
import { LoginPage } from './components/LoginPage.tsx'
import { ProductsPage } from './components/ProductsPage.tsx'

function AuthenticatedApp() {
  const [view, setView] = useState<AppView>('products')
  const { totalQuantity } = useCart()

  return (
    <>
      <Header cartCount={totalQuantity} activeView={view} onNavigate={setView} />
      {view === 'products' ? <ProductsPage /> : <CartPage onContinueShopping={() => setView('products')} />}
    </>
  )
}

function AppShell() {
  const { user } = useAuth()

  if (!user) {
    return <LoginPage />
  }

  return (
    <CartProvider>
      <ProductsProvider>
        <AuthenticatedApp />
      </ProductsProvider>
    </CartProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
