import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  fetchProductPage,
  PRODUCT_PAGE_SIZE,
  ProductsRequestError,
  searchProducts,
} from '../api/products'
import { useAuth } from '../auth/AuthContext'
import { ProductCard } from '../components/ProductCard'
import { ReviewModal } from '../components/ReviewModal'
import { SearchIcon } from '../components/Icons'
import type { Product } from '../types/product'
import './ProductsPage.css'

export function ProductsPage() {
  const { session } = useAuth()
  const searchId = useId()
  const searchSeq = useRef(0)
  const [reviewProductId, setReviewProductId] = useState<number | null>(null)

  const [catalog, setCatalog] = useState<Product[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchHits, setSearchHits] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const isSearchMode = activeQuery.length > 0
  const visibleProducts = isSearchMode ? searchHits : catalog
  const visibleTotal = isSearchMode ? searchTotal : catalogTotal
  const listError = isSearchMode ? searchError : catalogError
  const hasMore = !isSearchMode && catalog.length < catalogTotal

  useEffect(() => {
    document.title = 'All Products · MyShop'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadFirstPage() {
      setIsInitialLoading(true)
      setCatalogError(null)

      try {
        const page = await fetchProductPage(0)
        if (cancelled) {
          return
        }

        setCatalog(page.products)
        setCatalogTotal(page.total)
        setNextSkip(PRODUCT_PAGE_SIZE)
      } catch (caught) {
        if (cancelled) {
          return
        }

        setCatalog([])
        setCatalogTotal(0)
        setNextSkip(0)
        setCatalogError(
          caught instanceof ProductsRequestError
            ? caught.message
            : 'Unable to load products. Please try again.',
        )
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false)
        }
      }
    }

    void loadFirstPage()
    return () => {
      cancelled = true
    }
  }, [])

  function leaveSearch() {
    searchSeq.current += 1
    setActiveQuery('')
    setSearchHits([])
    setSearchTotal(0)
    setSearchError(null)
    setIsSearching(false)
  }

  async function runSearch(rawQuery: string) {
    const query = rawQuery.trim()
    if (!query) {
      leaveSearch()
      return
    }

    const seq = ++searchSeq.current
    setActiveQuery(query)
    setIsSearching(true)
    setSearchError(null)

    try {
      const page = await searchProducts(query)
      if (seq !== searchSeq.current) {
        return
      }
      setSearchHits(page.products)
      setSearchTotal(page.total)
    } catch (caught) {
      if (seq !== searchSeq.current) {
        return
      }
      setSearchHits([])
      setSearchTotal(0)
      setSearchError(
        caught instanceof ProductsRequestError
          ? caught.message
          : 'Unable to search products. Please try again.',
      )
    } finally {
      if (seq === searchSeq.current) {
        setIsSearching(false)
      }
    }
  }

  useEffect(() => {
    const query = searchInput.trim()
    if (!query) {
      leaveSearch()
      return
    }

    const timer = window.setTimeout(() => {
      void runSearch(query)
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchInput])

  async function loadMore() {
    if (isSearchMode || isLoadingMore || isInitialLoading || !hasMore) {
      return
    }

    setIsLoadingMore(true)
    setCatalogError(null)

    try {
      const page = await fetchProductPage(nextSkip)
      setCatalog((current) => [...current, ...page.products])
      setCatalogTotal(page.total)
      setNextSkip((current) => current + PRODUCT_PAGE_SIZE)
    } catch (caught) {
      setCatalogError(
        caught instanceof ProductsRequestError && caught.kind === 'network'
          ? caught.message
          : 'Unable to load more products. Previously loaded items are still shown.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void runSearch(searchInput)
  }

  const closeReviews = useCallback(() => {
    setReviewProductId(null)
  }, [])

  function replaceProduct(updated: Product) {
    setCatalog((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    setSearchHits((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  const reviewProduct =
    catalog.find((item) => item.id === reviewProductId) ??
    searchHits.find((item) => item.id === reviewProductId)

  const isListLoading = isSearchMode ? isSearching : isInitialLoading
  const countLabel = isListLoading
    ? isSearchMode
      ? 'Searching products'
      : 'Loading products'
    : `Showing ${visibleProducts.length} of ${visibleTotal} products`

  return (
    <main className="products-page">
      <div className="products-toolbar">
        <header className="products-heading">
          <h1>All Products</h1>
          <p className="products-count" aria-live="polite">
            {countLabel}
          </p>
        </header>

        <form
          className="products-search"
          role="search"
          onSubmit={handleSearchSubmit}
          aria-busy={isSearching}
        >
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
          <button type="submit" aria-label="Submit search">
            <SearchIcon />
          </button>
        </form>
      </div>

      {listError ? (
        <p className="products-error" role="alert">
          {listError}
        </p>
      ) : null}

      {isListLoading ? (
        <p className="products-status">{isSearchMode ? 'Searching products…' : 'Loading products…'}</p>
      ) : visibleProducts.length === 0 && !listError ? (
        <p className="products-status">
          {isSearchMode ? 'No products match your search.' : 'No products are available right now.'}
        </p>
      ) : visibleProducts.length === 0 ? null : (
        <ul className="products-grid">
          {visibleProducts.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                reviewsOpen={reviewProductId === product.id}
                onOpenReviews={() => setReviewProductId(product.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className="products-more">
          <button
            type="button"
            onClick={() => {
              void loadMore()
            }}
            disabled={isLoadingMore || isInitialLoading}
            aria-busy={isLoadingMore}
          >
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {reviewProduct && session ? (
        <ReviewModal
          product={reviewProduct}
          userId={session.id}
          userName={session.username?.trim() || 'You'}
          onClose={closeReviews}
          onProductChange={replaceProduct}
        />
      ) : null}
    </main>
  )
}
