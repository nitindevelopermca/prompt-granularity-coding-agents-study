import { CartNetworkError, CartRequestError } from './types'

function readErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

export async function addToCartRequest(input: {
  userId: number
  productId: number
  quantity: number
}): Promise<void> {
  let response: Response

  try {
    response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        products: [{ id: input.productId, quantity: input.quantity }],
      }),
    })
  } catch {
    throw new CartNetworkError()
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new CartRequestError(
      readErrorMessage(payload, 'Unable to add this item to your cart. Please try again.'),
    )
  }
}
