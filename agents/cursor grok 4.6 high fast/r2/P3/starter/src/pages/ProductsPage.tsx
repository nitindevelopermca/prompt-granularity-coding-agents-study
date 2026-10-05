import { useEffect, useId, useState, type FormEvent } from 'react'
import { fetchProductPage, PRODUCT_PAGE_SIZE, ProductsRequestError, searchProducts } from '../api/products'
import { ProductCard } from '../components/ProductCard'
import { ReviewModal } from '../components/ReviewModal'
import { SearchIcon } from '../components/Icons'
import type { Product, ProductReview } from '../types/product'
import './ProductsPage.css'

function appendReview(list: Product[], productId: number, review: ProductReview): Product[] {
  return list.map((product) =>
    product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product,
  )
}

export function ProductsPage() {
  const searchId = useId()

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [draftQuery, setDraftQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)

  const isSearchMode = activeQuery.length > 0
  const visibleProducts = isSearchMode ? (searchResults ?? []) : catalogProducts

  const reviewProduct =
    reviewProductId === null
      ? null
      : (catalogProducts.find((product) => product.id === reviewProductId) ??
        searchResults?.find((product) => product.id === reviewProductId) ??
        null)

  useEffect(() => {
    document.title = 'Products · MyShop'
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFirstPage() {
      setIsInitialLoading(true)
      setCatalogError(null)
      try {
        const page = await fetchProductPage(0, controller.signal)
        setCatalogProducts(page.products)
        setCatalogTotal(page.total)
        setNextSkip(PRODUCT_PAGE_SIZE)
        setHasMore(page.skip + page.products.length < page.total)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setCatalogProducts([])
        setCatalogTotal(0)
        setHasMore(false)
        setCatalogError(
          error instanceof ProductsRequestError
            ? error.message
            : 'Unable to load products. Please try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false)
        }
      }
    }

    void loadFirstPage()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const trimmed = draftQuery.trim()
    if (!trimmed) {
      setActiveQuery('')
      return
    }

    const timeoutId = window.setTimeout(() => {
      setActiveQuery(trimmed)
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [draftQuery])

  useEffect(() => {
    if (!activeQuery) {
      setSearchResults(null)
      setSearchTotal(0)
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()

    async function runSearch() {
      setIsSearching(true)
      setSearchError(null)
      setSearchResults(null)
      try {
        const page = await searchProducts(activeQuery, controller.signal)
        setSearchResults(page.products)
        setSearchTotal(page.total)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setSearchResults([])
        setSearchTotal(0)
        setSearchError(
          error instanceof ProductsRequestError
            ? error.message
            : 'Unable to search products. Please try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }

    void runSearch()
    return () => controller.abort()
  }, [activeQuery])

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore || isSearchMode) {
      return
    }

    setIsLoadingMore(true)
    setLoadMoreError(null)
    try {
      const page = await fetchProductPage(nextSkip)
      setCatalogProducts((current) => [...current, ...page.products])
      setCatalogTotal(page.total)
      setNextSkip((current) => current + PRODUCT_PAGE_SIZE)
      setHasMore(page.skip + page.products.length < page.total)
    } catch (error) {
      setLoadMoreError(
        error instanceof ProductsRequestError
          ? error.message
          : 'Unable to load more products. Please try again.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draftQuery.trim()
    setActiveQuery(trimmed)
  }

  function handleReviewAdded(productId: number, review: ProductReview) {
    setCatalogProducts((current) => appendReview(current, productId, review))
    setSearchResults((current) => (current ? appendReview(current, productId, review) : current))
  }

  const showingCount = isSearchMode
    ? isSearching
      ? 'Searching…'
      : `Showing ${visibleProducts.length} of ${searchTotal} products`
    : isInitialLoading
      ? 'Loading products…'
      : `Showing ${catalogProducts.length} of ${catalogTotal} products`

  return (
    <section className="products-page" aria-labelledby="products-heading">
      <header className="products-header">
        <div>
          <h1 id="products-heading">All Products</h1>
          <p className="products-count" aria-live="polite">
            {showingCount}
          </p>
        </div>

        <form className="products-search" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor={searchId} className="visually-hidden">
            Search products
          </label>
          <span className="products-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            id={searchId}
            type="search"
            name="q"
            placeholder="Search products"
            value={draftQuery}
            autoComplete="off"
            onChange={(event) => setDraftQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {catalogError && !isSearchMode ? (
        <p className="products-error" role="alert">
          {catalogError}
        </p>
      ) : null}

      {searchError && isSearchMode ? (
        <p className="products-error" role="alert">
          {searchError}
        </p>
      ) : null}

      {isInitialLoading && !isSearchMode ? (
        <p className="products-status" role="status">
          Loading products…
        </p>
      ) : null}

      {isSearching ? (
        <p className="products-status" role="status">
          Searching…
        </p>
      ) : null}

      {!isInitialLoading && !isSearchMode && !catalogError && catalogProducts.length === 0 ? (
        <p className="products-status">No products to show.</p>
      ) : null}

      {isSearchMode && !isSearching && !searchError && visibleProducts.length === 0 ? (
        <p className="products-status">No products match your search.</p>
      ) : null}

      {visibleProducts.length > 0 ? (
        <ul className="product-grid">
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onOpenReviews={(next) => setReviewProductId(next.id)} />
            </li>
          ))}
        </ul>
      ) : null}

      {!isSearchMode && hasMore ? (
        <div className="products-more">
          {loadMoreError ? (
            <p className="products-error" role="alert">
              {loadMoreError}
            </p>
          ) : null}
          <button type="button" className="products-load-more" onClick={() => void handleLoadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {reviewProduct ? (
        <ReviewModal
          product={reviewProduct}
          onClose={() => setReviewProductId(null)}
          onReviewAdded={handleReviewAdded}
        />
      ) : null}
    </section>
  )
}
