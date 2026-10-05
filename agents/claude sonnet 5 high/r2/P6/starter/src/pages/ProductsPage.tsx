import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { addComment, ApiError, fetchProducts, searchProducts } from '../api/dummyjson'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import ReviewModal from '../components/ReviewModal'
import type { Product, ProductReview } from '../types'
import styles from './ProductsPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

export default function ProductsPage() {
  const { user } = useAuth()
  const { addToCart, addingProductId, cartError, errorProductId } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'Products \u2014 MyShop'
  }, [])

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true)
    setInitialError(null)
    try {
      const page = await fetchProducts(PAGE_SIZE, 0)
      setProducts(page.products)
      setTotal(page.total)
    } catch (err) {
      setInitialError(err instanceof ApiError ? err.message : 'Unable to load products right now.')
    } finally {
      setLoadingInitial(false)
    }
  }, [])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const nextSkip = products.length
      const page = await fetchProducts(PAGE_SIZE, nextSkip)
      setProducts((prev) => [...prev, ...page.products])
      setTotal(page.total)
    } catch (err) {
      setLoadMoreError(err instanceof ApiError ? err.message : 'Unable to load more products right now.')
    } finally {
      setLoadingMore(false)
    }
  }

  const runSearch = useCallback(async (query: string) => {
    setSearchMode(true)
    setSearchLoading(true)
    setSearchError(null)
    try {
      const result = await searchProducts(query)
      setSearchResults(result.products)
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : 'Search failed. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const trimmed = searchQuery.trim()

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (!trimmed) {
      setSearchMode(false)
      setSearchResults(null)
      setSearchError(null)
      setSearchLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery, runSearch])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = searchQuery.trim()
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (!trimmed) {
      setSearchMode(false)
      setSearchResults(null)
      setSearchError(null)
      return
    }
    void runSearch(trimmed)
  }

  function updateProductReviews(productId: number, newReview: ProductReview) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, reviews: [...p.reviews, newReview] } : p)),
    )
    setSearchResults((prev) =>
      prev ? prev.map((p) => (p.id === productId ? { ...p, reviews: [...p.reviews, newReview] } : p)) : prev,
    )
  }

  async function handleAddComment(product: Product, body: string, rating: number | null) {
    if (!user) {
      throw new Error('You must be logged in to add a comment.')
    }
    await addComment({ body, postId: product.id, userId: user.id })
    const newReview: ProductReview = {
      reviewerName: user.username,
      rating: rating ?? 0,
      comment: body,
      date: new Date().toISOString(),
    }
    updateProductReviews(product.id, newReview)
  }

  const activeProduct = useMemo(() => {
    if (reviewProductId == null) return null
    return (
      products.find((p) => p.id === reviewProductId) ??
      searchResults?.find((p) => p.id === reviewProductId) ??
      null
    )
  }, [reviewProductId, products, searchResults])

  const displayedProducts = searchMode ? searchResults ?? [] : products
  const hasMore = !searchMode && products.length < total

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.heading}>All Products</h1>
        {!searchMode && (
          <p className={styles.showingCount} aria-live="polite">
            Showing {products.length} of {total || '\u2026'} products
          </p>
        )}
      </div>

      <div className={styles.searchRow}>
        <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
          <label htmlFor="product-search" className={styles.searchLabel}>
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            className={styles.searchInput}
            placeholder={'Search products by name\u2026'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="visually-hidden">
            Search
          </button>
        </form>
        {searchMode && !searchError && (
          <p className={styles.searchStatus} aria-live="polite">
            {searchLoading
              ? 'Searching\u2026'
              : `${searchResults?.length ?? 0} result${(searchResults?.length ?? 0) === 1 ? '' : 's'} for "${searchQuery.trim()}"`}
          </p>
        )}
      </div>

      {cartError && errorProductId == null && (
        <div className={`alert alert-error ${styles.errorBox}`} role="alert">
          {cartError}
        </div>
      )}

      {searchMode ? (
        <>
          {searchError && (
            <div className={`alert alert-error ${styles.errorBox}`} role="alert">
              {searchError}
              <div>
                <button
                  type="button"
                  className={`btn btn-secondary ${styles.retryButton}`}
                  onClick={() => void runSearch(searchQuery.trim())}
                >
                  Retry search
                </button>
              </div>
            </div>
          )}
          {!searchError && searchLoading && (
            <div className={styles.centerRow}>
              <span className="spinner spinner-dark" aria-hidden="true" />
              <span>{'Searching products\u2026'}</span>
            </div>
          )}
          {!searchError && !searchLoading && (searchResults?.length ?? 0) === 0 && (
            <p className={styles.emptyState}>No products match "{searchQuery.trim()}".</p>
          )}
          {!searchError && !searchLoading && (searchResults?.length ?? 0) > 0 && (
            <ul className={styles.grid}>
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdding={addingProductId === product.id}
                  addError={errorProductId === product.id ? cartError : null}
                  onAddToCart={addToCart}
                  onOpenReviews={(p) => setReviewProductId(p.id)}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {loadingInitial && (
            <div className={styles.centerRow}>
              <span className="spinner spinner-dark" aria-hidden="true" />
              <span>{'Loading products\u2026'}</span>
            </div>
          )}

          {!loadingInitial && initialError && (
            <div className={`alert alert-error ${styles.errorBox}`} role="alert">
              {initialError}
              <div>
                <button
                  type="button"
                  className={`btn btn-secondary ${styles.retryButton}`}
                  onClick={() => void loadInitial()}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loadingInitial && !initialError && products.length === 0 && (
            <p className={styles.emptyState}>No products are available right now.</p>
          )}

          {!loadingInitial && !initialError && products.length > 0 && (
            <>
              <ul className={styles.grid}>
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isAdding={addingProductId === product.id}
                    addError={errorProductId === product.id ? cartError : null}
                    onAddToCart={addToCart}
                    onOpenReviews={(p) => setReviewProductId(p.id)}
                  />
                ))}
              </ul>

              <div className={styles.footerRow}>
                {loadMoreError && (
                  <div className="alert alert-error" role="alert">
                    {loadMoreError}
                  </div>
                )}
                {hasMore ? (
                  <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loadingMore}>
                    {loadingMore && <span className="spinner spinner-dark" aria-hidden="true" />}
                    <span>{loadingMore ? 'Loading\u2026' : 'Load more'}</span>
                  </button>
                ) : (
                  <p className={styles.endOfList}>You've reached the end of the catalog.</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeProduct && (
        <ReviewModal
          productTitle={activeProduct.title}
          reviews={activeProduct.reviews}
          onClose={() => setReviewProductId(null)}
          onSubmit={(body, rating) => handleAddComment(activeProduct, body, rating)}
        />
      )}
    </div>
  )
}
