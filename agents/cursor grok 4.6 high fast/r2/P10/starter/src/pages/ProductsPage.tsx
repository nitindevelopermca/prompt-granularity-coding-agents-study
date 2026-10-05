import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  PRODUCTS_PAGE_SIZE,
  ProductsError,
  fetchCatalogPage,
  fetchProductSearch,
  hasMorePages,
  type CatalogProduct,
  type ProductReview,
} from '../api/products'
import ProductCard from '../components/ProductCard'

export default function ProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [nextSkip, setNextSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const [draftQuery, setDraftQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CatalogProduct[] | null>(null)
  const [searchTotal, setSearchTotal] = useState<number | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const debounceRef = useRef<number | undefined>(undefined)
  const searchAbortRef = useRef<AbortController | null>(null)
  const searchRequestRef = useRef(0)

  const isSearchMode = activeQuery.length > 0

  useEffect(() => {
    document.title = 'MyShop — Products'
  }, [])

  useEffect(() => {
    return () => {
      window.clearTimeout(debounceRef.current)
      searchAbortRef.current?.abort()
    }
  }, [])

  const loadInitial = useCallback(async () => {
    setIsInitialLoading(true)
    setError('')

    try {
      const page = await fetchCatalogPage(0)
      setProducts(page.products)
      setTotal(page.total)
      setNextSkip(page.skip + PRODUCTS_PAGE_SIZE)
      setHasMore(hasMorePages(page))
    } catch (caught) {
      setProducts([])
      setTotal(null)
      setNextSkip(0)
      setHasMore(false)
      setError(caught instanceof ProductsError ? caught.message : 'Unable to load products. Please try again.')
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  function exitSearch() {
    window.clearTimeout(debounceRef.current)
    searchAbortRef.current?.abort()
    searchAbortRef.current = null
    searchRequestRef.current += 1
    setActiveQuery('')
    setSearchResults(null)
    setSearchTotal(null)
    setIsSearching(false)
    setSearchError('')
  }

  async function runSearch(query: string) {
    const trimmed = query.trim()
    if (!trimmed) {
      exitSearch()
      return
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    const requestId = searchRequestRef.current + 1
    searchRequestRef.current = requestId

    setActiveQuery(trimmed)
    setIsSearching(true)
    setSearchError('')

    try {
      const page = await fetchProductSearch(trimmed, controller.signal)
      if (requestId !== searchRequestRef.current) {
        return
      }
      setSearchResults(page.products)
      setSearchTotal(page.total)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        return
      }
      if (requestId !== searchRequestRef.current) {
        return
      }
      setSearchError(
        caught instanceof ProductsError ? caught.message : 'Unable to search products. Please try again.',
      )
    } finally {
      if (requestId === searchRequestRef.current) {
        setIsSearching(false)
      }
    }
  }

  function scheduleSearch(query: string) {
    window.clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      exitSearch()
      return
    }

    debounceRef.current = window.setTimeout(() => {
      void runSearch(trimmed)
    }, 400)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.clearTimeout(debounceRef.current)
    void runSearch(draftQuery)
  }

  async function loadMore() {
    if (isSearchMode || isLoadingMore || !hasMore) {
      return
    }

    setIsLoadingMore(true)
    setError('')

    try {
      const page = await fetchCatalogPage(nextSkip)
      setProducts((current) => [...current, ...page.products])
      setTotal(page.total)
      setNextSkip(page.skip + PRODUCTS_PAGE_SIZE)
      setHasMore(hasMorePages(page))
    } catch (caught) {
      setError(
        caught instanceof ProductsError
          ? caught.message
          : 'Unable to load more products. Please try again.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  const displayedProducts = isSearchMode ? (searchResults ?? []) : products
  const displayedTotal = isSearchMode ? searchTotal : total
  const showSearchLoading = isSearchMode && isSearching && searchResults === null
  const showCatalogLoading = !isSearchMode && isInitialLoading
  const visibleError = isSearchMode ? searchError : error
  const showNoMatches =
    isSearchMode && !isSearching && !searchError && searchResults !== null && searchResults.length === 0
  const showCatalogEmpty =
    !isSearchMode && !isInitialLoading && products.length === 0 && !error
  function updateProductReviews(productId: number, reviews: ProductReview[]) {
    const apply = (items: CatalogProduct[]) =>
      items.map((item) => (item.id === productId ? { ...item, reviews } : item))

    setProducts((current) => apply(current))
    setSearchResults((current) => (current ? apply(current) : current))
  }

  const showingCount =
    displayedTotal !== null && !showCatalogLoading && !showSearchLoading
      ? `Showing ${displayedProducts.length} of ${displayedTotal} products`
      : ''

  return (
    <main id="main-content" className="app-main">
      <section
        className="catalog"
        aria-labelledby="products-heading"
        aria-busy={isInitialLoading || isLoadingMore || isSearching}
      >
        <div className="catalog-header">
          <div>
            <h1 id="products-heading">All Products</h1>
            {showingCount ? (
              <p className="catalog-count" aria-live="polite">
                {showingCount}
              </p>
            ) : null}
          </div>

          <form className="catalog-search" role="search" onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="product-search">
              Search products
            </label>
            <input
              id="product-search"
              type="search"
              name="q"
              placeholder="Search products"
              value={draftQuery}
              autoComplete="off"
              onChange={(event) => {
                const value = event.target.value
                setDraftQuery(value)
                scheduleSearch(value)
              }}
            />
            <button type="submit" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>

        {showCatalogLoading || showSearchLoading ? (
          <p className="catalog-status" role="status">
            {showSearchLoading ? 'Searching products…' : 'Loading products…'}
          </p>
        ) : null}

        {visibleError ? (
          <p className="catalog-error" role="alert" tabIndex={-1}>
            {visibleError}
          </p>
        ) : null}

        {showNoMatches ? (
          <p className="catalog-status" role="status">
            No products match “{activeQuery}”.
          </p>
        ) : null}

        {showCatalogEmpty ? <p className="catalog-status">No products to show.</p> : null}

        {displayedProducts.length > 0 && !showSearchLoading ? (
          <ul className="catalog-list">
            {displayedProducts.map((product) => (
              <li key={product.id} className="catalog-item">
                <ProductCard
                  product={product}
                  onReviewsChange={(reviews) => updateProductReviews(product.id, reviews)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {!isSearchMode && !isInitialLoading && error && products.length === 0 ? (
          <button className="catalog-retry" type="button" onClick={() => void loadInitial()}>
            Try again
          </button>
        ) : null}

        {isSearchMode && searchError ? (
          <button className="catalog-retry" type="button" onClick={() => void runSearch(activeQuery)}>
            Try again
          </button>
        ) : null}

        {!isSearchMode && hasMore ? (
          <button
            className="catalog-load-more"
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading more…' : 'Load more'}
          </button>
        ) : null}
      </section>
    </main>
  )
}
