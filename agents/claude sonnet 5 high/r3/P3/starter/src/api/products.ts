import { API_BASE } from './config'
import { ApiError } from './errors'
import type { ProductsResponse } from '../types'

/**
 * GET https://dummyjson.com/products?limit=&skip=
 * Lazy-load pagination only — never call with limit=0.
 * spec/apis_contract/04_Products_Search_Pagination.md + spec/SPEC_FREEZE.md
 */
export async function fetchProducts(limit: number, skip: number): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/products?limit=${limit}&skip=${skip}`)
  } catch {
    throw new ApiError('Network error while loading products. Please check your connection.')
  }

  if (!response.ok) {
    throw new ApiError('Failed to load products. Please try again.', response.status)
  }

  return (await response.json()) as ProductsResponse
}

/**
 * GET https://dummyjson.com/products/search?q=
 * spec/apis_contract/04_Products_Search_Pagination.md
 */
export async function searchProducts(query: string): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new ApiError('Network error while searching products. Please check your connection.')
  }

  if (!response.ok) {
    throw new ApiError('Search failed. Please try again.', response.status)
  }

  return (await response.json()) as ProductsResponse
}
