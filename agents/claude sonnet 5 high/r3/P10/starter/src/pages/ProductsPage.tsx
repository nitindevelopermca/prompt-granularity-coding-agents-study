import { useEffect, useState, type FormEvent } from 'react'
import AppShell from '../components/AppShell'
import ProductCard from '../components/ProductCard'
import ReviewModal from '../components/ReviewModal'
import { useAuth } from '../context/AuthContext'
import { fetchProducts, ProductsApiError, searchProducts } from '../lib/productsApi'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import type { Product, ProductReview } from '../types/product'

const PAGE_LIMIT = 10

export default function ProductsPage() {
  useDocumentMeta(
    'Products – MyShop',
    'Browse the MyShop product catalog and add your favorite items to your cart.',
  )

  const { user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [activeReviewProductId, setActiveReviewProductId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setInitialLoading(true)
    setInitialError(null)
    fetchProducts(PAGE_LIMIT, 0)
      .then((res) => {
        if (cancelled) return
        setProducts(res.products)
        setTotal(res.total)
        setLoadedCount(res.products.length)
      })
      .catch((err) => {
        if (cancelled) return
        setInitialError(
          err instanceof ProductsApiError ? err.message : 'Failed to load products. Please try again.',
        )
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hasMore = loadedCount < total

  async function handleLoadMore() {
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const res = await fetchProducts(PAGE_LIMIT, loadedCount)
      setProducts((prev) => [...prev, ...res.products])
      setTotal(res.total)
      setLoadedCount((prev) => prev + res.products.length)
    } catch (err) {
      // Keep already loaded products on load-more failure.
      setLoadMoreError(
        err instanceof ProductsApiError ? err.message : 'Failed to load more products. Please try again.',
      )
    } finally {
      setLoadingMore(false)
    }
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value)
    if (value.trim() === '') {
      // Empty query returns to the paginated catalog without destroying it.
      setSearchQuery('')
      setSearchResults(null)
      setSearchError(null)
    }
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setSearchQuery('')
      setSearchResults(null)
      setSearchError(null)
      return
    }
    setSearchQuery(trimmed)
    setSearchLoading(true)
    setSearchError(null)
    try {
      const res = await searchProducts(trimmed)
      setSearchResults(res.products)
    } catch (err) {
      setSearchResults(null)
      setSearchError(err instanceof ProductsApiError ? err.message : 'Search failed. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  function handleCommentAdded(productId: number, review: ProductReview) {
    const updateList = (list: Product[]) =>
      list.map((p) => (p.id === productId ? { ...p, reviews: [review, ...(p.reviews ?? [])] } : p))
    setProducts((prev) => updateList(prev))
    setSearchResults((prev) => (prev ? updateList(prev) : prev))
  }

  const isSearchActive = searchQuery.trim() !== ''
  const displayedProducts = isSearchActive ? searchResults ?? [] : products

  const activeReviewProduct =
    products.find((p) => p.id === activeReviewProductId) ??
    searchResults?.find((p) => p.id === activeReviewProductId) ??
    null

  return (
    <AppShell>
      <div className="products-page-header">
        <div>
          <h1>All Products</h1>
          <p className="products-count">
            {isSearchActive
              ? searchLoading
                ? 'Searching…'
                : `Showing ${displayedProducts.length} result${displayedProducts.length === 1 ? '' : 's'} for "${searchQuery}"`
              : `Showing ${products.length} of ${total} products`}
          </p>
        </div>

        <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            placeholder="Search products"
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
          />
          <button type="submit" aria-label="Search products">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>

      {isSearchActive && searchError && (
        <p className="form-alert" role="alert">
          {searchError}
        </p>
      )}

      {!isSearchActive && initialLoading && <p role="status">Loading products…</p>}
      {!isSearchActive && initialError && (
        <p className="form-alert" role="alert">
          {initialError}
        </p>
      )}
      {!isSearchActive && !initialLoading && !initialError && products.length === 0 && <p>No products found.</p>}

      {isSearchActive && searchLoading && <p role="status">Searching…</p>}
      {isSearchActive && !searchLoading && !searchError && displayedProducts.length === 0 && (
        <p>No products match &quot;{searchQuery}&quot;.</p>
      )}

      {displayedProducts.length > 0 && (
        <div className="product-grid">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onOpenReviews={(p) => setActiveReviewProductId(p.id)} />
          ))}
        </div>
      )}

      {!isSearchActive && (
        <div className="load-more-row">
          {loadMoreError && (
            <p className="form-alert" role="alert">
              {loadMoreError}
            </p>
          )}
          {!initialLoading && !initialError && hasMore && (
            <button type="button" className="load-more-button" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
          {!initialLoading && !hasMore && products.length > 0 && (
            <p className="end-of-list">You&apos;ve reached the end of the catalog.</p>
          )}
        </div>
      )}

      {activeReviewProduct && (
        <ReviewModal
          product={activeReviewProduct}
          userId={user?.id ?? null}
          onClose={() => setActiveReviewProductId(null)}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </AppShell>
  )
}
