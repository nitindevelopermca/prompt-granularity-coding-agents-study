import type { AddToCartRequest } from '../types/cart'

export const ADD_TO_CART_URL = 'https://dummyjson.com/carts/add'

export type CartFailureKind = 'network' | 'unknown'

export class CartRequestError extends Error {
  readonly kind: CartFailureKind

  constructor(message: string, kind: CartFailureKind) {
    super(message)
    this.name = 'CartRequestError'
    this.kind = kind
  }
}

export async function addToCartRequest(payload: AddToCartRequest): Promise<void> {
  let response: Response
  try {
    response = await fetch(ADD_TO_CART_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new CartRequestError(
      'Unable to connect. Please check your network and try again.',
      'network',
    )
  }

  if (!response.ok) {
    throw new CartRequestError('Unable to add this item to your cart. Your cart is unchanged.', 'unknown')
  }
}
