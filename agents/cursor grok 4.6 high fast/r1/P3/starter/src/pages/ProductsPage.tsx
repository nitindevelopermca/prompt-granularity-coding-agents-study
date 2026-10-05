import { useEffect, useId, useState, type FormEvent } from 'react'
import { fetchProductPage, ProductsRequestError, searchProducts } from '../api/products'
import { useAuth } from '../auth/AuthContext'
import { ProductCard } from '../components/ProductCard'
import { SearchIcon } from '../components/Icons'
import { ReviewModal } from '../components/ReviewModal'
import type { Product, ProductReview } from '../types/product'
import './ProductsPage.css'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ProductsRequestError) {
    return error.message
  }
  return fallback
}

function replaceReviews(list: Product[], productId: number, reviews: ProductReview[]): Product[] {
  return list.map((product) => (product.id === productId ? { ...product, reviews } : product))
}

export function ProductsPage() {
  const { session } = useAuth()
  const searchId = useId()
  const userId = session?.id ?? 0

  const [catalog, setCatalog] = useState<Product[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadMoreStatus, setLoadMoreStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHits, setSearchHits] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)

  const isSearch = searchQuery.length > 0
  const visibleProducts = isSearch ? searchHits : catalog
  const visibleTotal = isSearch ? searchTotal : catalogTotal
  const isBusy = isSearch ? searchStatus === 'loading' : catalogStatus === 'loading' || loadMoreStatus === 'loading'
  const hasMore = !isSearch && catalogStatus === 'ready' && catalog.length < catalogTotal
  const reviewProduct =
    catalog.find((product) => product.id === reviewProductId) ??
    searchHits.find((product) => product.id === reviewProductId) ??
    null

  useEffect(() => {
    document.title = 'Products · MyShop'
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFirstPage() {
      setCatalogStatus('loading')
      setCatalogError(null)
      try {
        const result = await fetchProductPage(0, controller.signal)
        setCatalog(result.products)
        setCatalogTotal(result.total)
        setCatalogStatus('ready')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setCatalogStatus('error')
        setCatalogError(errorMessage(error, 'Unable to load products. Please try again.'))
      }
    }

    void loadFirstPage()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setSearchQuery('')
      return
    }
    const timer = window.setTimeout(() => {
      setSearchQuery(trimmed)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!searchQuery) {
      setSearchStatus('idle')
      setSearchError(null)
      return
    }

    const controller = new AbortController()

    async function loadSearch() {
      setSearchStatus('loading')
      setSearchError(null)
      setSearchHits([])
      setSearchTotal(0)
      try {
        const result = await searchProducts(searchQuery, controller.signal)
        setSearchHits(result.products)
        setSearchTotal(result.total)
        setSearchStatus('ready')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setSearchStatus('error')
        setSearchError(errorMessage(error, 'Unable to search products. Please try again.'))
      }
    }

    void loadSearch()
    return () => controller.abort()
  }, [searchQuery])

  async function loadMore() {
    if (loadMoreStatus === 'loading' || catalog.length >= catalogTotal) {
      return
    }
    setLoadMoreStatus('loading')
    setLoadMoreError(null)
    try {
      const result = await fetchProductPage(catalog.length)
      if (result.products.length === 0) {
        setCatalogTotal(catalog.length)
      } else {
        setCatalog((current) => [...current, ...result.products])
        setCatalogTotal(result.total)
      }
      setLoadMoreStatus('idle')
    } catch (error) {
      setLoadMoreStatus('error')
      setLoadMoreError(errorMessage(error, 'Unable to load more products. Please try again.'))
    }
  }

  async function retryCatalog() {
    setCatalogStatus('loading')
    setCatalogError(null)
    try {
      const result = await fetchProductPage(0)
      setCatalog(result.products)
      setCatalogTotal(result.total)
      setCatalogStatus('ready')
    } catch (error) {
      setCatalogStatus('error')
      setCatalogError(errorMessage(error, 'Unable to load products. Please try again.'))
    }
  }

  async function retrySearch() {
    if (!searchQuery) {
      return
    }
    setSearchStatus('loading')
    setSearchError(null)
    try {
      const result = await searchProducts(searchQuery)
      setSearchHits(result.products)
      setSearchTotal(result.total)
      setSearchStatus('ready')
    } catch (error) {
      setSearchStatus('error')
      setSearchError(errorMessage(error, 'Unable to search products. Please try again.'))
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  function handleReviewsChange(productId: number, reviews: ProductReview[]) {
    setCatalog((current) => replaceReviews(current, productId, reviews))
    setSearchHits((current) => replaceReviews(current, productId, reviews))
  }

  function showingText(): string {
    if (isSearch && searchStatus === 'loading') {
      return 'Searching products…'
    }
    if (!isSearch && catalogStatus === 'loading') {
      return 'Loading products…'
    }
    return `Showing ${visibleProducts.length} of ${visibleTotal} products`
  }

  return (
    <section className="products-page" aria-labelledby="products-heading" aria-busy={isBusy}>
      <div className="products-toolbar">
        <div>
          <h1 id="products-heading">All Products</h1>
          <p className="products-count" aria-live="polite">
            {showingText()}
          </p>
        </div>

        <form className="products-search" role="search" onSubmit={handleSearchSubmit}>
          <label className="visually-hidden" htmlFor={searchId}>
            Search products
          </label>
          <input
            id={searchId}
            type="search"
            value={searchInput}
            placeholder="Search products"
            autoComplete="off"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" aria-label="Search">
            <SearchIcon />
          </button>
        </form>
      </div>

      {isSearch && searchStatus === 'error' ? (
        <div className="products-status" role="alert">
          <p>{searchError}</p>
          <button type="button" className="products-retry" onClick={() => void retrySearch()}>
            Try again
          </button>
        </div>
      ) : null}

      {!isSearch && catalogStatus === 'error' && catalog.length === 0 ? (
        <div className="products-status" role="alert">
          <p>{catalogError}</p>
          <button type="button" className="products-retry" onClick={() => void retryCatalog()}>
            Try again
          </button>
        </div>
      ) : null}

      {isSearch && searchStatus === 'ready' && searchHits.length === 0 ? (
        <p className="products-status" role="status">
          No products match your search.
        </p>
      ) : null}

      {!isSearch && catalogStatus === 'ready' && catalog.length === 0 ? (
        <p className="products-status" role="status">
          No products to display.
        </p>
      ) : null}

      {visibleProducts.length > 0 ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenReviews={() => setReviewProductId(product.id)}
            />
          ))}
        </div>
      ) : null}

      {loadMoreError ? (
        <p className="products-status" role="alert">
          {loadMoreError}
        </p>
      ) : null}

      {hasMore ? (
        <div className="products-load-more">
          <button
            type="button"
            className="products-load-more-button"
            onClick={() => void loadMore()}
            disabled={loadMoreStatus === 'loading'}
          >
            {loadMoreStatus === 'loading' ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      <ReviewModal
        product={session ? reviewProduct : null}
        userId={userId}
        onClose={() => setReviewProductId(null)}
        onReviewsChange={handleReviewsChange}
      />
    </section>
  )
}
