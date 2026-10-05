export const PRODUCTS_PAGE_SIZE = 10

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

export type ProductPage = {
  products: Product[]
  total: number
  skip: number
  limit: number
}

export class ProductsNetworkError extends Error {
  readonly kind = 'network' as const

  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message)
    this.name = 'ProductsNetworkError'
  }
}

export class ProductsRequestError extends Error {
  readonly kind = 'request' as const

  constructor(message = 'Unable to load products. Please try again.') {
    super(message)
    this.name = 'ProductsRequestError'
  }
}
