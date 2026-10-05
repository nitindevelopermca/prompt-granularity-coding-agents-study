import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import type { AppView } from './types/navigation';

/** Minimum authenticated app shell: shared header + Products/Cart destinations. */
function AuthenticatedShell() {
  const [view, setView] = useState<AppView>('products');

  return (
    <CartProvider>
      <Header activeView={view} onNavigate={setView} />
      {view === 'products' ? <ProductsPage /> : <CartPage onContinueShopping={() => setView('products')} />}
    </CartProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedShell /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
