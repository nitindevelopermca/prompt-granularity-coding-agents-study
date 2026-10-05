// Products listing: heading, showing-count, search, lazy-loaded grid, Load
// more. UX: spec/ux/ux-design-of-product-listing.png.
// APIs: spec/apis_contract/02_Products_Reviews_API_Contract.docx,
// spec/apis_contract/04_Products_Search_Pagination.md, spec/SPEC_FREEZE.md
//
// Scope for this phase: listing chrome, lazy-loaded fetching, full product
// cards (image gallery, price/discount, rating control, brand, Add to
// Cart), and search. The review modal, add-a-comment, and the real
// add-to-cart request are wired up in later work units.

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { fetchProducts, PRODUCTS_PAGE_LIMIT, ProductsError } from '../api/products';
import { searchProducts, SearchError } from '../api/search';
import type { Product, ProductReview } from '../types/product';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import ProductCard from '../components/ProductCard';
import { CloseIcon, SearchIcon } from '../components/icons';
import styles from './ProductsPage.module.css';

const SEARCH_DEBOUNCE_MS = 400;

export default function ProductsPage() {
  useDocumentMeta('Products – MyShop', 'Browse and search the MyShop product catalog.');

  // Paginated catalog state.
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  // Search state — independent of the catalog above so clearing search
  // never discards already-loaded catalog pages.
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isSearchMode = activeQuery.trim().length > 0;

  const initialErrorRef = useRef<HTMLDivElement>(null);
  const loadMoreErrorRef = useRef<HTMLParagraphElement>(null);
  const searchErrorRef = useRef<HTMLDivElement>(null);

  const loadInitial = useCallback(() => {
    setIsInitialLoading(true);
    setInitialError(null);
    fetchProducts(0, PRODUCTS_PAGE_LIMIT)
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch((error: unknown) => {
        setInitialError(error instanceof ProductsError ? error.message : 'Failed to load products. Please try again.');
      })
      .finally(() => setIsInitialLoading(false));
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (initialError) {
      initialErrorRef.current?.focus();
    }
  }, [initialError]);

  useEffect(() => {
    if (loadMoreError) {
      loadMoreErrorRef.current?.focus();
    }
  }, [loadMoreError]);

  useEffect(() => {
    if (searchError) {
      searchErrorRef.current?.focus();
    }
  }, [searchError]);

  const runSearch = useCallback((query: string) => {
    setActiveQuery(query);
    setIsSearching(true);
    setSearchError(null);
    searchProducts(query)
      .then((data) => setSearchResults(data.products))
      .catch((error: unknown) => {
        setSearchResults(null);
        setSearchError(error instanceof SearchError ? error.message : 'Search failed. Please try again.');
      })
      .finally(() => setIsSearching(false));
  }, []);

  // Debounce: search a short delay after the user stops typing. An empty
  // query returns to the paginated catalog instead of searching.
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setActiveQuery('');
      setSearchResults(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    const handle = window.setTimeout(() => runSearch(trimmed), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    runSearch(trimmed);
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const data = await fetchProducts(products.length, PRODUCTS_PAGE_LIMIT);
      setProducts((previous) => [...previous, ...data.products]);
      setTotal(data.total);
    } catch (error) {
      setLoadMoreError(
        error instanceof ProductsError ? error.message : 'Failed to load more products. Please try again.',
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  // A successful comment POST is simulated (DummyJSON does not persist it),
  // so we append the new review to whichever list(s) currently hold that
  // product — catalog and/or search results — purely in frontend state.
  const handleCommentAdded = useCallback((productId: number, review: ProductReview) => {
    const withNewReview = (list: Product[]) =>
      list.map((product) =>
        product.id === productId ? { ...product, reviews: [review, ...product.reviews] } : product,
      );
    setProducts((previous) => withNewReview(previous));
    setSearchResults((previous) => (previous ? withNewReview(previous) : previous));
  }, []);

  const hasMore = total !== null && products.length < total;
  const showEmptyState = !isInitialLoading && !initialError && products.length === 0;
  const showEndOfList = !isInitialLoading && !initialError && total !== null && !hasMore && products.length > 0;

  let statusText = '';
  if (isSearchMode) {
    if (isSearching) {
      statusText = `Searching for “${activeQuery}”…`;
    } else if (!searchError && searchResults) {
      statusText = `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for “${activeQuery}”`;
    }
  } else if (isInitialLoading) {
    statusText = 'Loading products…';
  } else if (total !== null) {
    statusText = `Showing ${products.length} of ${total} products`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>All Products</h1>
          <p className={styles.count} aria-live="polite">
            {statusText}
          </p>
        </div>

        <form className={styles.searchForm} role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className={styles.srOnly}>
            Search products
          </label>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            id="product-search"
            type="search"
            placeholder="Search products"
            className={styles.searchInput}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {searchInput ? (
            <button
              type="button"
              className={styles.clearSearch}
              aria-label="Clear search"
              onClick={() => setSearchInput('')}
            >
              <CloseIcon />
            </button>
          ) : null}
        </form>
      </div>

      {isSearchMode ? (
        <>
          {searchError ? (
            <div className={styles.errorBox} role="alert" tabIndex={-1} ref={searchErrorRef}>
              <p>{searchError}</p>
              <button type="button" className={styles.retryButton} onClick={() => runSearch(activeQuery)}>
                Try again
              </button>
            </div>
          ) : null}

          {!isSearching && !searchError && searchResults && searchResults.length === 0 ? (
            <p className={styles.empty}>No products match “{activeQuery}”.</p>
          ) : null}

          {!isSearching && !searchError && searchResults && searchResults.length > 0 ? (
            <ul className={styles.grid}>
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} onCommentAdded={handleCommentAdded} />
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <>
          {initialError ? (
            <div className={styles.errorBox} role="alert" tabIndex={-1} ref={initialErrorRef}>
              <p>{initialError}</p>
              <button type="button" className={styles.retryButton} onClick={loadInitial}>
                Try again
              </button>
            </div>
          ) : null}

          {showEmptyState ? <p className={styles.empty}>No products found.</p> : null}

          {products.length > 0 ? (
            <ul className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onCommentAdded={handleCommentAdded} />
              ))}
            </ul>
          ) : null}

          {loadMoreError ? (
            <p className={styles.loadMoreError} role="alert" tabIndex={-1} ref={loadMoreErrorRef}>
              {loadMoreError}
            </p>
          ) : null}

          {!isInitialLoading && !initialError && hasMore ? (
            <button
              type="button"
              className={styles.loadMore}
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              aria-busy={isLoadingMore}
            >
              {isLoadingMore ? 'Loading more…' : 'Load more'}
            </button>
          ) : null}

          {showEndOfList ? <p className={styles.endOfList}>You’ve reached the end of the list.</p> : null}
        </>
      )}
    </div>
  );
}
