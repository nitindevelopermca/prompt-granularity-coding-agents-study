import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Product, Review } from '../types'
import { fetchProducts, searchProducts } from '../api/products'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import ReviewModal from '../components/ReviewModal'
import { SearchIcon, AlertIcon, CloseIcon } from '../components/Icons'
import './ProductsPage.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

export default function ProductsPage() {
  const { addProductToCart } = useCart()

  const [productsById, setProductsById] = useState<Record<number, Product>>({})
  const [catalogOrder, setCatalogOrder] = useState<number[]>([])
  const [total, setTotal] = useState(0)

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchOrder, setSearchOrder] = useState<number[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  const [activeProductId, setActiveProductId] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'All Products - MyShop'
  }, [])

  const mergeProducts = useCallback((list: Product[]) => {
    setProductsById((prev) => {
      const next = { ...prev }
      for (const incoming of list) {
        const existing = next[incoming.id]
        // Preserve locally appended reviews (e.g. from Add Comment) if the
        // freshly fetched product would otherwise overwrite them.
        if (existing && existing.reviews.length > incoming.reviews.length) {
          next[incoming.id] = { ...incoming, reviews: existing.reviews }
        } else {
          next[incoming.id] = incoming
        }
      }
      return next
    })
  }, [])

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true)
    setInitialError(null)
    try {
      const data = await fetchProducts(PAGE_SIZE, 0)
      mergeProducts(data.products)
      setCatalogOrder(data.products.map((product) => product.id))
      setTotal(data.total)
    } catch (error) {
      setInitialError(error instanceof Error ? error.message : 'Could not load products.')
    } finally {
      setLoadingInitial(false)
    }
  }, [mergeProducts])

  useEffect(() => {
    void loadInitial()
    // Load once on mount; loadInitial is stable across renders via useCallback deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasMore = catalogOrder.length < total

  const handleLoadMore = useCallback(async () => {
    const nextSkip = catalogOrder.length
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const data = await fetchProducts(PAGE_SIZE, nextSkip)
      mergeProducts(data.products)
      setCatalogOrder((prev) => [...prev, ...data.products.map((product) => product.id)])
      setTotal(data.total)
    } catch (error) {
      // Keep already loaded products; only surface the error.
      setLoadMoreError(error instanceof Error ? error.message : 'Could not load more products.')
    } finally {
      setLoadingMore(false)
    }
  }, [catalogOrder.length, mergeProducts])

  const runSearch = useCallback(
    async (query: string) => {
      setSearchLoading(true)
      setSearchError(null)
      try {
        const data = await searchProducts(query)
        mergeProducts(data.products)
        setSearchOrder(data.products.map((product) => product.id))
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.')
      } finally {
        setSearchLoading(false)
      }
    },
    [mergeProducts],
  )

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current)
    }
    if (trimmed === '') {
      setSearchOrder(null)
      setSearchError(null)
      setSearchLoading(false)
      return
    }
    debounceRef.current = window.setTimeout(() => {
      void runSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [searchInput, runSearch])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current)
    }
    const trimmed = searchInput.trim()
    if (trimmed === '') {
      setSearchOrder(null)
      setSearchError(null)
      return
    }
    void runSearch(trimmed)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchOrder(null)
    setSearchError(null)
  }

  const handleAddReview = useCallback((productId: number, review: Review) => {
    setProductsById((prev) => {
      const product = prev[productId]
      if (!product) return prev
      return { ...prev, [productId]: { ...product, reviews: [review, ...product.reviews] } }
    })
  }, [])

  const isSearchMode = searchInput.trim() !== ''
  const visibleIds = isSearchMode ? searchOrder ?? [] : catalogOrder
  const visibleProducts = visibleIds
    .map((id) => productsById[id])
    .filter((product): product is Product => Boolean(product))

  const activeProduct = activeProductId !== null ? productsById[activeProductId] : null

  return (
    <section className="products-page" aria-labelledby="products-heading">
      <div className="products-page__toolbar">
        <div>
          <h1 id="products-heading">All Products</h1>
          <p className="products-page__count" aria-live="polite">
            {isSearchMode
              ? searchLoading
                ? 'Searching…'
                : searchError
                  ? 'Search unavailable'
                  : `Showing ${visibleProducts.length} result${visibleProducts.length === 1 ? '' : 's'} for "${searchInput.trim()}"`
              : `Showing ${catalogOrder.length} of ${total} products`}
          </p>
        </div>

        <form className="products-page__search" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor="product-search" className="visually-hidden">
            Search products
          </label>
          <div className="products-page__search-input-wrapper">
            <SearchIcon className="products-page__search-icon" />
            <input
              id="product-search"
              type="search"
              placeholder="Search products"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput !== '' && (
              <button
                type="button"
                className="products-page__search-clear"
                aria-label="Clear search"
                onClick={handleClearSearch}
              >
                <CloseIcon width={16} height={16} />
              </button>
            )}
          </div>
          <button type="submit" className="secondary-button products-page__search-submit">
            Search
          </button>
        </form>
      </div>

      {isSearchMode ? (
        <div className="products-page__results">
          {searchError && (
            <p role="alert" className="inline-alert">
              <AlertIcon width={18} height={18} />
              <span>{searchError}</span>
            </p>
          )}
          {searchLoading && (
            <p className="products-page__loading">
              <span className="spinner spinner--dark" aria-hidden="true" /> Searching products…
            </p>
          )}
          {!searchLoading && !searchError && visibleProducts.length === 0 && (
            <p className="products-page__empty">No products found for "{searchInput.trim()}".</p>
          )}
          {!searchLoading && visibleProducts.length > 0 && (
            <div className="products-page__grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenReviews={setActiveProductId}
                  onAddToCart={addProductToCart}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="products-page__results">
          {loadingInitial && (
            <p className="products-page__loading">
              <span className="spinner spinner--dark" aria-hidden="true" /> Loading products…
            </p>
          )}

          {!loadingInitial && initialError && (
            <div className="inline-alert products-page__initial-error" role="alert">
              <AlertIcon width={18} height={18} />
              <span>{initialError}</span>
              <button type="button" className="secondary-button" onClick={() => void loadInitial()}>
                Retry
              </button>
            </div>
          )}

          {!loadingInitial && !initialError && catalogOrder.length === 0 && (
            <p className="products-page__empty">No products are available right now.</p>
          )}

          {!loadingInitial && !initialError && catalogOrder.length > 0 && (
            <>
              <div className="products-page__grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenReviews={setActiveProductId}
                    onAddToCart={addProductToCart}
                  />
                ))}
              </div>

              {loadMoreError && (
                <p role="alert" className="inline-alert products-page__load-more-error">
                  <AlertIcon width={18} height={18} />
                  <span>{loadMoreError}</span>
                </p>
              )}

              {hasMore && (
                <div className="products-page__load-more">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleLoadMore()}
                    disabled={loadingMore}
                    aria-busy={loadingMore}
                  >
                    {loadingMore && <span className="spinner spinner--dark" aria-hidden="true" />}
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}

              {!hasMore && (
                <p className="products-page__end-of-list">You've reached the end of the catalog.</p>
              )}
            </>
          )}
        </div>
      )}

      {activeProduct && (
        <ReviewModal
          product={activeProduct}
          onClose={() => setActiveProductId(null)}
          onAddReview={handleAddReview}
        />
      )}
    </section>
  )
}
