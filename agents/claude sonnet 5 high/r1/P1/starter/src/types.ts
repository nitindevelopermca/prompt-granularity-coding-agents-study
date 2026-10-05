// Shared DummyJSON-aligned types for the application.

export interface Review {
  rating: number
  comment: string
  date: string
  reviewerName: string
  reviewerEmail?: string
}

export interface Product {
  id: number
  title: string
  description: string
  category?: string
  price: number
  discountPercentage: number
  rating: number
  stock?: number
  brand?: string
  availabilityStatus?: string
  thumbnail: string
  images: string[]
  reviews: Review[]
}

export interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export interface AuthUser {
  id: number
  username: string
  accessToken: string
  refreshToken?: string
  firstName?: string
  lastName?: string
  image?: string
}

export interface LoginRequest {
  username: string
  password: string
  expiresInMins?: number
}

export interface LoginErrorResponse {
  message: string
}

export interface AddCommentRequest {
  body: string
  postId: number
  userId: number
}

export interface AddCommentResponse {
  id: number
  body: string
  postId: number
  user: {
    id: number
    username: string
  }
}

export interface CartItem {
  id: number
  title: string
  price: number
  discountPercentage: number
  thumbnail: string
  quantity: number
}

export interface AddToCartRequest {
  userId: number
  products: Array<{ id: number; quantity: number }>
}

export interface AddToCartResponseProduct {
  id: number
  title: string
  price: number
  quantity: number
  total: number
  discountPercentage: number
  discountedPrice: number
  thumbnail: string
}

export interface AddToCartResponse {
  id: number
  products: AddToCartResponseProduct[]
  total: number
  discountedTotal: number
  userId: number
  totalProducts: number
  totalQuantity: number
}
