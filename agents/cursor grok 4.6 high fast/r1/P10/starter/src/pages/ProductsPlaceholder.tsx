import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import ProductCard from '../products/ProductCard'
import {
  fetchProductsPage,
  hasMoreProducts,
  PRODUCTS_PAGE_SIZE,
  ProductsRequestError,
  searchProducts,
} from '../products/productsApi'
import type { CatalogProduct, ProductReview } from '../products/types'
import './ProductsPage.css'

export default function ProductsPlaceholder() {
  const searchId = useId()
  const searchRequestId = useRef(0)

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [total, setTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const isSearchMode = activeQuery.length > 0
  const visibleProducts = isSearchMode ? searchResults : products

  const loadPage = useCallback(async (skip: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsInitialLoading(true)
    }
    setError(null)

    try {
      const page = await fetchProductsPage(skip)
      setProducts((current) => (append ? [...current, ...page.products] : page.products))
      setTotal(page.total)
      setNextSkip(skip + PRODUCTS_PAGE_SIZE)
      setHasMore(page.products.length > 0 && hasMoreProducts(page.skip, page.products.length, page.total))
    } catch (cause) {
      const message =
        cause instanceof ProductsRequestError
          ? cause.message
          : 'Unable to load products. Please try again.'
      setError(message)
    } finally {
      setIsInitialLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  const runSearch = useCallback(async (query: string) => {
    const requestId = ++searchRequestId.current
    setActiveQuery(query)
    setIsSearching(true)
    setSearchError(null)

    try {
      const page = await searchProducts(query)
      if (requestId !== searchRequestId.current) {
        return
      }
      setSearchResults(page.products)
      setSearchTotal(page.total)
    } catch (cause) {
      if (requestId !== searchRequestId.current) {
        return
      }
      const message =
        cause instanceof ProductsRequestError
          ? cause.message
          : 'Unable to search products. Please try again.'
      setSearchError(message)
    } finally {
      if (requestId === searchRequestId.current) {
        setIsSearching(false)
      }
    }
  }, [])

  const appendReview = useCallback((productId: number, review: ProductReview) => {
    const apply = (list: CatalogProduct[]) =>
      list.map((item) => (item.id === productId ? { ...item, reviews: [...item.reviews, review] } : item))
    setProducts(apply)
    setSearchResults(apply)
  }, [])

  const clearSearch = useCallback(() => {
    searchRequestId.current += 1
    setActiveQuery('')
    setSearchResults([])
    setSearchTotal(0)
    setIsSearching(false)
    setSearchError(null)
  }, [])

  useEffect(() => {
    document.title = 'Products | MyShop'
  }, [])

  useEffect(() => {
    void loadPage(0, false)
  }, [loadPage])

  useEffect(() => {
    const query = searchInput.trim()
    if (query.length === 0) {
      clearSearch()
      return
    }

    const timer = window.setTimeout(() => {
      void runSearch(query)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput, runSearch, clearSearch])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()
    if (query.length === 0) {
      clearSearch()
      return
    }
    void runSearch(query)
  }

  const showing = visibleProducts.length
  const countLabel = isSearchMode
    ? isSearching && showing === 0
      ? 'Searching products…'
      : `Showing ${showing} of ${searchTotal} products.`
    : isInitialLoading && showing === 0
      ? 'Loading products…'
      : `Showing ${showing} of ${total} products.`

  return (
    <main id="main-content" className="app-shell-main" tabIndex={-1}>
      <div className="products-header">
        <div className="products-heading">
          <h1>All Products</h1>
          <p className="products-count" aria-live="polite">
            {countLabel}
          </p>
        </div>

        <form className="products-search" role="search" onSubmit={handleSearchSubmit}>
          <label className="visually-hidden" htmlFor={searchId}>
            Search products
          </label>
          <input
            id={searchId}
            type="search"
            name="q"
            placeholder="Search products"
            value={searchInput}
            autoComplete="off"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button className="products-search-submit" type="submit" aria-label="Search products">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16.5 20.5 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>

      {isSearchMode ? (
        searchError ? (
          <p className="products-error" role="alert">
            {searchError}
          </p>
        ) : null
      ) : error ? (
        <p className="products-error" role="alert">
          {error}
        </p>
      ) : null}

      {isSearchMode && isSearching ? <p className="products-status">Searching products…</p> : null}
      {!isSearchMode && isInitialLoading ? <p className="products-status">Loading products…</p> : null}

      {isSearchMode && !isSearching && showing === 0 && !searchError ? (
        <p className="products-status">No products match your search.</p>
      ) : null}

      {!isSearchMode && !isInitialLoading && showing === 0 && !error ? (
        <p className="products-status">No products to show.</p>
      ) : null}

      {isSearchMode && showing === 0 && searchError ? (
        <button className="products-retry" type="button" onClick={() => void runSearch(activeQuery)}>
          Try again
        </button>
      ) : null}

      {!isSearchMode && showing === 0 && error ? (
        <button className="products-retry" type="button" onClick={() => void loadPage(0, false)}>
          Try again
        </button>
      ) : null}

      {showing > 0 ? (
        <ul className="products-list">
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onReviewAdded={appendReview} />
            </li>
          ))}
        </ul>
      ) : null}

      {!isSearchMode && hasMore ? (
        <div className="products-more">
          <button
            className="products-more-button"
            type="button"
            onClick={() => void loadPage(nextSkip, true)}
            disabled={isLoadingMore}
            aria-busy={isLoadingMore}
          >
            {isLoadingMore ? 'Loading more…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </main>
  )
}
