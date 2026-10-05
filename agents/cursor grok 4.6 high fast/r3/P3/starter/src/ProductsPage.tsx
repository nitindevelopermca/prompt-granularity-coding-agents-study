import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { addCartProduct } from './api/cart'
import { fetchProductPage, hasMorePages, PRODUCT_PAGE_SIZE, searchProducts } from './api/products'
import { useCart } from './cart'
import { ProductCard } from './ProductCard'
import { ReviewModal } from './ReviewModal'
import { useAuth } from './session'
import type { Product, ProductReview } from './types'

export function ProductsPage() {
  const { session } = useAuth()
  const { addItem } = useCart()
  const searchId = useId()
  const searchDebounceRef = useRef<number>(0)
  const searchAbortRef = useRef<AbortController | null>(null)

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [loadMoreLoading, setLoadMoreLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchProductsState, setSearchProductsState] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchActive, setSearchActive] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addError, setAddError] = useState<{ id: number; message: string } | null>(null)
  const closeReviews = useCallback(() => {
    setReviewProductId(null)
  }, [])

  async function handleAddToCart(product: Product) {
    if (!session) {
      return
    }
    setAddingId(product.id)
    setAddError(null)
    const result = await addCartProduct(session.id, product.id, 1)
    setAddingId(null)
    if (!result.ok) {
      setAddError({ id: product.id, message: result.message })
      return
    }
    addItem(product, 1)
  }

  const loadCatalog = useCallback(async (skip: number, append: boolean, signal?: AbortSignal) => {
    if (append) {
      setLoadMoreLoading(true)
      setLoadMoreError('')
    } else {
      setCatalogLoading(true)
      setCatalogError('')
    }

    const result = await fetchProductPage(skip, signal)
    if (!result.ok) {
      if (result.kind === 'aborted' || signal?.aborted) {
        return
      }
      if (append) {
        setLoadMoreError(result.message)
        setLoadMoreLoading(false)
      } else {
        setCatalogError(result.message)
        setCatalogLoading(false)
      }
      return
    }

    setCatalogProducts((current) => (append ? [...current, ...result.products] : result.products))
    setCatalogTotal(result.total)
    setNextSkip(skip + PRODUCT_PAGE_SIZE)
    setHasMore(result.products.length > 0 && hasMorePages(skip, result.products.length, result.total))
    setCatalogLoading(false)
    setLoadMoreLoading(false)
    setLoadMoreError('')
    setCatalogError('')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadCatalog(0, false, controller.signal)
    return () => controller.abort()
  }, [loadCatalog])

  useEffect(() => {
    return () => {
      window.clearTimeout(searchDebounceRef.current)
      searchAbortRef.current?.abort()
    }
  }, [])

  const exitSearch = useCallback(() => {
    window.clearTimeout(searchDebounceRef.current)
    searchAbortRef.current?.abort()
    setSearchActive(false)
    setSearchQuery('')
    setSearchLoading(false)
    setSearchError('')
  }, [])

  const runSearch = useCallback(async (query: string) => {
    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    setSearchActive(true)
    setSearchQuery(query)
    setSearchLoading(true)
    setSearchError('')

    const result = await searchProducts(query, controller.signal)
    if (!result.ok) {
      if (result.kind === 'aborted' || controller.signal.aborted) {
        return
      }
      setSearchError(result.message)
      setSearchLoading(false)
      return
    }

    setSearchProductsState(result.products)
    setSearchTotal(result.total)
    setSearchLoading(false)
    setSearchError('')
  }, [])

  function scheduleSearch(value: string) {
    window.clearTimeout(searchDebounceRef.current)
    const query = value.trim()
    if (!query) {
      exitSearch()
      return
    }
    searchDebounceRef.current = window.setTimeout(() => {
      void runSearch(query)
    }, 400)
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.clearTimeout(searchDebounceRef.current)
    const query = searchInput.trim()
    if (!query) {
      exitSearch()
      return
    }
    void runSearch(query)
  }

  function appendReview(productId: number, review: ProductReview) {
    function withReview(list: Product[]): Product[] {
      return list.map((item) => (item.id === productId ? { ...item, reviews: [...item.reviews, review] } : item))
    }
    setCatalogProducts(withReview)
    setSearchProductsState(withReview)
  }

  const visibleProducts = searchActive ? searchProductsState : catalogProducts
  const reviewProduct = visibleProducts.find((item) => item.id === reviewProductId) ?? null
  const showingCount = searchActive
    ? `Showing ${searchProductsState.length} of ${searchTotal} results${searchQuery ? ` for “${searchQuery}”` : ''}`
    : `Showing ${catalogProducts.length} of ${catalogTotal} products`

  const listBusy = searchActive ? searchLoading : catalogLoading
  const listError = searchActive ? searchError : catalogError
  const emptyMessage = searchActive
    ? searchLoading
      ? 'Searching products…'
      : searchError
        ? ''
        : 'No products match your search.'
    : catalogLoading
      ? 'Loading products…'
      : catalogError
        ? ''
        : 'No products available.'

  return (
    <>
      <main className="page-main" inert={reviewProduct ? true : undefined} aria-busy={listBusy}>
        <div className="catalog-header">
          <div>
            <h1>All Products</h1>
            <p className="showing-count">{showingCount}</p>
          </div>
          <form className="catalog-search" role="search" onSubmit={onSearchSubmit}>
            <label htmlFor={searchId}>Search products</label>
            <div className="catalog-search-control">
              <input
                id={searchId}
                type="search"
                name="q"
                placeholder="Search products"
                value={searchInput}
                autoComplete="off"
                onChange={(event) => {
                  const value = event.target.value
                  setSearchInput(value)
                  scheduleSearch(value)
                }}
              />
              <button type="submit">Search</button>
            </div>
          </form>
        </div>

        <p className="visually-hidden" aria-live="polite">
          {listBusy ? (searchActive ? 'Searching products' : 'Loading products') : showingCount}
        </p>

        {listError ? (
          <p className="form-alert catalog-alert" role="alert">
            {listError}
          </p>
        ) : null}

        {visibleProducts.length === 0 ? (
          listError ? null : <p className="catalog-empty">{emptyMessage}</p>
        ) : (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenReviews={(item) => setReviewProductId(item.id)}
                onAddToCart={handleAddToCart}
                adding={addingId === product.id}
                addError={addError?.id === product.id ? addError.message : ''}
              />
            ))}
          </div>
        )}

        {!searchActive && hasMore ? (
          <div className="catalog-more">
            {loadMoreError ? (
              <p className="form-alert catalog-alert" role="alert">
                {loadMoreError}
              </p>
            ) : null}
            <button
              type="button"
              className="load-more"
              disabled={loadMoreLoading}
              onClick={() => void loadCatalog(nextSkip, true)}
            >
              {loadMoreLoading ? 'Loading more…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </main>

      {reviewProduct && session ? (
        <ReviewModal
          product={reviewProduct}
          userId={session.id}
          onClose={closeReviews}
          onReviewAdded={appendReview}
        />
      ) : null}
    </>
  )
}
