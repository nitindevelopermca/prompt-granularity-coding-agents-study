const ADD_TO_CART_URL = 'https://dummyjson.com/carts/add'

export class CartApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartApiError'
  }
}

interface AddToCartResult {
  id: number
  products: { id: number; quantity: number }[]
  total?: number
}

/**
 * Adds a product to the cart per spec/apis_contract (add-to-cart contract) and
 * spec/SPEC_FREEZE.md. No Authorization header is required; there is no
 * GET-cart API, so callers keep the cart in frontend state after this call.
 */
export async function addToCartApi(userId: number, productId: number, quantity: number): Promise<AddToCartResult> {
  let response: Response
  try {
    response = await fetch(ADD_TO_CART_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, products: [{ id: productId, quantity }] }),
    })
  } catch {
    throw new CartApiError('Network error while adding to cart. Please try again.')
  }

  if (!response.ok) {
    throw new CartApiError('Failed to add item to cart. Please try again.')
  }

  try {
    return (await response.json()) as AddToCartResult
  } catch {
    throw new CartApiError('Unexpected response while adding to cart.')
  }
}
