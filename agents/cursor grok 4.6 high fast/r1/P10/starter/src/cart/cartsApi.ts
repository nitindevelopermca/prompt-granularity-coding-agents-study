const CARTS_ADD_URL = 'https://dummyjson.com/carts/add'

export class CartRequestError extends Error {
  constructor(message = 'Unable to add this item to your cart. Please try again.') {
    super(message)
    this.name = 'CartRequestError'
  }
}

export async function addProductToCart(userId: number, productId: number, quantity: number): Promise<void> {
  let response: Response

  try {
    response = await fetch(CARTS_ADD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        products: [{ id: productId, quantity }],
      }),
    })
  } catch {
    throw new CartRequestError('Unable to reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new CartRequestError()
  }
}
