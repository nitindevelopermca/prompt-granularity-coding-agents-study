import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchProducts, searchProducts } from '../api/products'
import { toErrorMessage } from '../api/errors'
import type { Product, Review } from '../types'
import { useCart } from '../context/CartContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { ProductCard } from '../components/ProductCard'
import { SearchIcon } from '../components/icons'
import './ProductsPage.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

export function ProductsPage() {
  usePageMeta(
    'All Products — MyShop',
    'Browse the full MyShop catalog: search products, view details, read reviews, and add items to your cart.',
  )

  const { error: cartError, clearError: clearCartError } = useCart()

  // Catalog (lazy-loaded) state
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  // Search state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const debounceRef = useRef<number | null>(null)
  const searchRequestId = useRef(0)

  // Initial page load
  useEffect(() => {
    let cancelled = false
    setInitialLoading(true)
    setLoadError(null)
    fetchProducts(PAGE_SIZE, 0)
      .then((data) => {
        if (cancelled) return
        setCatalogProducts(data.products)
        setTotal(data.total)
        setSkip(data.products.length)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(toErrorMessage(error, 'Failed to load products. Please try again.'))
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hasMore = skip < total

  async function handleLoadMore() {
    setLoadMoreLoading(true)
    setLoadMoreError(null)
    try {
      const data = await fetchProducts(PAGE_SIZE, skip)
      setCatalogProducts((prev) => [...prev, ...data.products])
      setTotal(data.total)
      setSkip((prevSkip) => prevSkip + data.products.length)
    } catch (error) {
      // Keep already-loaded products on load-more failure.
      setLoadMoreError(toErrorMessage(error, 'Failed to load more products. Please try again.'))
    } finally {
      setLoadMoreLoading(false)
    }
  }

  const runSearch = useCallback((rawQuery: string) => {
    const trimmed = rawQuery.trim()
    if (!trimmed) {
      setSearchResults(null)
      setSearchError(null)
      setSearchLoading(false)
      return
    }

    const requestId = ++searchRequestId.current
    setSearchLoading(true)
    setSearchError(null)
    searchProducts(trimmed)
      .then((data) => {
        if (searchRequestId.current !== requestId) return
        setSearchResults(data.products)
      })
      .catch((error: unknown) => {
        if (searchRequestId.current !== requestId) return
        setSearchError(toErrorMessage(error, 'Search failed. Please try again.'))
        setSearchResults([])
      })
      .finally(() => {
        if (searchRequestId.current === requestId) setSearchLoading(false)
      })
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
    }
    if (!value.trim()) {
      // Empty query returns to the paginated catalog immediately — no API call.
      searchRequestId.current += 1
      setSearchResults(null)
      setSearchError(null)
      setSearchLoading(false)
      return
    }
    debounceRef.current = window.setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
    }
    runSearch(query)
  }

  function updateProductReviews(productId: number, review: Review) {
    setCatalogProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product)),
    )
    setSearchResults((prev) =>
      prev ? prev.map((product) => (product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product)) : prev,
    )
  }

  const isSearchMode = searchResults !== null
  const displayedProducts = isSearchMode ? searchResults : catalogProducts

  return (
    <main className="products-page">
      <div className="products-page__toolbar">
        <div>
          <h1 className="products-page__heading">All Products</h1>
          <p className="products-page__count">
            {isSearchMode
              ? searchLoading
                ? 'Searching…'
                : `${displayedProducts.length} result${displayedProducts.length === 1 ? '' : 's'} for “${query.trim()}”`
              : `Showing ${catalogProducts.length} of ${total || catalogProducts.length} products`}
          </p>
        </div>

        <form className="products-page__search" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className="visually-hidden">
            Search products
          </label>
          <div className="products-page__search-field">
            <SearchIcon className="products-page__search-icon" />
            <input
              id="product-search"
              type="search"
              placeholder="Search products"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
            />
          </div>
          <button type="submit" className="products-page__search-btn" aria-label="Search">
            <SearchIcon />
          </button>
        </form>
      </div>

      {cartError && (
        <div className="products-page__banner products-page__banner--error" role="alert">
          <span>{cartError}</span>
          <button type="button" onClick={clearCartError} aria-label="Dismiss cart error">
            Dismiss
          </button>
        </div>
      )}

      {initialLoading && !isSearchMode && (
        <p className="products-page__status" role="status">
          Loading products…
        </p>
      )}

      {!initialLoading && loadError && !isSearchMode && (
        <div className="products-page__banner products-page__banner--error" role="alert">
          {loadError}
        </div>
      )}

      {isSearchMode && searchError && (
        <div className="products-page__banner products-page__banner--error" role="alert">
          {searchError}
        </div>
      )}

      {isSearchMode && !searchLoading && !searchError && displayedProducts.length === 0 && (
        <p className="products-page__status" role="status">
          No products match “{query.trim()}”.
        </p>
      )}

      {!initialLoading && !isSearchMode && !loadError && displayedProducts.length === 0 && (
        <p className="products-page__status" role="status">
          No products are available right now.
        </p>
      )}

      {displayedProducts.length > 0 && (
        <ul className="products-page__grid">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onReviewAdded={updateProductReviews} />
          ))}
        </ul>
      )}

      {!isSearchMode && !initialLoading && catalogProducts.length > 0 && (
        <div className="products-page__load-more">
          {loadMoreError && (
            <p className="products-page__load-error" role="alert">
              {loadMoreError}
            </p>
          )}
          {hasMore ? (
            <button type="button" className="products-page__load-btn" onClick={handleLoadMore} disabled={loadMoreLoading}>
              {loadMoreLoading ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            <p className="products-page__end" role="status">
              You’ve reached the end of the catalog.
            </p>
          )}
        </div>
      )}
    </main>
  )
}
