import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { fetchProducts, isNetworkError, searchProducts } from './api'
import { SearchIcon } from './icons'
import { ProductCard } from './ProductCard'
import { ReviewModal } from './ReviewModal'
import type { Product, Review } from './types'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

function errorMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return 'Network error. Check your connection and try again.'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function ProductsPage() {
  const searchId = useId()
  const [catalog, setCatalog] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const hasMore = skip + catalog.length < total
  const isSearch = activeQuery.length > 0
  const visibleProducts = isSearch ? (searchResults ?? []) : catalog

  const applyReview = useCallback((productId: number, review: Review) => {
    const append = (items: Product[]) =>
      items.map((item) =>
        item.id === productId ? { ...item, reviews: [...(item.reviews ?? []), review] } : item,
      )
    setCatalog((items) => append(items))
    setSearchResults((items) => (items ? append(items) : items))
  }, [])

  const reviewProduct =
    reviewProductId == null
      ? null
      : visibleProducts.find((item) => item.id === reviewProductId) ??
        catalog.find((item) => item.id === reviewProductId) ??
        null

  useEffect(() => {
    const controller = new AbortController()

    async function loadFirstPage() {
      setInitialLoading(true)
      setCatalogError('')
      try {
        const data = await fetchProducts(0, PAGE_SIZE, controller.signal)
        setCatalog(data.products ?? [])
        setTotal(data.total ?? 0)
        setSkip(data.skip ?? 0)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        setCatalogError(errorMessage(error, 'Unable to load products'))
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false)
        }
      }
    }

    void loadFirstPage()
    return () => controller.abort()
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    setLoadMoreError('')
    const nextSkip = skip + PAGE_SIZE
    try {
      const data = await fetchProducts(nextSkip, PAGE_SIZE)
      const nextProducts = data.products ?? []
      setCatalog((current) => [...current, ...nextProducts])
      setTotal(data.total ?? total)
      setSkip(data.skip ?? nextSkip)
    } catch (error) {
      setLoadMoreError(errorMessage(error, 'Unable to load more products'))
    } finally {
      setLoadingMore(false)
    }
  }

  const runSearch = useCallback(async (query: string) => {
    searchAbortRef.current?.abort()
    const trimmed = query.trim()
    if (!trimmed) {
      setActiveQuery('')
      setSearchResults(null)
      setSearchError('')
      setSearchLoading(false)
      setSearchTotal(0)
      return
    }

    const controller = new AbortController()
    searchAbortRef.current = controller
    setSearchLoading(true)
    setSearchError('')
    setActiveQuery(trimmed)
    try {
      const data = await searchProducts(trimmed, controller.signal)
      setSearchResults(data.products ?? [])
      setSearchTotal(data.total ?? data.products?.length ?? 0)
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }
      setSearchError(errorMessage(error, 'Unable to search products'))
      setSearchResults([])
    } finally {
      if (!controller.signal.aborted) {
        setSearchLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [searchInput, runSearch])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void runSearch(searchInput)
  }

  let statusText = ''
  if (isSearch) {
    statusText =
      searchLoading
        ? 'Searching products…'
        : `Showing ${visibleProducts.length} of ${searchTotal} matching products`
  } else {
    statusText = initialLoading
      ? 'Loading products…'
      : `Showing ${catalog.length} of ${total} products`
  }

  return (
    <div className="page-wrap">
      <div className="listing-header">
        <div>
          <h1>All Products</h1>
          <p className="showing-count">{statusText}</p>
        </div>
        <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor={searchId} className="sr-only">
            Search products
          </label>
          <input
            id={searchId}
            type="search"
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="search-submit" aria-label="Search">
            <SearchIcon className="input-icon" />
          </button>
        </form>
      </div>

      {catalogError && !isSearch ? (
        <p className="form-error" role="alert">
          {catalogError}
        </p>
      ) : null}
      {searchError && isSearch ? (
        <p className="form-error" role="alert">
          {searchError}
        </p>
      ) : null}

      {initialLoading && !isSearch ? (
        <p className="status-copy">Loading products…</p>
      ) : null}
      {searchLoading && isSearch ? (
        <p className="status-copy">Searching products…</p>
      ) : null}

      {!initialLoading && !isSearch && !catalogError && catalog.length === 0 ? (
        <p className="empty-copy">No products are available right now.</p>
      ) : null}
      {isSearch && !searchLoading && !searchError && visibleProducts.length === 0 ? (
        <p className="empty-copy">No products match your search.</p>
      ) : null}

      {visibleProducts.length > 0 ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenReviews={(item) => setReviewProductId(item.id)}
            />
          ))}
        </div>
      ) : null}

      {!isSearch && hasMore && !initialLoading && !catalogError ? (
        <div className="load-more-wrap">
          {loadMoreError ? (
            <p className="field-error" role="alert">
              {loadMoreError}
            </p>
          ) : null}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {reviewProduct ? (
        <ReviewModal
          product={reviewProduct}
          onClose={() => setReviewProductId(null)}
          onReviewAdded={applyReview}
        />
      ) : null}
    </div>
  )
}
