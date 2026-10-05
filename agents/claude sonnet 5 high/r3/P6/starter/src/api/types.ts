// Shared API / domain types used across the app.
// Field names follow the DummyJSON contracts in spec/apis_contract/ and spec/SPEC_FREEZE.md.

export interface LoginResponse {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  image?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  accessToken: string;
  refreshToken?: string;
}

export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  brand?: string;
  thumbnail: string;
  images: string[];
  reviews: Review[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface CartItem {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
}

export interface AddCommentResponse {
  id: number;
  body: string;
  postId: number;
  userId: number;
}

export interface AddToCartResponse {
  id: number;
  products: Array<{ id: number; quantity: number }>;
  total?: number;
}
