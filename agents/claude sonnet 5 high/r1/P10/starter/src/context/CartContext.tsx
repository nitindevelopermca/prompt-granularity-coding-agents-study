import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { addToCart as postAddToCart, CartError } from '../api/cartApi';
import { useAuth } from './useAuth';
import type { CartLine } from '../types/cart';
import type { Product } from '../types/product';

interface CartContextValue {
  lines: CartLine[];
  /** Total quantity shown on the header cart badge. May be 0. */
  itemCount: number;
  /**
   * POSTs to DummyJSON carts/add, then updates local cart state on success.
   * On failure, existing lines are left unchanged and the error is rethrown.
   */
  addProduct: (product: Product, quantity?: number) => Promise<void>;
  /** Local quantity change after add. Quantity is clamped to at least 1. */
  setLineQuantity: (productId: number, quantity: number) => void;
  removeLine: (productId: number) => void;
  /** Clears the local cart after a successful in-app Place Order. */
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

const GENERIC_CART_ERROR = 'Unable to add this item to your cart right now. Please try again.';

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);

  const addProduct = useCallback(
    async (product: Product, quantity = 1) => {
      if (!session) {
        throw new CartError('You must be logged in to add items to your cart.', 'unknown');
      }

      try {
        await postAddToCart({
          userId: session.id,
          products: [{ id: product.id, quantity }],
        });
      } catch (error) {
        // Keep existing valid cart state — do not mutate lines on failure.
        if (error instanceof CartError) throw error;
        throw new CartError(GENERIC_CART_ERROR, 'unknown');
      }

      setLines((prev) => {
        const existing = prev.find((line) => line.id === product.id);
        if (existing) {
          return prev.map((line) =>
            line.id === product.id ? { ...line, quantity: line.quantity + quantity } : line,
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            quantity,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
          },
        ];
      });
    },
    [session],
  );

  const setLineQuantity = useCallback((productId: number, quantity: number) => {
    const nextQuantity = Math.max(1, Math.floor(quantity));
    setLines((prev) =>
      prev.map((line) => (line.id === productId ? { ...line, quantity: nextQuantity } : line)),
    );
  }, []);

  const removeLine = useCallback((productId: number) => {
    setLines((prev) => prev.filter((line) => line.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount,
      addProduct,
      setLineQuantity,
      removeLine,
      clearCart,
    }),
    [lines, itemCount, addProduct, setLineQuantity, removeLine, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
