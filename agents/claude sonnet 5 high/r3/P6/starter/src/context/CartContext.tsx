// Frontend cart state. DummyJSON has no session GET-cart endpoint, so
// quantity/remove/totals are maintained locally after a successful
// POST /carts/add, per spec/SPEC_FREEZE.md.

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { addToCart as addToCartRequest } from '../api/client';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '../api/types';

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = async (product: Product, quantity = 1) => {
    if (!user) {
      throw new Error('You must be logged in to add items to the cart.');
    }

    // Cart add does not require an Authorization header (bearer token optional).
    await addToCartRequest(user.id, [{ id: product.id, quantity }]);

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
