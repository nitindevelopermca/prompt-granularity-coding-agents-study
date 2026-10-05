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
}
