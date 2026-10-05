import { isRecord } from '../auth/session'

export const PRODUCTS_URL = 'https://dummyjson.com/products'
export const PRODUCT_PAGE_SIZE = 10

export type ProductReview = {
  reviewerName: string
  rating: number
  comment: string
  date: string
}

export type CatalogProduct = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand: string | undefined
  thumbnail: string
  images: string[]
  reviews: ProductReview[]
}

export type ProductsPage = {
  products: CatalogProduct[]
  total: number
  skip: number
  limit: number
}

export class ProductsRequestError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ProductsRequestError'
    this.status = status
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function parseReview(value: unknown): ProductReview | null {
  if (!isRecord(value) || typeof value.comment !== 'string') {
    return null
  }

  return {
    reviewerName: typeof value.reviewerName === 'string' ? value.reviewerName : 'Anonymous',
    rating: typeof value.rating === 'number' ? value.rating : 0,
    comment: value.comment,
    date: typeof value.date === 'string' ? value.date : '',
  }
}

function parseProduct(value: unknown): CatalogProduct | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.title !== 'string') {
    return null
  }

  return {
    id: value.id,
    title: value.title,
    description: typeof value.description === 'string' ? value.description : '',
    price: typeof value.price === 'number' ? value.price : 0,
    discountPercentage:
      typeof value.discountPercentage === 'number' ? value.discountPercentage : 0,
    rating: typeof value.rating === 'number' ? value.rating : 0,
    brand: typeof value.brand === 'string' ? value.brand : undefined,
    thumbnail: typeof value.thumbnail === 'string' ? value.thumbnail : '',
    images: asStringArray(value.images),
    reviews: Array.isArray(value.reviews)
      ? value.reviews
          .map(parseReview)
          .filter((review): review is ProductReview => review !== null)
      : [],
  }
}

function parseProductsPayload(payload: unknown, fallbackSkip: number): ProductsPage {
  if (!isRecord(payload) || !Array.isArray(payload.products)) {
    throw new ProductsRequestError('Unexpected response from the server.')
  }

  const products = payload.products
    .map(parseProduct)
    .filter((product): product is CatalogProduct => product !== null)

  return {
    products,
    total: typeof payload.total === 'number' ? payload.total : products.length,
    skip: typeof payload.skip === 'number' ? payload.skip : fallbackSkip,
    limit: typeof payload.limit === 'number' ? payload.limit : PRODUCT_PAGE_SIZE,
  }
}

async function fetchProductList(
  url: string,
  fallbackSkip: number,
  failureMessage: string,
  signal?: AbortSignal,
): Promise<ProductsPage> {
  let response: Response

  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ProductsRequestError(
      'A network error occurred. Please check your connection and try again.',
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ProductsRequestError(
      response.ok ? 'Unexpected response from the server.' : failureMessage,
      response.status,
    )
  }

  if (!response.ok) {
    throw new ProductsRequestError(failureMessage, response.status)
  }

  return parseProductsPayload(payload, fallbackSkip)
}

export async function fetchProductsPage(
  skip: number,
  signal?: AbortSignal,
): Promise<ProductsPage> {
  const url = `${PRODUCTS_URL}?limit=${PRODUCT_PAGE_SIZE}&skip=${skip}`
  return fetchProductList(url, skip, 'Unable to load products. Please try again.', signal)
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal,
): Promise<ProductsPage> {
  const trimmed = query.trim()
  const url = `${PRODUCTS_URL}/search?q=${encodeURIComponent(trimmed)}`
  return fetchProductList(url, 0, 'Unable to search products. Please try again.', signal)
}
