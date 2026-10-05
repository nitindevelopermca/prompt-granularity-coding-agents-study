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
  discountPercentage: number
  thumbnail: string
  quantity: number
}
