import { useEffect, useRef, useState, type FormEvent } from 'react'
import { errorMessage, fetchProductsPage, searchProducts } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { SearchIcon } from './icons'
import { ProductCard } from './ProductCard'
import { ReviewModal } from './ReviewModal'
import type { Product, ProductReview } from './types'

const SEARCH_DELAY_MS = 400

export function ProductsPage() {
  const { user } = useAuth()
  const { addProduct } = useCart()
  const [catalog, setCatalog] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [reviewProductId, setReviewProductId] = useState<number | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addErrors, setAddErrors] = useState<Record<number, string>>({})
  const searchRequest = useRef(0)

  const searching = committedQuery.length > 0
  const visibleProducts = searching ? searchResults : catalog
  const hasMore = !searching && skip + catalog.length < total

  useEffect(() => {
    const controller = new AbortController()
    setInitialLoading(true)
    setCatalogError('')
    fetchProductsPage(0, controller.signal)
      .then((response) => {
        setCatalog(response.products)
        setTotal(response.total)
        setSkip(response.skip)
      })
      .catch((error) => {
        const message = errorMessage(error, 'Unable to load products. Please try again.')
        if (message) setCatalogError(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitialLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setCommittedQuery('')
      setSearchResults([])
      setSearchTotal(0)
      setSearchError('')
      setSearchLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void runSearch(trimmed, controller.signal)
    }, SEARCH_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  async function runSearch(term: string, signal?: AbortSignal) {
    const requestId = ++searchRequest.current
    setSearchLoading(true)
    setSearchError('')
    setCommittedQuery(term)
    try {
      const response = await searchProducts(term, signal)
      if (requestId !== searchRequest.current) return
      setSearchResults(response.products)
      setSearchTotal(response.total)
    } catch (error) {
      if (signal?.aborted) return
      const message = errorMessage(error, 'Unable to search products. Please try again.')
      if (message) setSearchError(message)
    } finally {
      if (requestId === searchRequest.current) setSearchLoading(false)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      setCommittedQuery('')
      setSearchResults([])
      setSearchTotal(0)
      setSearchError('')
      return
    }
    void runSearch(trimmed)
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    setLoadMoreError('')
    const nextSkip = skip + 10
    try {
      const response = await fetchProductsPage(nextSkip)
      setCatalog((current) => mergeProducts(current, response.products))
      setTotal(response.total)
      setSkip(response.skip)
    } catch (error) {
      setLoadMoreError(errorMessage(error, 'Unable to load more products. Please try again.'))
    } finally {
      setLoadingMore(false)
    }
  }

  function updateProductReviews(productId: number, review: ProductReview) {
    const append = (items: Product[]) =>
      items.map((item) =>
        item.id === productId ? { ...item, reviews: [...item.reviews, review] } : item,
      )
    setCatalog((current) => append(current))
    setSearchResults((current) => append(current))
  }

  async function handleAddToCart(product: Product) {
    if (!user) return
    setAddingId(product.id)
    setAddErrors((current) => {
      const next = { ...current }
      delete next[product.id]
      return next
    })
    try {
      await addProduct(user.id, product, 1)
    } catch (error) {
      setAddErrors((current) => ({
        ...current,
        [product.id]: errorMessage(error, 'Unable to add this item to your cart.'),
      }))
    } finally {
      setAddingId(null)
    }
  }

  const reviewProduct =
    reviewProductId === null
      ? null
      : visibleProducts.find((item) => item.id === reviewProductId) ??
        catalog.find((item) => item.id === reviewProductId) ??
        searchResults.find((item) => item.id === reviewProductId) ??
        null

  const showingCount = searching ? searchResults.length : catalog.length
  const showingTotal = searching ? searchTotal : total

  return (
    <main className="page-main">
      <div className="listing-header">
        <div>
          <h1>All Products</h1>
          <p className="muted" aria-live="polite">
            {`Showing ${showingCount} of ${showingTotal} products`}
          </p>
        </div>
        <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
          <label className="visually-hidden" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            placeholder="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="icon-button search-submit" aria-label="Search">
            <SearchIcon className="icon-sm" />
          </button>
        </form>
      </div>

      {initialLoading && !searching ? <p role="status">Loading products…</p> : null}
      {searchLoading ? <p role="status">Searching products…</p> : null}

      {catalogError && !searching ? (
        <p className="form-error" role="alert">
          {catalogError}
        </p>
      ) : null}
      {searchError ? (
        <p className="form-error" role="alert">
          {searchError}
        </p>
      ) : null}

      {!initialLoading && !searching && catalog.length === 0 && !catalogError ? (
        <p role="status">No products are available right now.</p>
      ) : null}
      {searching && !searchLoading && searchResults.length === 0 && !searchError ? (
        <p role="status">No products match “{committedQuery}”.</p>
      ) : null}

      {visibleProducts.length > 0 ? (
        <section className="product-grid" aria-label="Product list">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              adding={addingId === product.id}
              addError={addErrors[product.id] ?? ''}
              onOpenReviews={() => setReviewProductId(product.id)}
              onAddToCart={() => void handleAddToCart(product)}
            />
          ))}
        </section>
      ) : null}

      {hasMore ? (
        <div className="load-more-wrap">
          <button
            type="button"
            className="button-outline"
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
      {loadMoreError ? (
        <p className="form-error centered" role="alert">
          {loadMoreError}
        </p>
      ) : null}

      <ReviewModal
        product={reviewProduct}
        onClose={() => setReviewProductId(null)}
        onCommentAdded={updateProductReviews}
      />
    </main>
  )
}

function mergeProducts(current: Product[], incoming: Product[]): Product[] {
  const seen = new Set(current.map((item) => item.id))
  const next = [...current]
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      next.push(item)
      seen.add(item.id)
    }
  }
  return next
}
