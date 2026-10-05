import type { Product } from '../types'

const BASE_URL = 'https://dummyjson.com'

/** Error raised by any DummyJSON call. `status` is undefined for network failures. */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface LoginResponse {
  id: number
  username: string
  email?: string
  accessToken: string
  refreshToken?: string
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

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : undefined) ?? 'Invalid credentials'
    throw new ApiError(message, response.status)
  }

  return data as LoginResponse
}

export interface ProductsPage {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export async function fetchProducts(limit: number, skip: number): Promise<ProductsPage> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`)
  } catch {
    throw new ApiError('Network error while loading products. Please try again.')
  }
  if (!response.ok) {
    throw new ApiError('Unable to load products right now. Please try again.', response.status)
  }
  return (await response.json()) as ProductsPage
}

export interface SearchResults {
  products: Product[]
  total: number
}

export async function searchProducts(query: string): Promise<SearchResults> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new ApiError('Network error while searching. Please try again.')
  }
  if (!response.ok) {
    throw new ApiError('Search failed. Please try again.', response.status)
  }
  return (await response.json()) as SearchResults
}

export interface AddCommentPayload {
  body: string
  postId: number
  userId: number
}

export interface AddCommentResponse {
  id: number
  body: string
  postId: number
}

export async function addComment(payload: AddCommentPayload): Promise<AddCommentResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError('Network error while adding your comment. Please try again.')
  }
  if (!response.ok) {
    throw new ApiError('Could not add your comment. Please try again.', response.status)
  }
  return (await response.json()) as AddCommentResponse
}

export interface AddToCartPayload {
  userId: number
  products: { id: number; quantity: number }[]
}

export async function addToCartRequest(payload: AddToCartPayload): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError('Network error while adding to cart. Please try again.')
  }
  if (!response.ok) {
    throw new ApiError('Could not add item to cart. Please try again.', response.status)
  }
  return response.json()
}
