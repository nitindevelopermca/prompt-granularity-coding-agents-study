import type { CatalogProduct, ProductReview, ProductsPage } from './types'

export const PRODUCTS_PAGE_SIZE = 10

const PRODUCTS_URL = 'https://dummyjson.com/products'

export class ProductsRequestError extends Error {
  constructor(message = 'Unable to load products. Please try again.') {
    super(message)
    this.name = 'ProductsRequestError'
  }
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function parseImages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function parseReview(value: unknown): ProductReview | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const reviewerName = asString(record.reviewerName) ?? 'Anonymous'
  const rating = asNumber(record.rating) ?? 0
  const comment = asString(record.comment) ?? ''
  const date = asString(record.date) ?? ''

  return { reviewerName, rating, comment, date }
}

function parseReviews(value: unknown): ProductReview[] {
  if (!Array.isArray(value)) {
    return []
  }

  const reviews: ProductReview[] = []
  for (const item of value) {
    const review = parseReview(item)
    if (review) {
      reviews.push(review)
    }
  }
  return reviews
}

function parseProduct(value: unknown): CatalogProduct | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const id = asNumber(record.id)
  const title = asString(record.title)
  const price = asNumber(record.price)

  if (id === null || title === null || price === null) {
    return null
  }

  const images = parseImages(record.images)
  const thumbnail = asString(record.thumbnail) ?? images[0] ?? ''

  return {
    id,
    title,
    description: asString(record.description) ?? '',
    price,
    discountPercentage: asNumber(record.discountPercentage) ?? 0,
    rating: asNumber(record.rating) ?? 0,
    brand: asString(record.brand),
    thumbnail,
    images,
    reviews: parseReviews(record.reviews),
  }
}

function parsePage(value: unknown, requestedSkip: number): ProductsPage {
  if (typeof value !== 'object' || value === null) {
    throw new ProductsRequestError()
  }

  const record = value as Record<string, unknown>
  const total = asNumber(record.total) ?? 0
  const skip = asNumber(record.skip) ?? requestedSkip
  const rawProducts = Array.isArray(record.products) ? record.products : []
  const products = rawProducts
    .map(parseProduct)
    .filter((product): product is CatalogProduct => product !== null)

  return { products, total, skip }
}

export function hasMoreProducts(skip: number, loadedCount: number, total: number): boolean {
  return loadedCount > 0 && skip + loadedCount < total
}

export async function fetchProductsPage(skip: number): Promise<ProductsPage> {
  let response: Response

  try {
    response = await fetch(`${PRODUCTS_URL}?limit=${PRODUCTS_PAGE_SIZE}&skip=${skip}`)
  } catch {
    throw new ProductsRequestError('Unable to reach the server. Check your connection and try again.')
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    throw new ProductsRequestError()
  }

  return parsePage(body, skip)
}

export async function searchProducts(query: string): Promise<ProductsPage> {
  let response: Response

  try {
    response = await fetch(`${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new ProductsRequestError('Unable to reach the server. Check your connection and try again.')
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    throw new ProductsRequestError('Unable to search products. Please try again.')
  }

  return parsePage(body, 0)
}
