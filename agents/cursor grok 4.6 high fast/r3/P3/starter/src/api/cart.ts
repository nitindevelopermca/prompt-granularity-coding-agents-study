export type AddCartResult =
  | { ok: true }
  | { ok: false; kind: 'network' | 'unknown'; message: string }

export async function addCartProduct(userId: number, productId: number, quantity: number): Promise<AddCartResult> {
  try {
    const response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        products: [{ id: productId, quantity }],
      }),
    })

    if (!response.ok) {
      return {
        ok: false,
        kind: 'unknown',
        message: 'Unable to add this item to your cart. Please try again.',
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      kind: 'network',
      message: 'Unable to reach the server. Check your connection and try again.',
    }
  }
}
