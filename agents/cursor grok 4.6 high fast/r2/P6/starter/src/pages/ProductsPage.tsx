import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchProductPage, searchProducts } from '../products/api'
import { ProductCard } from '../products/ProductCard'
import { ReviewModal } from '../products/ReviewModal'
import {
  ProductsNetworkError,
  ProductsRequestError,
  type Product,
  type ProductReview,
} from '../products/types'
import './ProductsPage.css'

function readLoadError(error: unknown, fallback: string): string {
  if (error instanceof ProductsNetworkError || error instanceof ProductsRequestError) {
    return error.message
  }

  return fallback
}

export function ProductsPage() {
  const { session } = useAuth()
  const searchId = useId()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [initialError, setInitialError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [reviewOverrides, setReviewOverrides] = useState<Record<number, ProductReview[]>>({})
  const [reviewProductId, setReviewProductId] = useState<number | null>(null)

  const isSearchMode = activeQuery.length > 0

  useEffect(() => {
    document.title = 'MyShop — Products'
  }, [])

  const loadPage = useCallback(async (skip: number, mode: 'initial' | 'more') => {
    if (mode === 'initial') {
      setIsInitialLoading(true)
      setInitialError('')
    } else {
      setIsLoadingMore(true)
      setLoadMoreError('')
    }

    try {
      const page = await fetchProductPage(skip)
      const loadedCount = skip + page.products.length
      const moreRemain = loadedCount < page.total

      setTotal(page.total)
      setNextSkip(loadedCount)
      setHasMore(moreRemain)
      setProducts((current) => (mode === 'more' ? [...current, ...page.products] : page.products))
    } catch (error) {
      const message = readLoadError(error, 'Unable to load products. Please try again.')
      if (mode === 'more') {
        setLoadMoreError(message)
      } else {
        setInitialError(message)
        setProducts([])
        setTotal(0)
        setNextSkip(0)
        setHasMore(false)
      }
    } finally {
      if (mode === 'initial') {
        setIsInitialLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadPage(0, 'initial')
  }, [loadPage])

  useEffect(() => {
    const query = searchInput.trim()

    if (!query) {
      setActiveQuery('')
      setSearchResults([])
      setSearchTotal(0)
      setSearchError('')
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setActiveQuery(query)
      setIsSearching(true)
      setSearchError('')

      void searchProducts(query, controller.signal)
        .then((page) => {
          if (controller.signal.aborted) {
            return
          }

          setSearchResults(page.products)
          setSearchTotal(page.total)
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return
          }

          setSearchResults([])
          setSearchTotal(0)
          setSearchError(readLoadError(error, 'Unable to search products. Please try again.'))
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false)
          }
        })
    }, 400)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [searchInput])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchInput(searchInput.trim())
  }

  const visibleProducts = useMemo(() => {
    const source = isSearchMode ? searchResults : products
    return source.map((product) =>
      reviewOverrides[product.id] ? { ...product, reviews: reviewOverrides[product.id] } : product,
    )
  }, [isSearchMode, products, reviewOverrides, searchResults])

  const reviewProduct = useMemo(() => {
    if (reviewProductId === null) {
      return null
    }

    const found =
      visibleProducts.find((product) => product.id === reviewProductId) ??
      products.find((product) => product.id === reviewProductId) ??
      searchResults.find((product) => product.id === reviewProductId)

    if (!found) {
      return null
    }

    return reviewOverrides[found.id] ? { ...found, reviews: reviewOverrides[found.id] } : found
  }, [products, reviewOverrides, reviewProductId, searchResults, visibleProducts])

  const showingLabel = isSearchMode
    ? !isSearching && !searchError
      ? `Showing ${searchResults.length} of ${searchTotal} products`
      : null
    : !isInitialLoading && !initialError
      ? `Showing ${products.length} of ${total} products`
      : null

  return (
    <>
    <main className="app-main products-page" aria-busy={isInitialLoading || isLoadingMore || isSearching}>
      <div className="products-heading">
        <div>
          <h1>All Products</h1>
          {showingLabel ? (
            <p className="products-count" aria-live="polite">
              {showingLabel}
            </p>
          ) : null}
        </div>

        <form className="products-search" role="search" onSubmit={handleSearchSubmit}>
          <label className="visually-hidden" htmlFor={searchId}>
            Search products
          </label>
          <input
            id={searchId}
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products"
            autoComplete="off"
          />
          <button type="submit" aria-label="Search products">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>

      {isSearchMode ? (
        <>
          {isSearching ? (
            <p className="products-status" role="status">
              Searching products…
            </p>
          ) : null}

          {searchError ? (
            <div className="products-error" role="alert">
              <p>{searchError} Your previous product list is still available when you clear search.</p>
            </div>
          ) : null}

          {!isSearching && !searchError && searchResults.length === 0 ? (
            <p className="products-status" role="status">
              No products match “{activeQuery}”.
            </p>
          ) : null}
        </>
      ) : (
        <>
          {isInitialLoading ? (
            <p className="products-status" role="status">
              Loading products…
            </p>
          ) : null}

          {initialError ? (
            <div className="products-error" role="alert">
              <p>{initialError}</p>
              <button type="button" className="products-retry" onClick={() => void loadPage(0, 'initial')}>
                Try again
              </button>
            </div>
          ) : null}

          {!isInitialLoading && !initialError && products.length === 0 ? (
            <p className="products-status" role="status">
              No products are available right now.
            </p>
          ) : null}
        </>
      )}

      {visibleProducts.length > 0 && !(isSearchMode && searchError) ? (
        <ul className="product-list">
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onOpenReviews={(next) => setReviewProductId(next.id)} />
            </li>
          ))}
        </ul>
      ) : null}

      {!isSearchMode && loadMoreError ? (
        <p className="products-error" role="alert">
          {loadMoreError} Already loaded products are still available.
        </p>
      ) : null}

      {!isSearchMode && hasMore && !isInitialLoading && !initialError ? (
        <div className="products-more">
          <button
            type="button"
            className="products-load-more"
            onClick={() => void loadPage(nextSkip, 'more')}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading more…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {!isSearchMode && !hasMore && products.length > 0 ? (
        <p className="products-end" role="status">
          All products loaded.
        </p>
      ) : null}
    </main>

      {reviewProduct && session ? (
        <ReviewModal
          product={reviewProduct}
          userId={session.id}
          reviewerName={
            [session.firstName, session.lastName].filter(Boolean).join(' ') ||
            session.username ||
            'You'
          }
          onClose={() => setReviewProductId(null)}
          onReviewAdded={(productId, review) => {
            setReviewOverrides((current) => {
              const existing = current[productId] ?? reviewProduct.reviews
              return { ...current, [productId]: [...existing, review] }
            })
          }}
        />
      ) : null}
    </>
  )
}
