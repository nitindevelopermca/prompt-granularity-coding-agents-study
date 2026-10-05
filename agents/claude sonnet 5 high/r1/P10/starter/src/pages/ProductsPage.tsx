// Products destination: lazy-loaded catalog listing + search.
// Review modal and add-to-cart wiring are implemented in later work units;
// this page owns catalog fetching/pagination and product search.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { fetchProductsPage, ProductsError, searchProducts } from '../api/productsApi';
import type { Product, ProductReview } from '../types/product';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';
import { SearchIcon } from '../components/icons';
import './ProductsPage.css';

type InitialStatus = 'loading' | 'loaded' | 'error';
type SearchStatus = 'idle' | 'loading' | 'loaded' | 'error';

const GENERIC_LOAD_ERROR = 'Unable to load products right now. Please try again.';
const GENERIC_LOAD_MORE_ERROR = 'Unable to load more products right now. Please try again.';
const GENERIC_SEARCH_ERROR = 'Search failed. Please try again.';
const SEARCH_DEBOUNCE_MS = 400;

export default function ProductsPage() {
  useDocumentTitle('MyShop – Products');

  // --- Paginated catalog state (unchanged behavior from the lazy-load work unit) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [status, setStatus] = useState<InitialStatus>('loading');
  const [initialError, setInitialError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const loadMoreErrorRef = useRef<HTMLDivElement>(null);

  const loadInitial = useCallback(async () => {
    setStatus('loading');
    setInitialError(null);
    try {
      const page = await fetchProductsPage(0);
      setProducts(page.products);
      setTotal(page.total);
      setStatus('loaded');
    } catch (error) {
      setInitialError(error instanceof ProductsError ? error.message : GENERIC_LOAD_ERROR);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const hasMore = total !== null && products.length < total;

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchProductsPage(products.length);
      // Keep already-loaded products; only append the new page.
      setProducts((prev) => [...prev, ...page.products]);
      setTotal(page.total);
    } catch (error) {
      setLoadMoreError(error instanceof ProductsError ? error.message : GENERIC_LOAD_MORE_ERROR);
      requestAnimationFrame(() => loadMoreErrorRef.current?.focus());
    } finally {
      setIsLoadingMore(false);
    }
  }

  // --- Search state. Separate from catalog state so clearing search never
  // discards the already-loaded catalog (products/total/status above). ---
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);
  const searchErrorRef = useRef<HTMLDivElement>(null);
  // Tracks the most recently requested query so a slower, older response
  // can't overwrite the results of a newer one (or the cleared catalog view).
  const latestQueryRef = useRef('');

  const isSearching = activeQuery !== '';

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const runSearch = useCallback(async (query: string) => {
    latestQueryRef.current = query;
    setSearchStatus('loading');
    setSearchError(null);
    try {
      const results = await searchProducts(query);
      if (latestQueryRef.current !== query) return; // Superseded by a newer query.
      setSearchResults(results);
      setSearchStatus('loaded');
    } catch (error) {
      if (latestQueryRef.current !== query) return; // Superseded by a newer query.
      setSearchError(error instanceof ProductsError ? error.message : GENERIC_SEARCH_ERROR);
      setSearchStatus('error');
      requestAnimationFrame(() => searchErrorRef.current?.focus());
    }
  }, []);

  function clearPendingDebounce() {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function returnToCatalog() {
    latestQueryRef.current = '';
    setActiveQuery('');
    setSearchStatus('idle');
    setSearchError(null);
    setSearchResults([]);
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    clearPendingDebounce();

    const trimmed = value.trim();
    if (trimmed === '') {
      // Empty query returns to the paginated catalog — no search is performed.
      returnToCatalog();
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      setActiveQuery(trimmed);
      void runSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPendingDebounce();

    const trimmed = searchInput.trim();
    if (trimmed === '') {
      returnToCatalog();
      return;
    }

    setActiveQuery(trimmed);
    void runSearch(trimmed);
  }

  function handleClearSearch() {
    clearPendingDebounce();
    setSearchInput('');
    returnToCatalog();
  }

  // Appends a newly-posted comment to the matching product wherever it's
  // currently held in state (catalog and/or search results), so the review
  // shows up immediately regardless of which view is active.
  function handleReviewAdded(productId: number, review: ProductReview) {
    const appendToMatching = (list: Product[]) =>
      list.map((item) => (item.id === productId ? { ...item, reviews: [...(item.reviews ?? []), review] } : item));

    setProducts(appendToMatching);
    setSearchResults(appendToMatching);
  }

  return (
    <main className="products-main" id="main-content">
      <div className="products-heading-row">
        <div>
          <h1>All Products</h1>
          {!isSearching && status === 'loaded' && (
            <p className="products-count" aria-live="polite">
              Showing {products.length}
              {total !== null ? ` of ${total}` : ''} products
            </p>
          )}
          {isSearching && searchStatus === 'loaded' && (
            <p className="products-count" aria-live="polite">
              Showing {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for &ldquo;{activeQuery}
              &rdquo;
            </p>
          )}
        </div>

        <form className="products-search" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className="visually-hidden">
            Search products
          </label>
          <div className="products-search-input-wrap">
            <input
              id="product-search"
              type="search"
              className="products-search-input"
              placeholder="Search products"
              autoComplete="off"
              value={searchInput}
              onChange={(event) => handleSearchInputChange(event.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="products-search-clear"
                aria-label="Clear search"
                onClick={handleClearSearch}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            <button type="submit" className="products-search-submit" aria-label="Search products">
              <SearchIcon />
            </button>
          </div>
        </form>
      </div>

      {isSearching ? (
        <>
          {searchStatus === 'loading' && (
            <p className="products-status" role="status">
              Searching&hellip;
            </p>
          )}

          {searchStatus === 'error' && (
            <div className="products-error" role="alert" tabIndex={-1} ref={searchErrorRef}>
              <p>{searchError}</p>
              <button type="button" className="products-retry" onClick={() => void runSearch(activeQuery)}>
                Try again
              </button>
            </div>
          )}

          {searchStatus === 'loaded' && searchResults.length === 0 && (
            <p className="products-status" role="status">
              No products found for &ldquo;{activeQuery}&rdquo;.
            </p>
          )}

          {searchStatus === 'loaded' && searchResults.length > 0 && (
            <ul className="products-grid">
              {searchResults.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} onReviewAdded={handleReviewAdded} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {status === 'loading' && (
            <p className="products-status" role="status">
              Loading products&hellip;
            </p>
          )}

          {status === 'error' && (
            <div className="products-error" role="alert">
              <p>{initialError}</p>
              <button type="button" className="products-retry" onClick={() => void loadInitial()}>
                Try again
              </button>
            </div>
          )}

          {status === 'loaded' && products.length === 0 && (
            <p className="products-status" role="status">
              No products found.
            </p>
          )}

          {status === 'loaded' && products.length > 0 && (
            <>
              <ul className="products-grid">
                {products.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} onReviewAdded={handleReviewAdded} />
                  </li>
                ))}
              </ul>

              {loadMoreError && (
                <div className="products-load-more-error" role="alert" tabIndex={-1} ref={loadMoreErrorRef}>
                  {loadMoreError}
                </div>
              )}

              <div className="products-load-more-row">
                {hasMore ? (
                  <button
                    type="button"
                    className="products-load-more"
                    onClick={() => void handleLoadMore()}
                    disabled={isLoadingMore}
                    aria-busy={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading more…' : 'Load more'}
                  </button>
                ) : (
                  <p className="products-end" role="status">
                    You&rsquo;ve reached the end of the catalog.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
