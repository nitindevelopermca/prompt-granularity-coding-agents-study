import { API_BASE_URL } from './config'

export interface AddToCartPayload {
  userId: number
  products: Array<{ id: number; quantity: number }>
}

export interface AddToCartResponseProduct {
  id: number
  title: string
  price: number
  quantity: number
  total: number
  discountPercentage: number
  discountedPrice: number
  thumbnail: string
}

export interface AddToCartResponse {
  id: number
  products: AddToCartResponseProduct[]
  total: number
  discountedTotal: number
  userId: number
  totalProducts: number
  totalQuantity: number
}

/**
 * POST https://dummyjson.com/carts/add
 * DummyJSON has no session GET-cart endpoint; cart totals/quantities are
 * maintained entirely in frontend state after this call succeeds.
 */
export async function addToCart(payload: AddToCartPayload): Promise<AddToCartResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Network error while adding to cart. Please try again.')
  }
  if (!response.ok) {
    throw new Error('Could not add item to cart. Please try again.')
  }
  return (await response.json()) as AddToCartResponse
}
