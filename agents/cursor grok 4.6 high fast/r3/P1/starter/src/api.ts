import type { AuthUser, Product, ProductReview, ProductsResponse } from './types'

const API_BASE = 'https://dummyjson.com'

export class ApiError extends Error {
  readonly kind: 'network' | 'http'

  constructor(kind: 'network' | 'http', message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === 'string' && body.message.trim()) {
    return body.message
  }
  return fallback
}

async function request(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError('network', 'Unable to connect. Check your network and try again.')
  }

  const body = await readJson(response)
  if (!response.ok) {
    throw new ApiError('http', messageFromBody(body, `Request failed (${response.status}).`))
  }
  return body
}

function asReview(value: unknown): ProductReview | null {
  if (!isRecord(value)) return null
  return {
    rating: typeof value.rating === 'number' ? value.rating : 0,
    comment: typeof value.comment === 'string' ? value.comment : '',
    date: typeof value.date === 'string' ? value.date : '',
    reviewerName: typeof value.reviewerName === 'string' ? value.reviewerName : 'Anonymous',
  }
}

function asProduct(value: unknown): Product | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.title !== 'string') {
    return null
  }

  const images = Array.isArray(value.images)
    ? value.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
  const reviews = Array.isArray(value.reviews)
    ? value.reviews.map(asReview).filter((item): item is ProductReview => item !== null)
    : []

  return {
    id: value.id,
    title: value.title,
    description: typeof value.description === 'string' ? value.description : '',
    price: typeof value.price === 'number' ? value.price : 0,
    discountPercentage: typeof value.discountPercentage === 'number' ? value.discountPercentage : 0,
    rating: typeof value.rating === 'number' ? value.rating : 0,
    brand: typeof value.brand === 'string' && value.brand.trim() ? value.brand : undefined,
    thumbnail: typeof value.thumbnail === 'string' ? value.thumbnail : images[0] ?? '',
    images,
    reviews,
  }
}

function asProductsResponse(value: unknown): ProductsResponse {
  if (!isRecord(value)) {
    return { products: [], total: 0, skip: 0, limit: 0 }
  }

  const products = Array.isArray(value.products)
    ? value.products.map(asProduct).filter((item): item is Product => item !== null)
    : []

  return {
    products,
    total: typeof value.total === 'number' ? value.total : products.length,
    skip: typeof value.skip === 'number' ? value.skip : 0,
    limit: typeof value.limit === 'number' ? value.limit : products.length,
  }
}

export async function loginRequest(username: string, password: string): Promise<AuthUser> {
  const body = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, expiresInMins: 30 }),
  })

  if (!isRecord(body) || typeof body.id !== 'number' || typeof body.accessToken !== 'string') {
    throw new ApiError('http', 'Unexpected login response.')
  }

  return {
    id: body.id,
    accessToken: body.accessToken,
    refreshToken: typeof body.refreshToken === 'string' ? body.refreshToken : undefined,
    username: typeof body.username === 'string' ? body.username : undefined,
    firstName: typeof body.firstName === 'string' ? body.firstName : undefined,
  }
}

export async function fetchProductsPage(
  skip: number,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  return asProductsResponse(
    await request(`${API_BASE}/products?limit=10&skip=${skip}`, { signal }),
  )
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  return asProductsResponse(
    await request(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`, { signal }),
  )
}

export async function addCommentRequest(
  body: string,
  postId: number,
  userId: number,
): Promise<void> {
  await request(`${API_BASE}/comments/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, postId, userId }),
  })
}

export async function addToCartRequest(
  userId: number,
  productId: number,
  quantity: number,
): Promise<void> {
  await request(`${API_BASE}/carts/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      products: [{ id: productId, quantity }],
    }),
  })
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return ''
  }
  if (error instanceof ApiError) {
    return error.message
  }
  return fallback
}
