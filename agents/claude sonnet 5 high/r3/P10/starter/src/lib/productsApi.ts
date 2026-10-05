import type { ProductsListResponse } from '../types/product'

const BASE_URL = 'https://dummyjson.com'

export class ProductsApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductsApiError'
  }
}

async function parseListResponse(response: Response, fallbackMessage: string): Promise<ProductsListResponse> {
  if (!response.ok) {
    throw new ProductsApiError(fallbackMessage)
  }
  try {
    return (await response.json()) as ProductsListResponse
  } catch {
    throw new ProductsApiError('Unexpected response from the server. Please try again.')
  }
}

/**
 * Fetches one page of the lazy-loaded catalog per spec/SPEC_FREEZE.md.
 * Never call with limit=0; callers must page via skip.
 */
export async function fetchProducts(limit: number, skip: number): Promise<ProductsListResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`)
  } catch {
    throw new ProductsApiError('Network error while loading products. Please try again.')
  }
  return parseListResponse(response, 'Failed to load products. Please try again.')
}

/** Searches the catalog per spec/apis_contract/04_Products_Search_Pagination.md. */
export async function searchProducts(query: string): Promise<ProductsListResponse> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new ProductsApiError('Network error while searching products. Please try again.')
  }
  return parseListResponse(response, 'Search failed. Please try again.')
}
