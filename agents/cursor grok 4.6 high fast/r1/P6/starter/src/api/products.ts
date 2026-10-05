import type { Product, ProductsResponse } from '../types/product'

export const PRODUCTS_URL = 'https://dummyjson.com/products'
export const PRODUCT_PAGE_SIZE = 10

export type ProductsFailureKind = 'network' | 'unknown'

export class ProductsRequestError extends Error {
  readonly kind: ProductsFailureKind

  constructor(message: string, kind: ProductsFailureKind) {
    super(message)
    this.name = 'ProductsRequestError'
    this.kind = kind
  }
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.title === 'string'
}

function isProductsResponse(value: unknown): value is ProductsResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return Array.isArray(record.products) && typeof record.total === 'number'
}

async function fetchProductsResponse(
  url: string,
  failureMessage: string,
): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new ProductsRequestError(
      'Unable to connect. Please check your network and try again.',
      'network',
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = undefined
  }

  if (!response.ok) {
    throw new ProductsRequestError(failureMessage, 'unknown')
  }

  if (!isProductsResponse(data)) {
    throw new ProductsRequestError('Products could not be read from the server.', 'unknown')
  }

  return {
    products: data.products.filter(isProduct),
    total: data.total,
    skip: typeof data.skip === 'number' ? data.skip : 0,
    limit: typeof data.limit === 'number' ? data.limit : data.products.length,
  }
}

export async function fetchProductPage(skip: number): Promise<ProductsResponse> {
  return fetchProductsResponse(
    `${PRODUCTS_URL}?limit=${PRODUCT_PAGE_SIZE}&skip=${skip}`,
    'Unable to load products. Please try again.',
  )
}

export async function searchProducts(query: string): Promise<ProductsResponse> {
  return fetchProductsResponse(
    `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
    'Unable to search products. Please try again.',
  )
}
