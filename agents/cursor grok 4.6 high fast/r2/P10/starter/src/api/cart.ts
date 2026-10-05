export class CartError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartError'
  }
}

export async function addCartProducts(input: {
  userId: number
  products: { id: number; quantity: number }[]
}): Promise<void> {
  let response: Response

  try {
    response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        products: input.products,
      }),
    })
  } catch {
    throw new CartError('Unable to add to cart. Check your network and try again.')
  }

  if (!response.ok) {
    throw new CartError('Unable to add to cart. Please try again.')
  }
}
