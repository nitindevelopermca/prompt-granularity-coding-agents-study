export const ADD_CART_URL = 'https://dummyjson.com/carts/add'

export class CartRequestError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'CartRequestError'
    this.status = status
  }
}

export async function addProductToCart(
  userId: number,
  productId: number,
  quantity: number,
): Promise<void> {
  let response: Response

  try {
    response = await fetch(ADD_CART_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        products: [{ id: productId, quantity }],
      }),
    })
  } catch {
    throw new CartRequestError(
      'A network error occurred. Please check your connection and try again.',
    )
  }

  if (!response.ok) {
    throw new CartRequestError(
      'Unable to add this item to your cart. Please try again.',
      response.status,
    )
  }
}
