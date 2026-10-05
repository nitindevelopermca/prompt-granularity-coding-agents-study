import type { Product, ProductListResult, ProductReview } from '../types/product'

export const PRODUCT_PAGE_SIZE = 10

export type ProductsErrorCode = 'network' | 'http'

export class ProductsRequestError extends Error {
  readonly code: ProductsErrorCode

  constructor(message: string, code: ProductsErrorCode) {
    super(message)
    this.name = 'ProductsRequestError'
    this.code = code
  }
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function parseReview(value: unknown): ProductReview | null {
  if (!isRecord(value)) {
    return null
  }
  if (typeof value.reviewerName !== 'string' || typeof value.comment !== 'string') {
    return null
  }
  const review: ProductReview = {
    reviewerName: value.reviewerName,
    comment: value.comment,
    date: typeof value.date === 'string' ? value.date : '',
  }
  if (typeof value.rating === 'number' && Number.isFinite(value.rating)) {
    review.rating = value.rating
  }
  return review
}

function parseProduct(value: unknown): Product | null {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isFinite(value.id)) {
    return null
  }
  if (typeof value.title !== 'string' || typeof value.description !== 'string') {
    return null
  }
  if (typeof value.price !== 'number' || !Number.isFinite(value.price)) {
    return null
  }

  const images = Array.isArray(value.images)
    ? value.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    price: value.price,
    discountPercentage:
      typeof value.discountPercentage === 'number' && Number.isFinite(value.discountPercentage)
        ? value.discountPercentage
        : 0,
    rating: typeof value.rating === 'number' && Number.isFinite(value.rating) ? value.rating : 0,
    brand: typeof value.brand === 'string' && value.brand.trim() ? value.brand : null,
    thumbnail: typeof value.thumbnail === 'string' && value.thumbnail.length > 0 ? value.thumbnail : null,
    images,
    reviews: Array.isArray(value.reviews)
      ? value.reviews.flatMap((item) => {
          const review = parseReview(item)
          return review ? [review] : []
        })
      : [],
  }
}

async function fetchProductList(url: string, signal?: AbortSignal): Promise<ProductListResult> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ProductsRequestError(
      'Unable to reach the server. Check your connection and try again.',
      'network',
    )
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (!response.ok) {
    throw new ProductsRequestError('Unable to load products. Please try again.', 'http')
  }

  if (!isRecord(body) || !Array.isArray(body.products)) {
    throw new ProductsRequestError('Unexpected products response. Please try again.', 'http')
  }

  const products = body.products.flatMap((item) => {
    const product = parseProduct(item)
    return product ? [product] : []
  })
  const total = typeof body.total === 'number' && Number.isFinite(body.total) ? body.total : products.length

  return { products, total }
}

export function fetchProductPage(skip: number, signal?: AbortSignal): Promise<ProductListResult> {
  return fetchProductList(
    `https://dummyjson.com/products?limit=${PRODUCT_PAGE_SIZE}&skip=${skip}`,
    signal,
  )
}

export function searchProducts(query: string, signal?: AbortSignal): Promise<ProductListResult> {
  return fetchProductList(
    `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`,
    signal,
  )
}
