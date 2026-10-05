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
  thumbnail?: string
  images?: string[]
  reviews?: ProductReview[]
}

export interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}
