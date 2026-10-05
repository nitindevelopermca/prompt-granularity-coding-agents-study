import { API_BASE_URL } from './config'
import type { ProductsResponse } from '../types'

/**
 * GET https://dummyjson.com/products?limit=&skip=
 * Never call with limit=0 (that would download the entire catalog at once).
 */
export async function fetchProducts(limit: number, skip: number): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/products?limit=${limit}&skip=${skip}`)
  } catch {
    throw new Error('Network error while loading products. Please check your connection and try again.')
  }
  if (!response.ok) {
    throw new Error('Could not load products. Please try again.')
  }
  return (await response.json()) as ProductsResponse
}

/**
 * GET https://dummyjson.com/products/search?q=
 * Called only with a non-empty, trimmed query.
 */
export async function searchProducts(query: string): Promise<ProductsResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new Error('Network error while searching. Please check your connection and try again.')
  }
  if (!response.ok) {
    throw new Error('Search failed. Please try again.')
  }
  return (await response.json()) as ProductsResponse
}
