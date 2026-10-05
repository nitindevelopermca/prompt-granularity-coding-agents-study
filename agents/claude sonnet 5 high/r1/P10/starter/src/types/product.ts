// Product types per spec/SPEC_FREEZE.md "Product listing (lazy load)" and
// spec/apis_contract/02_Products_Reviews_API_Contract.docx /
// 04_Products_Search_Pagination.md.

export interface ProductReview {
  /**
   * Optional because a locally-added comment (this app's add-comment flow)
   * may not collect a star rating — DummyJSON's comment POST has no rating
   * field. Reviews returned from the products API always include one.
   */
  rating?: number;
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
  /** Often missing from DummyJSON data — callers must show a fallback. */
  brand?: string;
  thumbnail: string;
  images: string[];
  reviews?: ProductReview[];
}

/** Shape of `GET https://dummyjson.com/products?limit=&skip=`. */
export interface ProductsPageResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
