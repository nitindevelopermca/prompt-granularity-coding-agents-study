import type { Product, ProductReview } from '../types'

export const PRODUCT_PAGE_SIZE = 10

export type ProductsFetchResult =
  | { ok: true; products: Product[]; total: number }
  | { ok: false; kind: 'network' | 'unknown' | 'aborted'; message: string }

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeReview(value: unknown): ProductReview | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const record = value as Record<string, unknown>
  return {
    reviewerName: asString(record.reviewerName) ?? 'Anonymous',
    rating: asNumber(record.rating) ?? 0,
    comment: asString(record.comment) ?? '',
    date: asString(record.date) ?? '',
  }
}

function normalizeProduct(value: unknown): Product | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const record = value as Record<string, unknown>
  const id = asNumber(record.id)
  const title = asString(record.title)
  if (id === undefined || !title) {
    return null
  }

  const images = Array.isArray(record.images)
    ? record.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []

  const reviews = Array.isArray(record.reviews)
    ? record.reviews.map(normalizeReview).filter((item): item is ProductReview => item !== null)
    : []

  const product: Product = {
    id,
    title,
    description: asString(record.description) ?? '',
    price: asNumber(record.price) ?? 0,
    discountPercentage: asNumber(record.discountPercentage) ?? 0,
    rating: asNumber(record.rating) ?? 0,
    images,
    reviews,
  }

  const brand = asString(record.brand)
  if (brand) {
    product.brand = brand
  }

  const thumbnail = asString(record.thumbnail)
  if (thumbnail) {
    product.thumbnail = thumbnail
  }

  return product
}

async function fetchProductList(url: string, signal?: AbortSignal): Promise<ProductsFetchResult> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return { ok: false, kind: 'aborted', message: '' }
    }
    return {
      ok: false,
      kind: 'network',
      message: 'Unable to reach the server. Check your connection and try again.',
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: 'unknown',
      message: 'Unable to load products right now. Please try again.',
    }
  }

  try {
    const data: unknown = await response.json()
    if (typeof data !== 'object' || data === null) {
      return {
        ok: false,
        kind: 'unknown',
        message: 'Unable to load products right now. Please try again.',
      }
    }
    const record = data as Record<string, unknown>
    const products = Array.isArray(record.products)
      ? record.products.map(normalizeProduct).filter((item): item is Product => item !== null)
      : []
    const total = asNumber(record.total) ?? products.length
    return { ok: true, products, total }
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return { ok: false, kind: 'aborted', message: '' }
    }
    return {
      ok: false,
      kind: 'unknown',
      message: 'Unable to load products right now. Please try again.',
    }
  }
}

export function fetchProductPage(skip: number, signal?: AbortSignal): Promise<ProductsFetchResult> {
  const url = `https://dummyjson.com/products?limit=${PRODUCT_PAGE_SIZE}&skip=${skip}`
  return fetchProductList(url, signal)
}

export function searchProducts(query: string, signal?: AbortSignal): Promise<ProductsFetchResult> {
  const url = `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`
  return fetchProductList(url, signal)
}

export function hasMorePages(skip: number, pageLength: number, total: number): boolean {
  return skip + pageLength < total
}
