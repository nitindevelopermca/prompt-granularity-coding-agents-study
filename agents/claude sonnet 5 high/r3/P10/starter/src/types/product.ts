export interface ProductReview {
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
  discountPercentage?: number
  rating?: number
  brand?: string
  thumbnail: string
  images?: string[]
  reviews?: ProductReview[]
}

/** Shape returned by GET /products and GET /products/search on DummyJSON. */
export interface ProductsListResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}
