// Shared TypeScript types for MyShop.
// Field names mirror the DummyJSON API contracts in spec/apis_contract/.

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

export interface LoginResponse {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  image: string
  accessToken: string
  refreshToken?: string
}

export interface AuthUser {
  id: number
  username: string
  accessToken: string
  refreshToken?: string
  firstName?: string
  lastName?: string
  image?: string
}

export interface CartItem {
  productId: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}

export interface AddToCartResponseItem {
  id: number
  title: string
  price: number
  quantity: number
  total: number
  discountPercentage: number
  discountedPrice: number
  thumbnail: string
}

export interface AddToCartResponse {
  id: number
  products: AddToCartResponseItem[]
  total: number
  discountedTotal: number
  userId: number
  totalProducts: number
  totalQuantity: number
}

export interface AddCommentResponse {
  id: number
  body: string
  postId: number
}
