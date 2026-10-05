import { useEffect, useState } from 'react'
import { useProducts } from '../context/ProductsContext.tsx'
import type { Product } from '../types.ts'
import { usePageMeta } from '../hooks/usePageMeta.ts'
import { ProductCard } from './ProductCard.tsx'
import { ReviewModal } from './ReviewModal.tsx'
import { SearchBar } from './SearchBar.tsx'

export function ProductsPage() {
  usePageMeta(
    'Products | MyShop',
    'Browse the MyShop catalog, search for products, read reviews, and add items to your cart.',
  )

  const {
    products,
    total,
    isInitialLoading,
    isLoadingMore,
    loadError,
    loadMoreError,
    hasMore,
    loadInitialProducts,
    loadMoreProducts,
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    hasSearched,
    setSearchQuery,
    runSearch,
    clearSearch,
  } = useProducts()

  const [reviewProductId, setReviewProductId] = useState<number | null>(null)

  useEffect(() => {
    loadInitialProducts()
    // Run once on mount; the provider guards against duplicate fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSearchMode = hasSearched && searchQuery.trim().length > 0

  const reviewProduct: Product | null =
    reviewProductId == null
      ? null
      : products.find((product) => product.id === reviewProductId) ??
        searchResults.find((product) => product.id === reviewProductId) ??
        null

  return (
    <main className="products-page">
      <div className="products-page__toolbar">
        <div>
          <h1>All Products</h1>
          <p className="products-page__count">
            {isSearchMode
              ? `Showing ${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`
              : `Showing ${products.length} of ${total} products`}
          </p>
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={runSearch} onClear={clearSearch} />
      </div>

      {isSearchMode ? (
        <>
          {isSearching && <p role="status">Searching…</p>}
          {searchError && <p role="alert" className="page-error">{searchError}</p>}
          {!isSearching && !searchError && searchResults.length === 0 && (
            <p role="status">No products match "{searchQuery.trim()}".</p>
          )}
          <ul className="product-grid">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} onOpenReviews={(p) => setReviewProductId(p.id)} />
            ))}
          </ul>
        </>
      ) : (
        <>
          {isInitialLoading && <p role="status">Loading products…</p>}

          {loadError && (
            <div role="alert" className="page-error">
              <p>{loadError}</p>
              <button type="button" className="btn btn-secondary" onClick={loadInitialProducts}>
                Retry
              </button>
            </div>
          )}

          {!isInitialLoading && !loadError && products.length === 0 && (
            <p role="status">No products found.</p>
          )}

          {products.length > 0 && (
            <ul className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onOpenReviews={(p) => setReviewProductId(p.id)} />
              ))}
            </ul>
          )}

          {loadMoreError && (
            <p role="alert" className="page-error">
              {loadMoreError}
            </p>
          )}

          {!isInitialLoading && !loadError && products.length > 0 && (
            hasMore ? (
              <button
                type="button"
                className="btn btn-secondary load-more"
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            ) : (
              <p className="products-page__end" role="status">
                You&rsquo;ve reached the end of the catalog.
              </p>
            )
          )}
        </>
      )}

      <ReviewModal product={reviewProduct} onClose={() => setReviewProductId(null)} />
    </main>
  )
}
