import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  fetchProductsPage,
  PRODUCT_PAGE_SIZE,
  ProductsRequestError,
  searchProducts,
  type CatalogProduct,
  type ProductReview,
} from '../api/products'
import { useAuth } from '../auth/AuthContext'
import { ProductCard } from '../components/ProductCard'
import { ReviewModal } from '../components/ReviewModal'
import './ProductsPage.css'

export function ProductsPage() {
  const { session } = useAuth()
  const mainRef = useRef<HTMLElement>(null)
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [reviewProductId, setReviewProductId] = useState<number | null>(null)
  const [items, setItems] = useState<CatalogProduct[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [nextSkip, setNextSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchItems, setSearchItems] = useState<CatalogProduct[]>([])
  const [searchTotal, setSearchTotal] = useState<number | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const isSearchMode = activeQuery !== ''
  const visibleItems = isSearchMode ? searchItems : items
  const visibleTotal = isSearchMode ? searchTotal : total
  const visibleLoading = isSearchMode ? searchLoading : initialLoading
  const visibleError = isSearchMode ? searchError : error
  const hasMore = !isSearchMode && total !== null && items.length < total

  useEffect(() => {
    document.title = 'Products | MyShop'
    mainRef.current?.focus()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFirstPage() {
      setInitialLoading(true)
      setError('')

      try {
        const page = await fetchProductsPage(0, controller.signal)
        setItems(page.products)
        setTotal(page.total)
        setNextSkip(page.skip + PRODUCT_PAGE_SIZE)
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return
        }
        setItems([])
        setTotal(null)
        setNextSkip(0)
        setError(
          caught instanceof ProductsRequestError
            ? caught.message
            : 'Unable to load products. Please try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false)
        }
      }
    }

    void loadFirstPage()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setActiveQuery(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    if (activeQuery === '') {
      setSearchItems([])
      setSearchTotal(null)
      setSearchError('')
      setSearchLoading(false)
      return
    }

    const controller = new AbortController()

    async function runSearch() {
      setSearchLoading(true)
      setSearchError('')

      try {
        const page = await searchProducts(activeQuery, controller.signal)
        setSearchItems(page.products)
        setSearchTotal(page.total)
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return
        }
        setSearchItems([])
        setSearchTotal(null)
        setSearchError(
          caught instanceof ProductsRequestError
            ? caught.message
            : 'Unable to search products. Please try again.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false)
        }
      }
    }

    void runSearch()
    return () => controller.abort()
  }, [activeQuery])

  async function loadMore() {
    if (moreLoading || !hasMore) return

    setMoreLoading(true)
    setError('')

    try {
      const page = await fetchProductsPage(nextSkip)
      setItems((current) => [...current, ...page.products])
      setTotal(page.total)
      setNextSkip(page.skip + PRODUCT_PAGE_SIZE)
    } catch (caught) {
      setError(
        caught instanceof ProductsRequestError
          ? caught.message
          : 'Unable to load more products. Please try again.',
      )
    } finally {
      setMoreLoading(false)
    }
  }

  async function retryInitial() {
    setInitialLoading(true)
    setError('')

    try {
      const page = await fetchProductsPage(0)
      setItems(page.products)
      setTotal(page.total)
      setNextSkip(page.skip + PRODUCT_PAGE_SIZE)
    } catch (caught) {
      setItems([])
      setTotal(null)
      setNextSkip(0)
      setError(
        caught instanceof ProductsRequestError
          ? caught.message
          : 'Unable to load products. Please try again.',
      )
    } finally {
      setInitialLoading(false)
    }
  }

  async function retrySearch() {
    if (activeQuery === '') return

    setSearchLoading(true)
    setSearchError('')

    try {
      const page = await searchProducts(activeQuery)
      setSearchItems(page.products)
      setSearchTotal(page.total)
    } catch (caught) {
      setSearchItems([])
      setSearchTotal(null)
      setSearchError(
        caught instanceof ProductsRequestError
          ? caught.message
          : 'Unable to search products. Please try again.',
      )
    } finally {
      setSearchLoading(false)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveQuery(searchInput.trim())
  }

  const reviewProduct =
    items.find((product) => product.id === reviewProductId) ??
    searchItems.find((product) => product.id === reviewProductId) ??
    null

  function handleOpenReviews(product: CatalogProduct, trigger: HTMLButtonElement) {
    reviewTriggerRef.current = trigger
    setReviewProductId(product.id)
  }

  const handleCloseReviews = useCallback(() => {
    setReviewProductId(null)
    reviewTriggerRef.current?.focus()
  }, [])

  function handleReviewAdded(productId: number, review: ProductReview) {
    const apply = (list: CatalogProduct[]) =>
      list.map((product) =>
        product.id === productId
          ? { ...product, reviews: [...product.reviews, review] }
          : product,
      )

    setItems(apply)
    setSearchItems(apply)
  }

  const showEmpty =
    !visibleLoading &&
    visibleItems.length === 0 &&
    !visibleError &&
    (isSearchMode || !initialLoading)

  return (
    <main
      className="products-main"
      ref={mainRef}
      tabIndex={-1}
      aria-busy={visibleLoading || moreLoading}
    >
      <div className="products-header">
        <div>
          <h1>All Products</h1>
          {visibleTotal !== null ? (
            <p className="products-count">
              {isSearchMode
                ? `Showing ${visibleItems.length} of ${visibleTotal} results for “${activeQuery}”`
                : `Showing ${visibleItems.length} of ${visibleTotal} products`}
            </p>
          ) : null}
        </div>

        <form className="products-search" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search">Search</label>
          <input
            id="product-search"
            type="search"
            name="q"
            placeholder="Search products"
            autoComplete="off"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </form>
      </div>

      {visibleLoading ? (
        <p className="products-status" aria-live="polite">
          {isSearchMode ? 'Searching products…' : 'Loading products…'}
        </p>
      ) : null}

      {visibleError ? (
        <p className="products-error" role="alert">
          {visibleError}
        </p>
      ) : null}

      {showEmpty ? (
        <p className="products-status">
          {isSearchMode ? `No products match “${activeQuery}”.` : 'No products to display.'}
        </p>
      ) : null}

      {!isSearchMode && !initialLoading && items.length === 0 && error ? (
        <button className="products-retry" type="button" onClick={() => void retryInitial()}>
          Try again
        </button>
      ) : null}

      {isSearchMode && !searchLoading && searchItems.length === 0 && searchError ? (
        <button className="products-retry" type="button" onClick={() => void retrySearch()}>
          Try again
        </button>
      ) : null}

      {visibleItems.length > 0 ? (
        <ul className="products-list">
          {visibleItems.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} onOpenReviews={handleOpenReviews} />
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore ? (
        <div className="products-more">
          <button type="button" onClick={() => void loadMore()} disabled={moreLoading}>
            {moreLoading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}

      {reviewProduct ? (
        <ReviewModal
          product={reviewProduct}
          userId={session?.id ?? 0}
          onClose={handleCloseReviews}
          onReviewAdded={handleReviewAdded}
        />
      ) : null}
    </main>
  )
}
