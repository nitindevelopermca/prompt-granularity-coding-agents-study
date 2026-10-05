export type ProductReview = {
  reviewerName: string
  comment: string
  date: string
  rating?: number
}

export type Product = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand: string | null
  thumbnail: string | null
  images: string[]
  reviews: ProductReview[]
}

export type ProductListResult = {
  products: Product[]
  total: number
}
