import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RouterProvider, useRouter } from './router/Router';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';

function RouteView() {
  const { path, navigate } = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (path !== '/login') navigate('/login');
      return;
    }
    if (path === '/login' || path === '/' || path === '') {
      navigate('/products');
    }
  }, [user, path, navigate]);

  if (!user) {
    return <LoginPage />;
  }

  if (path === '/cart') {
    return (
      <AppShell
        title="Your Cart | MyShop"
        description="Review the items in your MyShop cart, adjust quantities, and place your order."
      >
        <CartPage />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Products | MyShop"
      description="Browse MyShop's product catalog, search for items, read reviews, and add products to your cart."
    >
      <ProductsPage />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider>
          <RouteView />
        </RouterProvider>
      </CartProvider>
    </AuthProvider>
  );
}
