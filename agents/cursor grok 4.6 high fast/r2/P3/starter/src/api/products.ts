import type { Product, ProductPage, ProductReview } from '../types/product'

export class ProductsRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductsRequestError'
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

  const rating = typeof value.rating === 'number' && Number.isFinite(value.rating) ? value.rating : 0
  const comment = typeof value.comment === 'string' ? value.comment : ''
  const date = typeof value.date === 'string' ? value.date : ''
  const reviewerName =
    typeof value.reviewerName === 'string' && value.reviewerName.trim()
      ? value.reviewerName
      : 'Anonymous'

  return { rating, comment, date, reviewerName }
}

function parseProduct(value: unknown): Product | null {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isFinite(value.id)) {
    return null
  }

  const images = Array.isArray(value.images)
    ? value.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []

  const reviews = Array.isArray(value.reviews)
    ? value.reviews.flatMap((item) => {
        const review = parseReview(item)
        return review ? [review] : []
      })
    : []

  const brand = typeof value.brand === 'string' && value.brand.trim() ? value.brand : undefined

  return {
    id: value.id,
    title: typeof value.title === 'string' && value.title.trim() ? value.title : 'Untitled product',
    description: typeof value.description === 'string' ? value.description : '',
    price: typeof value.price === 'number' && Number.isFinite(value.price) ? value.price : 0,
    discountPercentage:
      typeof value.discountPercentage === 'number' && Number.isFinite(value.discountPercentage)
        ? value.discountPercentage
        : 0,
    rating: typeof value.rating === 'number' && Number.isFinite(value.rating) ? value.rating : 0,
    brand,
    thumbnail: typeof value.thumbnail === 'string' ? value.thumbnail : '',
    images,
    reviews,
  }
}

function parsePage(body: unknown, fallbackSkip: number): ProductPage {
  if (!isRecord(body)) {
    throw new ProductsRequestError('Unexpected products response. Please try again.')
  }

  const products = Array.isArray(body.products)
    ? body.products.flatMap((item) => {
        const product = parseProduct(item)
        return product ? [product] : []
      })
    : []

  const total = typeof body.total === 'number' && Number.isFinite(body.total) ? body.total : products.length
  const skip = typeof body.skip === 'number' && Number.isFinite(body.skip) ? body.skip : fallbackSkip

  return { products, total, skip }
}

async function requestPage(url: string, fallbackSkip: number, signal?: AbortSignal): Promise<ProductPage> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ProductsRequestError('Unable to reach the server. Check your connection and try again.')
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (!response.ok) {
    throw new ProductsRequestError('Unable to load products. Please try again.')
  }

  return parsePage(body, fallbackSkip)
}

export const PRODUCT_PAGE_SIZE = 10

export async function fetchProductPage(skip: number, signal?: AbortSignal): Promise<ProductPage> {
  const url = `https://dummyjson.com/products?limit=${PRODUCT_PAGE_SIZE}&skip=${skip}`
  return requestPage(url, skip, signal)
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<ProductPage> {
  const url = `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`
  return requestPage(url, 0, signal)
}
