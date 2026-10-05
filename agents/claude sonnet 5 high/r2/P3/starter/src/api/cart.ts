import { API_BASE } from './config'
import { ApiError } from './errors'

export interface AddToCartResult {
  totalQuantity: number
}

/**
 * POST https://dummyjson.com/carts/add
 * spec/apis_contract/03_Add_To_Cart_API_Contract.docx
 * No GET-cart API exists — quantity/remove/totals are handled locally after this call.
 */
export async function addToCart(userId: number, productId: number, quantity: number): Promise<AddToCartResult> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        products: [{ id: productId, quantity }],
      }),
    })
  } catch {
    throw new ApiError('Network error while adding this item to your cart. Please try again.')
  }

  if (!response.ok) {
    throw new ApiError('Failed to add this item to your cart. Please try again.', response.status)
  }

  const data = (await response.json()) as { totalQuantity?: number }
  return { totalQuantity: data.totalQuantity ?? 0 }
}
