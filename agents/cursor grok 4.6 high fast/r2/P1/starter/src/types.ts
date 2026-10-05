export type Session = {
  id: number
  accessToken: string
  username: string
  firstName: string
}

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
  brand: string
  thumbnail: string
  images: string[]
  reviews: Review[]
}

export type ProductsPage = {
  products: Product[]
  total: number
  skip: number
}

export type CartItem = {
  productId: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}

export type Route = 'login' | 'products' | 'cart'
