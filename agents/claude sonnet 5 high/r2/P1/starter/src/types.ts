// Shared domain types used across the MyShop application.

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
  price: number
  discountPercentage: number
  rating: number
  brand?: string
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

export interface LoginRequest {
  username: string
  password: string
  expiresInMins?: number
}

export interface LoginResponse {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender?: string
  image?: string
  accessToken: string
  refreshToken?: string
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

export interface CartItem {
  id: number
  title: string
  price: number
  thumbnail: string
  quantity: number
  discountPercentage?: number
}
