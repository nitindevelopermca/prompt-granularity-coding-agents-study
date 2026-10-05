// Types for the DummyJSON product listing contract.
// See spec/apis_contract/02_Products_Reviews_API_Contract.docx and spec/SPEC_FREEZE.md.

export interface ProductReview {
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
  reviews: ProductReview[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
