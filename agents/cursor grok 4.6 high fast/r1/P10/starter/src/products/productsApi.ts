import type { CatalogProduct, ProductReview, ProductsPage } from './types'

export const PRODUCTS_PAGE_SIZE = 10
const PRODUCTS_URL = 'https://dummyjson.com/products'

export class ProductsRequestError extends Error {
  constructor(message = 'Unable to load products. Please try again.') {
    super(message)
    this.name = 'ProductsRequestError'
  }
}

function asImageUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asReview(value: unknown): ProductReview {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  return {
    reviewerName: typeof record.reviewerName === 'string' ? record.reviewerName : 'Anonymous',
    rating: typeof record.rating === 'number' ? record.rating : 0,
    comment: typeof record.comment === 'string' ? record.comment : '',
    date: typeof record.date === 'string' ? record.date : '',
  }
}

function asProduct(value: unknown): CatalogProduct | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  if (typeof record.id !== 'number' || typeof record.title !== 'string' || record.title.length === 0) {
    return null
  }

  const images = Array.isArray(record.images)
    ? record.images.map(asImageUrl).filter((item): item is string => item !== null)
    : []

  return {
    id: record.id,
    title: record.title,
    description: typeof record.description === 'string' ? record.description : '',
    price: typeof record.price === 'number' ? record.price : 0,
    discountPercentage: typeof record.discountPercentage === 'number' ? record.discountPercentage : 0,
    rating: typeof record.rating === 'number' ? record.rating : 0,
    brand: typeof record.brand === 'string' && record.brand.trim().length > 0 ? record.brand : null,
    thumbnail: asImageUrl(record.thumbnail),
    images,
    reviews: Array.isArray(record.reviews) ? record.reviews.map(asReview) : [],
  }
}

async function readProductsResponse(
  url: string,
  fallbackSkip: number,
  failureMessage = 'Unable to load products. Please try again.',
): Promise<ProductsPage> {
  let response: Response

  try {
    response = await fetch(url)
  } catch {
    throw new ProductsRequestError('Unable to reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new ProductsRequestError(failureMessage)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ProductsRequestError(failureMessage)
  }

  if (typeof body !== 'object' || body === null) {
    throw new ProductsRequestError(failureMessage)
  }

  const record = body as Record<string, unknown>
  const rawProducts = Array.isArray(record.products) ? record.products : []
  const products = rawProducts.map(asProduct).filter((item): item is CatalogProduct => item !== null)
  const total = typeof record.total === 'number' ? record.total : products.length
  const resolvedSkip = typeof record.skip === 'number' ? record.skip : fallbackSkip

  return { products, total, skip: resolvedSkip }
}

export async function fetchProductsPage(skip: number): Promise<ProductsPage> {
  return readProductsResponse(`${PRODUCTS_URL}?limit=${PRODUCTS_PAGE_SIZE}&skip=${skip}`, skip)
}

export async function searchProducts(query: string): Promise<ProductsPage> {
  return readProductsResponse(
    `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
    0,
    'Unable to search products. Please try again.',
  )
}

export function hasMoreProducts(skip: number, loadedCount: number, total: number): boolean {
  return skip + loadedCount < total
}
