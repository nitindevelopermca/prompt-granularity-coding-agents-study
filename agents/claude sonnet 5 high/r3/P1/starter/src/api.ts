// DummyJSON API access layer.
// Only the URLs listed in spec/SPEC_FREEZE.md and spec/apis_contract/ are used.

import type {
  AddCommentResponse,
  AddToCartResponse,
  LoginResponse,
  ProductsResponse,
} from './types.ts'

const BASE_URL = 'https://dummyjson.com'

/** Error raised for both HTTP-level failures and network failures. */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ErrorPayload {
  message?: string
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as ErrorPayload
    return data.message ?? fallback
  } catch {
    return fallback
  }
}

export async function loginRequest(username: string, password: string): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 30 }),
    })
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Invalid credentials')
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as LoginResponse
}

export async function fetchProducts(limit: number, skip: number): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`)
  } catch {
    throw new ApiError('Network error while loading products. Please try again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to load products.')
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as ProductsResponse
}

export async function searchProductsRequest(query: string): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new ApiError('Network error while searching products. Please try again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Search failed. Please try again.')
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as ProductsResponse
}

export async function addCommentRequest(
  body: string,
  postId: number,
  userId: number,
): Promise<AddCommentResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    })
  } catch {
    throw new ApiError('Network error while posting your comment. Please try again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to post comment. Please try again.')
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as AddCommentResponse
}

export async function addToCartRequest(
  userId: number,
  productId: number,
  quantity: number,
): Promise<AddToCartResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, products: [{ id: productId, quantity }] }),
    })
  } catch {
    throw new ApiError('Network error while adding to cart. Please try again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Failed to add item to cart. Please try again.')
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as AddToCartResponse
}
