import { apiRequest } from './apiClient'
import type { ProductsResponse } from '../types'

export async function fetchProducts(limit: number, skip: number): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>(`/products?limit=${limit}&skip=${skip}`)
}

export async function searchProducts(query: string): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>(`/products/search?q=${encodeURIComponent(query)}`)
}
