import type { LoginResponse, ProductsResponse } from './types'

const BASE = 'https://dummyjson.com'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string' &&
      data.message.trim()
    ) {
      return data.message
    }
  } catch {
    // Use fallback when the body is not JSON.
  }
  return fallback
}

async function parseJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response, fallback), response.status)
  }
  return (await response.json()) as T
}

export async function loginRequest(
  username: string,
  password: string,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  const response = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, expiresInMins: 30 }),
    signal,
  })
  return parseJson<LoginResponse>(response, 'Unable to sign in')
}

export async function fetchProducts(
  skip: number,
  limit = 10,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const response = await fetch(`${BASE}/products?limit=${limit}&skip=${skip}`, { signal })
  return parseJson<ProductsResponse>(response, 'Unable to load products')
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const response = await fetch(`${BASE}/products/search?q=${encodeURIComponent(query)}`, {
    signal,
  })
  return parseJson<ProductsResponse>(response, 'Unable to search products')
}

export async function addCommentRequest(
  body: string,
  postId: number,
  userId: number,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${BASE}/comments/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, postId, userId }),
    signal,
  })
  await parseJson<unknown>(response, 'Unable to add comment')
}

export async function addToCartRequest(
  userId: number,
  productId: number,
  quantity: number,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${BASE}/carts/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      products: [{ id: productId, quantity }],
    }),
    signal,
  })
  await parseJson<unknown>(response, 'Unable to add item to cart')
}
