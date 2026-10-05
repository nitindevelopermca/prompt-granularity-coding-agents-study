export const PRODUCTS_PAGE_SIZE = 10

export class ProductsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductsError'
  }
}

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
  brand?: string
  thumbnail: string
  images: string[]
  reviews: ProductReview[]
}

export type CatalogPage = {
  products: CatalogProduct[]
  total: number
  skip: number
}

function parseReview(value: unknown): ProductReview | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.reviewerName !== 'string' ||
    typeof record.rating !== 'number' ||
    typeof record.comment !== 'string' ||
    typeof record.date !== 'string'
  ) {
    return null
  }

  return {
    reviewerName: record.reviewerName,
    rating: record.rating,
    comment: record.comment,
    date: record.date,
  }
}

function parseProduct(value: unknown): CatalogProduct | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  if (typeof record.id !== 'number' || typeof record.title !== 'string') {
    return null
  }

  return {
    id: record.id,
    title: record.title,
    description: typeof record.description === 'string' ? record.description : '',
    price: typeof record.price === 'number' ? record.price : 0,
    discountPercentage: typeof record.discountPercentage === 'number' ? record.discountPercentage : 0,
    rating: typeof record.rating === 'number' ? record.rating : 0,
    brand: typeof record.brand === 'string' ? record.brand : undefined,
    thumbnail: typeof record.thumbnail === 'string' ? record.thumbnail : '',
    images: Array.isArray(record.images)
      ? record.images.filter((image): image is string => typeof image === 'string')
      : [],
    reviews: Array.isArray(record.reviews)
      ? record.reviews.flatMap((review) => {
          const parsed = parseReview(review)
          return parsed ? [parsed] : []
        })
      : [],
  }
}

export function hasMorePages(page: CatalogPage): boolean {
  return page.products.length > 0 && page.skip + page.products.length < page.total
}

function parsePagePayload(payload: unknown, fallbackSkip: number): CatalogPage {
  if (typeof payload !== 'object' || payload === null) {
    throw new ProductsError('Unexpected response from server.')
  }

  const record = payload as Record<string, unknown>
  if (!Array.isArray(record.products) || typeof record.total !== 'number') {
    throw new ProductsError('Unexpected response from server.')
  }

  return {
    products: record.products.flatMap((item) => {
      const product = parseProduct(item)
      return product ? [product] : []
    }),
    total: record.total,
    skip: typeof record.skip === 'number' ? record.skip : fallbackSkip,
  }
}

async function fetchProductsJson(
  url: string,
  networkMessage: string,
  failureMessage: string,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(url, signal ? { signal } : undefined)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ProductsError(networkMessage)
  }

  if (!response.ok) {
    throw new ProductsError(failureMessage)
  }

  try {
    return await response.json()
  } catch {
    throw new ProductsError(failureMessage)
  }
}

export async function fetchCatalogPage(skip: number): Promise<CatalogPage> {
  const payload = await fetchProductsJson(
    `https://dummyjson.com/products?limit=${PRODUCTS_PAGE_SIZE}&skip=${skip}`,
    'Unable to load products. Check your network and try again.',
    'Unable to load products. Please try again.',
  )
  return parsePagePayload(payload, skip)
}

export async function fetchProductSearch(query: string, signal?: AbortSignal): Promise<CatalogPage> {
  const payload = await fetchProductsJson(
    `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`,
    'Unable to search products. Check your network and try again.',
    'Unable to search products. Please try again.',
    signal,
  )
  return parsePagePayload(payload, 0)
}
