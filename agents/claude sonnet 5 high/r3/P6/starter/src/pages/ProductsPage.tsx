// Product listing: lazy-loaded catalog (GET /products?limit=10&skip=0, load
// more) plus search (GET /products/search?q=). UX:
// spec/ux/ux-design-of-product-listing.png. API: spec/apis_contract/ and
// spec/SPEC_FREEZE.md.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, fetchProducts, searchProducts } from '../api/client';
import type { Product, Review } from '../api/types';
import ProductCard from '../components/ProductCard';
import { SearchIcon } from '../components/Icons';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<number | undefined>(undefined);
  const searchSeq = useRef(0);

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    setInitialError(null);
    try {
      const data = await fetchProducts(PAGE_SIZE, 0);
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      setInitialError(err instanceof ApiError ? err.message : 'Failed to load products. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const data = await fetchProducts(PAGE_SIZE, products.length);
      // Keep already-loaded products on failure; on success, append.
      setProducts((prev) => [...prev, ...data.products]);
      setTotal(data.total);
    } catch (err) {
      setLoadMoreError(
        err instanceof ApiError ? err.message : 'Failed to load more products. Please try again.',
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const runSearch = useCallback(async (q: string) => {
    const seq = ++searchSeq.current;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = await searchProducts(q);
      if (seq === searchSeq.current) {
        setSearchResults(data.products);
      }
    } catch (err) {
      if (seq === searchSeq.current) {
        setSearchError(err instanceof ApiError ? err.message : 'Search failed. Please try again.');
      }
    } finally {
      if (seq === searchSeq.current) {
        setSearchLoading(false);
      }
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      // Empty query returns to the lazy-loaded catalog without a new search
      // and without discarding the already-loaded catalog state.
      searchSeq.current += 1;
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      runSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    runSearch(trimmed);
  };

  const handleCommentAdded = (productId: number, review: Review) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product,
      ),
    );
    setSearchResults((prev) =>
      prev
        ? prev.map((product) =>
            product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product,
          )
        : prev,
    );
  };

  const isSearchMode = query.trim().length > 0;
  const visibleProducts = isSearchMode ? searchResults ?? [] : products;
  const hasMore = !isSearchMode && products.length < total;

  return (
    <div className="products-page">
      <div className="products-page__toolbar">
        <div>
          <h1>All Products</h1>
          {!isSearchMode && (
            <p className="products-page__count">
              {initialLoading ? 'Loading products…' : `Showing ${products.length} of ${total} products`}
            </p>
          )}
          {isSearchMode && (
            <p className="products-page__count">
              {searchLoading
                ? `Searching for "${query.trim()}"…`
                : `Showing ${visibleProducts.length} result${visibleProducts.length === 1 ? '' : 's'} for "${query.trim()}"`}
            </p>
          )}
        </div>

        <form role="search" className="search-form" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <div className="input-with-icon">
            <input
              id="product-search"
              type="search"
              placeholder="Search products"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
            />
            <button type="submit" className="input-icon-button input-icon-button--end" aria-label="Search">
              <SearchIcon aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>

      {initialLoading && !isSearchMode && (
        <p role="status" className="products-page__status">
          Loading products…
        </p>
      )}

      {initialError && !isSearchMode && (
        <div role="alert" className="form-alert">
          <span>{initialError}</span>
          <button type="button" className="btn btn-secondary" onClick={loadInitial}>
            Retry
          </button>
        </div>
      )}

      {isSearchMode && searchError && (
        <div role="alert" className="form-alert">
          {searchError}
        </div>
      )}

      {isSearchMode && !searchLoading && !searchError && visibleProducts.length === 0 && (
        <p role="status" className="products-page__status">
          No products match &quot;{query.trim()}&quot;.
        </p>
      )}

      {!isSearchMode && !initialLoading && !initialError && products.length === 0 && (
        <p role="status" className="products-page__status">
          No products available right now.
        </p>
      )}

      {visibleProducts.length > 0 && (
        <ul className="product-grid" aria-label={isSearchMode ? 'Search results' : 'All products'}>
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onCommentAdded={handleCommentAdded} />
            </li>
          ))}
        </ul>
      )}

      {!isSearchMode && !initialLoading && !initialError && products.length > 0 && (
        <div className="products-page__load-more">
          {loadMoreError && (
            <p role="alert" className="field-error">
              {loadMoreError}
            </p>
          )}
          {hasMore ? (
            <button type="button" className="btn btn-outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            <p className="products-page__end" role="status">
              You&apos;ve reached the end of the catalog.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
