// Thin fetch wrappers around the DummyJSON endpoints listed in
// spec/SPEC_FREEZE.md and spec/apis_contract/. Only these exact URLs are used.

import type {
  AddCommentResponse,
  AddToCartResponse,
  LoginResponse,
  ProductsResponse,
} from './types';

const BASE_URL = 'https://dummyjson.com';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string') {
      return (data as { message: string }).message;
    }
  } catch {
    // Response body was not JSON; fall back to the default message.
  }
  return fallback;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 60 }),
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.');
  }

  if (!res.ok) {
    const message = await readErrorMessage(res, 'Invalid credentials');
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as LoginResponse;
}

export async function fetchProducts(limit: number, skip: number): Promise<ProductsResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`);
  } catch {
    throw new ApiError('Network error while loading products. Please check your connection.');
  }

  if (!res.ok) {
    const message = await readErrorMessage(res, 'Failed to load products.');
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as ProductsResponse;
}

export async function searchProducts(query: string): Promise<ProductsResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
  } catch {
    throw new ApiError('Network error while searching products. Please check your connection.');
  }

  if (!res.ok) {
    const message = await readErrorMessage(res, 'Search failed.');
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as ProductsResponse;
}

export async function addComment(
  body: string,
  postId: number,
  userId: number,
): Promise<AddCommentResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    });
  } catch {
    throw new ApiError('Network error while posting your comment. Please try again.');
  }

  if (!res.ok) {
    const message = await readErrorMessage(res, 'Failed to post comment.');
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as AddCommentResponse;
}

export async function addToCart(
  userId: number,
  products: Array<{ id: number; quantity: number }>,
): Promise<AddToCartResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, products }),
    });
  } catch {
    throw new ApiError('Network error while adding this item to your cart.');
  }

  if (!res.ok) {
    const message = await readErrorMessage(res, 'Failed to add item to cart.');
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as AddToCartResponse;
}
