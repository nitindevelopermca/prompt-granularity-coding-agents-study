export type Review = {
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
  images?: string[]
  reviews?: Review[]
}

export type ProductsResponse = {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export type LoginResponse = {
  id: number
  username: string
  accessToken: string
  refreshToken?: string
}

export type Session = {
  id: number
  username: string
  accessToken: string
}

export type CartLine = {
  productId: number
  title: string
  price: number
  thumbnail?: string
  quantity: number
}

export type Route = 'products' | 'cart'
