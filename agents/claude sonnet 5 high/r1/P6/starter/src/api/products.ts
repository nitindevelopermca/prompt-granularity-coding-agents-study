// Product listing API client (lazy-loaded pagination only).
// Contract: spec/apis_contract/02_Products_Reviews_API_Contract.docx,
// spec/apis_contract/04_Products_Search_Pagination.md, spec/SPEC_FREEZE.md
//   GET https://dummyjson.com/products?limit=10&skip=0
//   Load more: same URL with skip increased by limit (10, 20, ...).
//   Never request limit=0 / the full catalog.

import { API_BASE_URL } from './config';
import type { ProductsResponse } from '../types/product';

export const PRODUCTS_PAGE_LIMIT = 10;

export const PRODUCTS_ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  api: 'Failed to load products. Please try again.',
  unexpected: 'Unexpected response from server. Please try again.',
} as const;

export class ProductsError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ProductsError';
    this.status = status;
  }
}

/**
 * Fetches one page of products starting at `skip`. Never pass a `limit` of
 * 0 — callers must page through results instead of fetching everything.
 */
export async function fetchProducts(
  skip: number,
  limit: number = PRODUCTS_PAGE_LIMIT,
): Promise<ProductsResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/products?limit=${limit}&skip=${skip}`);
  } catch {
    throw new ProductsError(PRODUCTS_ERROR_MESSAGES.network);
  }

  if (!response.ok) {
    throw new ProductsError(PRODUCTS_ERROR_MESSAGES.api, response.status);
  }

  try {
    const data = (await response.json()) as ProductsResponse;
    if (!Array.isArray(data.products) || typeof data.total !== 'number') {
      throw new Error('missing required fields');
    }
    return data;
  } catch {
    throw new ProductsError(PRODUCTS_ERROR_MESSAGES.unexpected);
  }
}
