import type { LoginResponse, ProductsResponse } from './types'

const BASE_URL = 'https://dummyjson.com'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 60 }),
    })
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.')
  }

  if (!response.ok) {
    const data = (await parseJsonSafely(response)) as { message?: string } | null
    throw new ApiError(data?.message ?? 'Invalid credentials', response.status)
  }

  return (await response.json()) as LoginResponse
}

export async function fetchProducts(limit: number, skip: number): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`)
  } catch {
    throw new ApiError('Network error while loading products.')
  }
  if (!response.ok) {
    throw new ApiError('Failed to load products.', response.status)
  }
  return (await response.json()) as ProductsResponse
}

export async function searchProducts(query: string): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new ApiError('Network error while searching products.')
  }
  if (!response.ok) {
    throw new ApiError('Search failed.', response.status)
  }
  return (await response.json()) as ProductsResponse
}

export async function addComment(body: string, postId: number, userId: number): Promise<{ id: number }> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    })
  } catch {
    throw new ApiError('Network error while posting comment.')
  }
  if (!response.ok) {
    throw new ApiError('Failed to post comment.', response.status)
  }
  return (await response.json()) as { id: number }
}

export async function addToCart(userId: number, productId: number, quantity: number): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, products: [{ id: productId, quantity }] }),
    })
  } catch {
    throw new ApiError('Network error while adding to cart.')
  }
  if (!response.ok) {
    throw new ApiError('Failed to add item to cart.', response.status)
  }
  return await response.json()
}
