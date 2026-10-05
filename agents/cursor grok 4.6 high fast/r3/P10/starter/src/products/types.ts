export type ProductReview = {
  reviewerName: string
  rating: number
  comment: string
  date: string
}

export type CatalogProduct = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand: string | null
  thumbnail: string
  images: string[]
  reviews: ProductReview[]
}

export type ProductsPage = {
  products: CatalogProduct[]
  total: number
  skip: number
}
