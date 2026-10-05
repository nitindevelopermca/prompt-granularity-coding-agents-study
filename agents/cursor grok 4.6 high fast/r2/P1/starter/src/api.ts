import type { Product, ProductsPage, Session } from './types'
import { PAGE_SIZE, networkErrorMessage, parseProductsPage, readApiError } from './utils'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const PRODUCTS_URL = 'https://dummyjson.com/products'
const SEARCH_URL = 'https://dummyjson.com/products/search'
const COMMENTS_URL = 'https://dummyjson.com/comments/add'
const CARTS_ADD_URL = 'https://dummyjson.com/carts/add'

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new Error(networkErrorMessage('Network error. Please check your connection and try again.'))
  }
}

export async function loginRequest(username: string, password: string): Promise<Session> {
  const response = await request(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      expiresInMins: 30,
    }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to sign in'))
  }

  const data: unknown = await response.json()
  if (
    typeof data !== 'object' ||
    data === null ||
    !('id' in data) ||
    !('accessToken' in data) ||
    typeof data.id !== 'number' ||
    typeof data.accessToken !== 'string'
  ) {
    throw new Error('Unexpected login response')
  }

  const record = data as {
    id: number
    accessToken: string
    username?: string
    firstName?: string
  }

  return {
    id: record.id,
    accessToken: record.accessToken,
    username: typeof record.username === 'string' ? record.username : username,
    firstName: typeof record.firstName === 'string' ? record.firstName : '',
  }
}

export async function fetchProducts(skip: number, signal?: AbortSignal): Promise<ProductsPage> {
  const response = await request(`${PRODUCTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`, { signal })
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to load products'))
  }
  return parseProductsPage(await response.json())
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const response = await request(`${SEARCH_URL}?q=${encodeURIComponent(query)}`, { signal })
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to search products'))
  }
  return parseProductsPage(await response.json()).products
}

export async function addCommentRequest(
  body: string,
  postId: number,
  userId: number,
): Promise<void> {
  const response = await request(COMMENTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, postId, userId }),
  })
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to add comment'))
  }
}

export async function addToCartRequest(
  userId: number,
  productId: number,
  quantity: number,
): Promise<void> {
  const response = await request(CARTS_ADD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      products: [{ id: productId, quantity }],
    }),
  })
  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to add item to cart'))
  }
}
