// Products (lazy load) + search API client.
//
// Contract (spec/apis_contract/04_Products_Search_Pagination.md, spec/SPEC_FREEZE.md):
//   GET https://dummyjson.com/products?limit=10&skip=0
//   Load more: same URL with skip increased by limit (10, then 20, ...)
//   until skip + products.length >= total. Never use limit=0.
//   GET https://dummyjson.com/products/search?q={query}

import type { Product, ProductsPageResponse } from '../types/product';

const PRODUCTS_URL = 'https://dummyjson.com/products';
const SEARCH_URL = 'https://dummyjson.com/products/search';

/** Fixed page size for lazy loading, per the freeze. Never pass limit=0. */
export const PRODUCTS_PAGE_SIZE = 10;

export type ProductsErrorKind = 'network' | 'unknown';

export class ProductsError extends Error {
  kind: ProductsErrorKind;

  constructor(message: string, kind: ProductsErrorKind) {
    super(message);
    this.name = 'ProductsError';
    this.kind = kind;
  }
}

/** Fetches one page of products starting at `skip`, sized `PRODUCTS_PAGE_SIZE`. */
export async function fetchProductsPage(skip: number): Promise<ProductsPageResponse> {
  let response: Response;

  try {
    response = await fetch(`${PRODUCTS_URL}?limit=${PRODUCTS_PAGE_SIZE}&skip=${skip}`);
  } catch {
    throw new ProductsError(
      'Unable to reach the server. Please check your internet connection and try again.',
      'network',
    );
  }

  if (!response.ok) {
    throw new ProductsError('Unable to load products right now. Please try again.', 'unknown');
  }

  try {
    return (await response.json()) as ProductsPageResponse;
  } catch {
    throw new ProductsError('Received an unexpected response from the server. Please try again.', 'unknown');
  }
}

/**
 * Searches products by query. The caller is responsible for not calling this
 * with an empty query — per the freeze, an empty query returns to the
 * lazy-loaded catalog instead of performing a search.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  let response: Response;

  try {
    response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`);
  } catch {
    throw new ProductsError(
      'Unable to reach the server. Please check your internet connection and try again.',
      'network',
    );
  }

  if (!response.ok) {
    throw new ProductsError('Search failed. Please try again.', 'unknown');
  }

  try {
    const data = (await response.json()) as ProductsPageResponse;
    return data.products;
  } catch {
    throw new ProductsError('Received an unexpected response from the server. Please try again.', 'unknown');
  }
}
