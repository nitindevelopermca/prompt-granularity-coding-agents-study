export type Session = {
  id: number
  accessToken: string
  refreshToken?: string
}

export type LoginSuccessResponse = {
  id: number
  accessToken: string
  refreshToken?: string
}

export type LoginErrorResponse = {
  message?: string
}

export type AppPath = '/login' | '/products' | '/cart'

export type ProductReview = {
  reviewerName: string
  rating: number
  comment: string
  date: string
}

export type Product = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand?: string
  thumbnail?: string
  images: string[]
  reviews: ProductReview[]
}

export type CartItem = {
  id: number
  title: string
  price: number
  quantity: number
  thumbnail?: string
}
