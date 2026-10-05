import type { Product, ProductsPage, Review } from './types'

export const PAGE_SIZE = 10
export const BRAND_FALLBACK = 'Brand unavailable'

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`
}

export function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function parseReview(value: unknown): Review | null {
  if (!isRecord(value)) {
    return null
  }
  const comment = asString(value.comment)
  const reviewerName = asString(value.reviewerName, 'Anonymous')
  return {
    reviewerName,
    rating: asNumber(value.rating),
    comment,
    date: asString(value.date),
  }
}

export function parseProduct(value: unknown): Product | null {
  if (!isRecord(value) || typeof value.id !== 'number') {
    return null
  }
  const images = asStringArray(value.images)
  const thumbnail = asString(value.thumbnail, images[0] ?? '')
  const reviews = Array.isArray(value.reviews)
    ? value.reviews.map(parseReview).filter((review): review is Review => review !== null)
    : []

  return {
    id: value.id,
    title: asString(value.title, 'Untitled product'),
    description: asString(value.description),
    price: asNumber(value.price),
    discountPercentage: asNumber(value.discountPercentage),
    rating: asNumber(value.rating),
    brand: asString(value.brand, BRAND_FALLBACK),
    thumbnail,
    images: images.length > 0 ? images : thumbnail ? [thumbnail] : [],
    reviews,
  }
}

export function parseProductsPage(value: unknown): ProductsPage {
  if (!isRecord(value) || !Array.isArray(value.products)) {
    throw new Error('Unexpected products response')
  }
  return {
    products: value.products.map(parseProduct).filter((product): product is Product => product !== null),
    total: asNumber(value.total),
    skip: asNumber(value.skip),
  }
}

export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (isRecord(data) && typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }
  } catch {
    // Ignore non-JSON error bodies.
  }
  return fallback
}

export function networkErrorMessage(fallback: string): string {
  return fallback
}
