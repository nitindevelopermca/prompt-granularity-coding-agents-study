// Add-to-cart API client.
// Contract: spec/apis_contract/03_Add_To_Cart_API_Contract.docx, spec/SPEC_FREEZE.md
//   POST https://dummyjson.com/carts/add
//   Body: { userId, products: [{ id, quantity }] }
// There is no GET-cart session endpoint — quantity/remove/totals are kept
// locally after a successful add.

import { API_BASE_URL } from './config';

export const CART_ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  api: 'Failed to add item to cart. Please try again.',
  unexpected: 'Unexpected response from server. Please try again.',
} as const;

export class CartError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CartError';
    this.status = status;
  }
}

export interface AddToCartResponseItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage: number;
  discountedPrice: number;
  thumbnail: string;
}

export interface AddToCartResponse {
  id: number;
  products: AddToCartResponseItem[];
  total: number;
  discountedTotal: number;
  userId: number;
  totalProducts: number;
  totalQuantity: number;
}

export async function addToCartRequest(
  userId: number,
  productId: number,
  quantity: number,
): Promise<AddToCartResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, products: [{ id: productId, quantity }] }),
    });
  } catch {
    throw new CartError(CART_ERROR_MESSAGES.network);
  }

  if (!response.ok) {
    throw new CartError(CART_ERROR_MESSAGES.api, response.status);
  }

  try {
    return (await response.json()) as AddToCartResponse;
  } catch {
    throw new CartError(CART_ERROR_MESSAGES.unexpected);
  }
}
