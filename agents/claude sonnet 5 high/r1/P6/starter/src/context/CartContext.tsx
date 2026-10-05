// Frontend cart state, backed by POST /carts/add (spec/SPEC_FREEZE.md —
// there is no GET-cart session endpoint, so quantity/remove/totals are
// tracked locally after each successful add). The header badge and the
// Cart screen (spec/ux/ux-design-of-cart.png) both derive from this state.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { addToCartRequest } from '../api/cart';
import { useAuth } from './AuthContext';
import type { Product } from '../types/product';

export interface CartItem {
  id: number;
  title: string;
  thumbnail: string;
  /** Per-unit price already reflecting the product's discount, if any. */
  unitPrice: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function unitPriceFor(product: Product): number {
  return product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      // Cart add does not require an Authorization header per the freeze;
      // userId is still required in the body.
      await addToCartRequest(user?.id ?? 0, product.id, quantity);

      // Only mutate local cart state after a successful response, so an
      // API failure leaves the existing valid cart state untouched.
      setItems((previous) => {
        const existing = previous.find((item) => item.id === product.id);
        if (existing) {
          return previous.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
          );
        }
        return [
          ...previous,
          {
            id: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            unitPrice: unitPriceFor(product),
            quantity,
          },
        ];
      });
    },
    [user],
  );

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((previous) =>
      quantity <= 0
        ? previous.filter((item) => item.id !== productId)
        : previous.map((item) => (item.id === productId ? { ...item, quantity } : item)),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((previous) => previous.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, addToCart, updateQuantity, removeItem, clearCart }),
    [items, itemCount, addToCart, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
