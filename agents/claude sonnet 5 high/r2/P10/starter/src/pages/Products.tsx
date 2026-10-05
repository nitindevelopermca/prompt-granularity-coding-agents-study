import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product, Review } from '../types'
import { fetchProducts, searchProducts, addToCart, ApiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import ReviewModal from '../components/ReviewModal'

const PAGE_SIZE = 10

export default function ProductsPage() {
  const { user } = useAuth()
  const { addItem } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [reviewProduct, setReviewProduct] = useState<Product | null>(null)
  const [cartStates, setCartStates] = useState<Record<number, 'idle' | 'loading' | 'error'>>({})
  const [cartMessage, setCartMessage] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadFirstPage = useCallback(async () => {
    setInitialLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProducts(PAGE_SIZE, 0)
      setProducts(data.products)
      setTotal(data.total)
      setSkip(data.skip)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load products.'
      setLoadError(message)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    setLoadError(null)
    const nextSkip = skip + PAGE_SIZE
    try {
      const data = await fetchProducts(PAGE_SIZE, nextSkip)
      setProducts((prev) => [...prev, ...data.products])
      setTotal(data.total)
      setSkip(data.skip)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load more products.'
      setLoadError(message)
    } finally {
      setLoadingMore(false)
    }
  }

  const runSearch = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim()
    if (!trimmed) {
      setSearchResults(null)
      setSearchError(null)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    setSearchError(null)
    try {
      const data = await searchProducts(trimmed)
      setSearchResults(data.products)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Search failed. Please try again.'
      setSearchError(message)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (!value.trim()) {
      setSearchResults(null)
      setSearchError(null)
      setSearchLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      runSearch(value)
    }, 400)
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    runSearch(query)
  }

  const isSearching = query.trim().length > 0
  const displayedProducts = isSearching ? searchResults ?? [] : products
  const hasMore = skip + products.length < total

  const updateProductReviews = (productId: number, review: Review) => {
    const updater = (list: Product[]) =>
      list.map((p) => (p.id === productId ? { ...p, reviews: [...p.reviews, review] } : p))
    setProducts(updater)
    setSearchResults((prev) => (prev ? updater(prev) : prev))
    setReviewProduct((prev) => (prev && prev.id === productId ? { ...prev, reviews: [...prev.reviews, review] } : prev))
  }

  const handleAddToCart = async (product: Product) => {
    if (!user) return
    setCartStates((prev) => ({ ...prev, [product.id]: 'loading' }))
    setCartMessage(null)
    try {
      await addToCart(user.id, product.id, 1)
      addItem(product, 1)
      setCartStates((prev) => ({ ...prev, [product.id]: 'idle' }))
      setCartMessage(`${product.title} added to cart.`)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add item to cart.'
      setCartStates((prev) => ({ ...prev, [product.id]: 'error' }))
      setCartMessage(message)
    }
  }

  return (
    <main className="products-page">
      <h1 className="products-page__heading">All Products</h1>
      <p className="products-page__count" aria-live="polite">
        Showing {displayedProducts.length}
        {!isSearching && total > 0 ? ` of ${total}` : ''} products
      </p>

      <form className="products-page__search" role="search" onSubmit={handleSearchSubmit}>
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          placeholder="Search products…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {cartMessage && (
        <p role="status" className="products-page__cart-message">
          {cartMessage}
        </p>
      )}

      {isSearching ? (
        <>
          {searchLoading && <p role="status">Searching…</p>}
          {searchError && (
            <p role="alert" className="products-page__error">
              {searchError}
            </p>
          )}
          {!searchLoading && !searchError && searchResults && searchResults.length === 0 && (
            <p className="products-page__empty">No products match “{query.trim()}”.</p>
          )}
        </>
      ) : (
        <>
          {initialLoading && <p role="status">Loading products…</p>}
          {loadError && !initialLoading && (
            <p role="alert" className="products-page__error">
              {loadError}
            </p>
          )}
          {!initialLoading && !loadError && products.length === 0 && (
            <p className="products-page__empty">No products available right now.</p>
          )}
        </>
      )}

      {displayedProducts.length > 0 && (
        <ul className="products-page__grid">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onOpenReviews={setReviewProduct}
              addToCartState={cartStates[product.id] ?? 'idle'}
            />
          ))}
        </ul>
      )}

      {!isSearching && !initialLoading && products.length > 0 && (
        <div className="products-page__load-more">
          {hasMore ? (
            <button type="button" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : (
            <p className="products-page__end">You’ve reached the end of the catalog.</p>
          )}
        </div>
      )}

      {reviewProduct && (
        <ReviewModal
          product={reviewProduct}
          onClose={() => setReviewProduct(null)}
          onReviewAdded={updateProductReviews}
        />
      )}
    </main>
  )
}
