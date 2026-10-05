export class CartRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartRequestError'
  }
}

export async function addToCart(userId: number, productId: number, quantity: number): Promise<void> {
  let response: Response
  try {
    response = await fetch('https://dummyjson.com/carts/add', {
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
    throw new CartRequestError('Unable to add this item to your cart. Please try again.')
  }
}
