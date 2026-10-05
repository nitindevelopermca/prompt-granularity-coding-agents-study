export type AuthUser = {
  id: number
  accessToken: string
  refreshToken?: string
  username?: string
  firstName?: string
}

export type ProductReview = {
  rating: number
  comment: string
  date: string
  reviewerName: string
}

export type Product = {
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

export type ProductsResponse = {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export type CartLine = {
  productId: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}

export type AppView = 'login' | 'products' | 'cart'
