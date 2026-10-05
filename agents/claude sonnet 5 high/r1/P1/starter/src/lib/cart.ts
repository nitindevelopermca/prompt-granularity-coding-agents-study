import { apiRequest } from './apiClient'
import type { AddToCartRequest, AddToCartResponse } from '../types'

export async function addToCartRequest(
  userId: number,
  productId: number,
  quantity: number,
): Promise<AddToCartResponse> {
  const payload: AddToCartRequest = {
    userId,
    products: [{ id: productId, quantity }],
  }
  return apiRequest<AddToCartResponse>('/carts/add', {
    method: 'POST',
    body: payload,
  })
}
