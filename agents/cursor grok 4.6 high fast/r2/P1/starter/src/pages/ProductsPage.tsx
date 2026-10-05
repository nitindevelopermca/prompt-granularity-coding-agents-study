import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { fetchProducts, searchProducts } from '../api'
import { ProductCard } from '../components/ProductCard'
import { ReviewModal } from '../components/ReviewModal'
import { SearchIcon } from '../icons'
import type { Product, Review } from '../types'
import { PAGE_SIZE } from '../utils'

const SEARCH_DEBOUNCE_MS = 400

export function ProductsPage() {
  const searchId = useId()
  const searchErrorId = useId()
  const [catalog, setCatalog] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)
  const searchAbort = useRef<AbortController | null>(null)

  const searching = activeQuery.trim().length > 0
  const visibleProducts = searching ? searchResults : catalog
  const hasMore = !searching && skip + catalog.length < total

  useEffect(() => {
    const controller = new AbortController()
    setInitialLoading(true)
    setCatalogError('')
    fetchProducts(0, controller.signal)
      .then((page) => {
        setCatalog(page.products)
        setTotal(page.total)
        setSkip(page.skip)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setCatalogError(error instanceof Error ? error.message : 'Unable to load products')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setInitialLoading(false)
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setActiveQuery('')
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
      searchAbort.current?.abort()
      return
    }

    const timer = window.setTimeout(() => {
      runSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  function applyReviews(productId: number, reviews: Review[]) {
    const update = (list: Product[]) =>
      list.map((product) => (product.id === productId ? { ...product, reviews } : product))
    setCatalog((current) => update(current))
    setSearchResults((current) => update(current))
  }

  function runSearch(query: string) {
    searchAbort.current?.abort()
    const controller = new AbortController()
    searchAbort.current = controller
    setActiveQuery(query)
    setSearchLoading(true)
    setSearchError('')
    searchProducts(query, controller.signal)
      .then((products) => {
        setSearchResults(products)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setSearchError(error instanceof Error ? error.message : 'Unable to search products')
        setSearchResults([])
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSearchLoading(false)
        }
      })
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setActiveQuery('')
      setSearchResults([])
      setSearchError('')
      return
    }
    runSearch(trimmed)
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) {
      return
    }
    const nextSkip = skip + PAGE_SIZE
    setLoadingMore(true)
    setLoadMoreError('')
    try {
      const page = await fetchProducts(nextSkip)
      setCatalog((current) => {
        const seen = new Set(current.map((product) => product.id))
        return [...current, ...page.products.filter((product) => !seen.has(product.id))]
      })
      setTotal(page.total)
      setSkip(page.skip)
    } catch (error) {
      setLoadMoreError(error instanceof Error ? error.message : 'Unable to load more products')
    } finally {
      setLoadingMore(false)
    }
  }

  const reviewProduct = useMemo(
    () => visibleProducts.find((product) => product.id === reviewProductId) ?? null,
    [visibleProducts, reviewProductId],
  )

  const showingLabel = searching
    ? searchLoading
      ? 'Searching products'
      : `Showing ${visibleProducts.length} result${visibleProducts.length === 1 ? '' : 's'} for “${activeQuery}”`
    : `Showing ${catalog.length} of ${total} products`

  return (
    <div className="products-page">
      <div className="page-heading">
        <h1>All Products</h1>
        <p className="showing-count" aria-live="polite">
          {showingLabel}
        </p>
      </div>

      <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
        <label htmlFor={searchId} className="visually-hidden">
          Search products
        </label>
        <div className="input-wrap search-wrap">
          <SearchIcon className="input-icon" />
          <input
            id={searchId}
            type="search"
            name="q"
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-describedby={searchError ? searchErrorId : undefined}
          />
        </div>
        <button className="primary-button" type="submit" disabled={searchLoading}>
          {searchLoading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searchError ? (
        <p className="form-error" id={searchErrorId} role="alert">
          {searchError}
        </p>
      ) : null}
      {catalogError && !searching ? (
        <p className="form-error" role="alert">
          {catalogError}
        </p>
      ) : null}

      {initialLoading && !searching ? (
        <p className="status-text" role="status" aria-live="polite">
          Loading products…
        </p>
      ) : null}

      {searchLoading ? (
        <p className="status-text" role="status" aria-live="polite">
          Searching products…
        </p>
      ) : null}

      {!initialLoading && !searching && !catalogError && catalog.length === 0 ? (
        <p className="empty-state" role="status">
          No products are available right now.
        </p>
      ) : null}

      {searching && !searchLoading && !searchError && searchResults.length === 0 ? (
        <p className="empty-state" role="status">
          No products match your search.
        </p>
      ) : null}

      {visibleProducts.length > 0 ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onOpenReviews={(item) => setReviewProductId(item.id)} />
          ))}
        </div>
      ) : null}

      {loadMoreError ? (
        <p className="form-error" role="alert">
          {loadMoreError}
        </p>
      ) : null}

      {hasMore ? (
        <div className="load-more-wrap">
          <button
            type="button"
            className="secondary-button"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more…' : 'Load more'}
          </button>
        </div>
      ) : !searching && catalog.length > 0 ? (
        <p className="end-of-list" role="status">
          You have reached the end of the catalog.
        </p>
      ) : null}

      {reviewProduct ? (
        <ReviewModal
          product={reviewProduct}
          onClose={() => setReviewProductId(null)}
          onReviewsChange={applyReviews}
        />
      ) : null}
    </div>
  )
}
