export interface ProductReview {
  reviewerName: string
  rating: number
  comment: string
  date: string
}

export interface Product {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand?: string
  thumbnail: string
  images: string[]
  reviews: ProductReview[]
}

export interface AuthUser {
  id: number
  username: string
  accessToken: string
  refreshToken?: string
}

export interface CartLine {
  productId: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}
