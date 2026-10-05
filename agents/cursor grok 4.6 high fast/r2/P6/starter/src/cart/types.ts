export type CartItem = {
  id: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}

export class CartNetworkError extends Error {
  readonly kind = 'network' as const

  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message)
    this.name = 'CartNetworkError'
  }
}

export class CartRequestError extends Error {
  readonly kind = 'request' as const

  constructor(message = 'Unable to add this item to your cart. Please try again.') {
    super(message)
    this.name = 'CartRequestError'
  }
}
