// Product search API client.
// Contract: spec/apis_contract/04_Products_Search_Pagination.md, spec/SPEC_FREEZE.md
//   GET https://dummyjson.com/products/search?q={query}
//   Empty query is not searched — caller returns to the paginated catalog.

import { API_BASE_URL } from './config';
import type { ProductsResponse } from '../types/product';

export const SEARCH_ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  api: 'Search failed. Please try again.',
  unexpected: 'Unexpected response from server. Please try again.',
} as const;

export class SearchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SearchError';
    this.status = status;
  }
}

export async function searchProducts(query: string): Promise<ProductsResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
  } catch {
    throw new SearchError(SEARCH_ERROR_MESSAGES.network);
  }

  if (!response.ok) {
    throw new SearchError(SEARCH_ERROR_MESSAGES.api, response.status);
  }

  try {
    const data = (await response.json()) as ProductsResponse;
    if (!Array.isArray(data.products)) {
      throw new Error('missing required fields');
    }
    return data;
  } catch {
    throw new SearchError(SEARCH_ERROR_MESSAGES.unexpected);
  }
}
