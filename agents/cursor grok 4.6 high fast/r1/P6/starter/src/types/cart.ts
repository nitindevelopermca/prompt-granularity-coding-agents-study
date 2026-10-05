export interface CartProductInput {
  id: number
  quantity: number
}

export interface AddToCartRequest {
  userId: number
  products: CartProductInput[]
}

export interface CartItemSnapshot {
  id: number
  title: string
  price: number
  thumbnail?: string
}

export interface CartItem extends CartItemSnapshot {
  quantity: number
}
