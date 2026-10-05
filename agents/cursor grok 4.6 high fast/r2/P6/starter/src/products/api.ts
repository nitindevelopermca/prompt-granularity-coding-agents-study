import {
  PRODUCTS_PAGE_SIZE,
  ProductsNetworkError,
  ProductsRequestError,
  type Product,
  type ProductPage,
  type ProductReview,
} from './types'

const PRODUCTS_URL = 'https://dummyjson.com/products'

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function asReview(value: unknown): ProductReview | null {
  const record = asRecord(value)
  if (!record || typeof record.comment !== 'string' || typeof record.reviewerName !== 'string') {
    return null
  }

  return {
    rating: typeof record.rating === 'number' ? record.rating : 0,
    comment: record.comment,
    date: typeof record.date === 'string' ? record.date : '',
    reviewerName: record.reviewerName,
  }
}

function asProduct(value: unknown): Product | null {
  const record = asRecord(value)
  if (!record || typeof record.id !== 'number' || typeof record.title !== 'string') {
    return null
  }

  const images = asStringArray(record.images)
  const thumbnail = typeof record.thumbnail === 'string' ? record.thumbnail : images[0] ?? ''

  return {
    id: record.id,
    title: record.title,
    description: typeof record.description === 'string' ? record.description : '',
    price: typeof record.price === 'number' ? record.price : 0,
    discountPercentage: typeof record.discountPercentage === 'number' ? record.discountPercentage : 0,
    rating: typeof record.rating === 'number' ? record.rating : 0,
    brand: typeof record.brand === 'string' && record.brand.trim() ? record.brand : undefined,
    thumbnail,
    images,
    reviews: Array.isArray(record.reviews)
      ? record.reviews.map(asReview).filter((review): review is ProductReview => review !== null)
      : [],
  }
}

function readErrorMessage(value: unknown, fallback: string): string {
  const record = asRecord(value)
  if (record && typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }

  return fallback
}

async function fetchProductsJson(
  url: string,
  fallbackError: string,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(url, signal ? { signal } : undefined)
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }

    throw new ProductsNetworkError()
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ProductsRequestError(readErrorMessage(payload, fallbackError))
  }

  return payload
}

function parseProductPage(payload: unknown, fallbackSkip: number): ProductPage {
  const record = asRecord(payload)
  if (!record || !Array.isArray(record.products) || typeof record.total !== 'number') {
    throw new ProductsRequestError('The products response was incomplete.')
  }

  return {
    products: record.products.map(asProduct).filter((product): product is Product => product !== null),
    total: record.total,
    skip: typeof record.skip === 'number' ? record.skip : fallbackSkip,
    limit: typeof record.limit === 'number' ? record.limit : PRODUCTS_PAGE_SIZE,
  }
}

export async function fetchProductPage(skip: number): Promise<ProductPage> {
  const payload = await fetchProductsJson(
    `${PRODUCTS_URL}?limit=${PRODUCTS_PAGE_SIZE}&skip=${skip}`,
    'Unable to load products. Please try again.',
  )

  return parseProductPage(payload, skip)
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<ProductPage> {
  const payload = await fetchProductsJson(
    `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
    'Unable to search products. Please try again.',
    signal,
  )

  return parseProductPage(payload, 0)
}
