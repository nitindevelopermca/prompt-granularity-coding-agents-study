import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Product } from '../types'
import { fetchProducts, searchProducts } from '../lib/products'
import { addComment } from '../lib/comments'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { ProductCard } from '../components/ProductCard'
import { ReviewModal } from '../components/ReviewModal'
import { SearchIcon } from '../components/icons'

const PAGE_SIZE = 10

export function ProductsPage() {
  useDocumentMeta(
    'All Products – MyShop',
    'Browse the MyShop catalog: search products, compare prices and ratings, and add items to your cart.',
  )

  const { user } = useAuth()
  const { addToCart } = useCart()

  // Paginated catalog state.
  const [catalog, setCatalog] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  // Search state (kept separate so clearing the query restores the catalog
  // without re-fetching or discarding loaded catalog state).
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 400)
  const [committedQuery, setCommittedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const searchRequestId = useRef(0)

  const isSearchMode = committedQuery.length > 0

  // Debounced typing commits the query automatically; submitting the form
  // commits immediately without waiting for the debounce timer.
  useEffect(() => {
    setCommittedQuery(debouncedSearch)
  }, [debouncedSearch])

  const loadInitialProducts = useCallback(async () => {
    setIsInitialLoading(true)
    setCatalogError(null)
    try {
      const data = await fetchProducts(PAGE_SIZE, 0)
      setCatalog(data.products)
      setTotal(data.total)
      setSkip(0)
    } catch (error) {
      setCatalogError(
        error instanceof Error ? error.message : 'Could not load products. Please try again.',
      )
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialProducts()
  }, [loadInitialProducts])

  async function handleLoadMore() {
    setIsLoadingMore(true)
    setLoadMoreError(null)
    const nextSkip = skip + PAGE_SIZE
    try {
      const data = await fetchProducts(PAGE_SIZE, nextSkip)
      setCatalog((prev) => [...prev, ...data.products])
      setTotal(data.total)
      setSkip(nextSkip)
    } catch (error) {
      // Keep already loaded products; only surface the load-more error.
      setLoadMoreError(
        error instanceof Error ? error.message : 'Could not load more products. Please try again.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    const requestId = ++searchRequestId.current

    if (committedQuery.length === 0) {
      setSearchResults([])
      setSearchError(null)
      setHasSearched(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    searchProducts(committedQuery)
      .then((data) => {
        if (searchRequestId.current !== requestId) return
        setSearchResults(data.products)
        setHasSearched(true)
      })
      .catch((error: unknown) => {
        if (searchRequestId.current !== requestId) return
        setSearchError(
          error instanceof Error ? error.message : 'Search failed. Please try again.',
        )
        setHasSearched(true)
      })
      .finally(() => {
        if (searchRequestId.current !== requestId) return
        setIsSearching(false)
      })
  }, [committedQuery])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Commit immediately instead of waiting for the debounce timer.
    setCommittedQuery(searchInput.trim())
  }

  const displayedProducts = isSearchMode ? searchResults : catalog
  const hasMore = !isSearchMode && skip + catalog.length < total

  function updateProductInState(updated: Product) {
    setCatalog((prev) => prev.map((product) => (product.id === updated.id ? updated : product)))
    setSearchResults((prev) => prev.map((product) => (product.id === updated.id ? updated : product)))
    setActiveProduct(updated)
  }

  async function handleAddComment(body: string, rating: number | null) {
    if (!activeProduct || !user) {
      throw new Error('You must be logged in to comment.')
    }
    const response = await addComment(body, activeProduct.id, user.id)
    const newReview = {
      reviewerName: user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.username,
      rating: rating ?? 5,
      comment: response.body,
      date: new Date().toISOString(),
      reviewerEmail: undefined,
    }
    const updatedProduct: Product = {
      ...activeProduct,
      reviews: [newReview, ...activeProduct.reviews],
    }
    updateProductInState(updatedProduct)
  }

  return (
    <div className="products-page">
      <div className="products-page__toolbar">
        <div>
          <h1 className="products-page__heading">All Products</h1>
          <p className="products-page__count">
            {isSearchMode
              ? `Showing ${displayedProducts.length} result${displayedProducts.length === 1 ? '' : 's'} for "${committedQuery}"`
              : `Showing ${catalog.length} of ${total} products`}
          </p>
        </div>

        <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className="visually-hidden">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            className="search-form__input"
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="search-form__button" aria-label="Search">
            <SearchIcon />
          </button>
        </form>
      </div>

      <h2 className="visually-hidden">Product list</h2>

      {isSearchMode && isSearching && <p className="status-text">Searching…</p>}
      {isSearchMode && searchError && (
        <p className="field-error field-error--banner" role="alert">
          {searchError}
        </p>
      )}
      {isSearchMode && !isSearching && !searchError && hasSearched && searchResults.length === 0 && (
        <p className="status-text">No products match "{committedQuery}".</p>
      )}

      {!isSearchMode && isInitialLoading && <p className="status-text">Loading products…</p>}
      {!isSearchMode && catalogError && (
        <div className="field-error field-error--banner" role="alert">
          <p>{catalogError}</p>
          <button type="button" className="btn btn-secondary" onClick={loadInitialProducts}>
            Retry
          </button>
        </div>
      )}
      {!isSearchMode && !isInitialLoading && !catalogError && catalog.length === 0 && (
        <p className="status-text">No products are available right now.</p>
      )}

      {displayedProducts.length > 0 && (
        <div className="product-grid">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenReviews={setActiveProduct}
              onAddToCart={(p) => addToCart(p, 1)}
            />
          ))}
        </div>
      )}

      {!isSearchMode && !isInitialLoading && !catalogError && (
        <div className="products-page__load-more">
          {loadMoreError && (
            <p className="field-error" role="alert">
              {loadMoreError}
            </p>
          )}
          {hasMore ? (
            <button type="button" className="btn btn-outline" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            catalog.length > 0 && <p className="status-text">You've reached the end of the catalog.</p>
          )}
        </div>
      )}

      <ReviewModal
        isOpen={activeProduct !== null}
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAddComment={handleAddComment}
      />
    </div>
  )
}
