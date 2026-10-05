import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from 'react'

type Review = {
  reviewerName: string
  rating: number
  comment: string
  date: string
}

export type Product = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand?: string
  thumbnail?: string
  images: string[]
  reviews: Review[]
}

type ProductsResponse = {
  products: Product[]
  total: number
}

const PAGE_SIZE = 10

function isProductsResponse(value: unknown): value is ProductsResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'products' in value &&
    Array.isArray(value.products) &&
    'total' in value &&
    typeof value.total === 'number'
  )
}

async function fetchProducts(url: string, signal?: AbortSignal): Promise<ProductsResponse> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Products request failed with ${response.status}`)
  const data: unknown = await response.json()
  if (!isProductsResponse(data)) throw new Error('Unexpected products response')
  return data
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.8 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.5 2.89 1.05-6.13-4.46-4.34 6.16-.9L12 2.8Z" />
    </svg>
  )
}

function BrokenImage({ name }: { name: string }) {
  return (
    <div className="broken-image" role="img" aria-label={`Image unavailable for ${name}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5h16v13H4z" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m5.5 17 4.5-4 3.1 2.7 2.2-2 3.2 3.3" />
      </svg>
      <span>Image unavailable</span>
    </div>
  )
}

function ProductCard({
  product,
  reviews,
  onOpenReviews,
  onAddToCart,
}: {
  product: Product
  reviews: Review[]
  onOpenReviews: (product: Product, trigger: HTMLButtonElement) => void
  onAddToCart: (product: Product) => Promise<void>
}) {
  const validImages = (product.images ?? []).filter(
    (image) => typeof image === 'string' && image.trim(),
  )
  const fallbackMain = product.thumbnail?.trim() || validImages[0] || ''
  const [selectedImage, setSelectedImage] = useState(fallbackMain)
  const [mainImageFailed, setMainImageFailed] = useState(!fallbackMain)
  const [failedThumbnails, setFailedThumbnails] = useState<Set<number>>(() => new Set())
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartError, setCartError] = useState('')

  function selectImage(image: string) {
    setSelectedImage(image)
    setMainImageFailed(false)
  }

  function markThumbnailFailed(index: number) {
    setFailedThumbnails((current) => new Set(current).add(index))
  }

  async function addToCart() {
    setAddingToCart(true)
    setCartError('')
    try {
      await onAddToCart(product)
    } catch {
      setCartError('Could not add this product. Please try again.')
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-card__gallery">
        <div className="product-card__main-image">
          {mainImageFailed ? (
            <BrokenImage name={product.title} />
          ) : (
            <img
              src={selectedImage}
              alt={product.title}
              loading="lazy"
              onError={() => setMainImageFailed(true)}
            />
          )}
        </div>
        {validImages.length > 0 && (
          <div className="thumbnail-strip" aria-label={`Images for ${product.title}`}>
            {validImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={selectedImage === image ? 'thumbnail thumbnail--active' : 'thumbnail'}
                onClick={() => selectImage(image)}
                aria-label={`Image ${index + 1} of ${validImages.length} for ${product.title}`}
                aria-pressed={selectedImage === image}
              >
                {failedThumbnails.has(index) ? (
                  <span aria-hidden="true">—</span>
                ) : (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => markThumbnailFailed(index)}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-card__content">
        <p className="product-card__brand">{product.brand?.trim() || 'Brand unavailable'}</p>
        <h2>{product.title}</h2>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__meta">
          <p className="product-card__price">${product.price.toFixed(2)}</p>
          <span className="discount">{product.discountPercentage.toFixed(1)}% off</span>
        </div>
        <button
          className="reviews-button"
          type="button"
          onClick={(event) => onOpenReviews(product, event.currentTarget)}
          aria-label={`Read ${reviews.length} reviews for ${product.title}, rated ${product.rating.toFixed(1)} out of 5`}
        >
          <span className="rating">
            <StarIcon />
            {product.rating.toFixed(1)}
          </span>
          <span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
        </button>
      </div>

      {cartError && (
        <p className="card-error" role="alert">
          {cartError}
        </p>
      )}
      <button
        className="add-cart-button"
        type="button"
        onClick={() => void addToCart()}
        disabled={addingToCart}
      >
        {addingToCart && <span className="spinner" aria-hidden="true" />}
        {addingToCart ? 'Adding…' : 'Add to Cart'}
      </button>
    </article>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < Math.round(rating) ? 'star star--filled' : 'star'}>
          ★
        </span>
      ))}
    </span>
  )
}

function formatReviewDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

function ReviewDialog({
  product,
  reviews,
  userId,
  onClose,
  onCommentAdded,
}: {
  product: Product
  reviews: Review[]
  userId: number
  onClose: () => void
  onCommentAdded: (review: Review) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setError('Enter a comment before submitting.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('https://dummyjson.com/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, postId: product.id, userId }),
      })
      if (!response.ok) throw new Error(`Comment request failed with ${response.status}`)

      onCommentAdded({
        reviewerName: 'You',
        rating,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating(0)
    } catch {
      setError('Your comment could not be added. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackdropClick(event: SyntheticEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby="reviews-heading"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="review-dialog__panel">
        <header className="review-dialog__header">
          <div>
            <p>Customer feedback</p>
            <h2 id="reviews-heading">Reviews</h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            aria-label="Close reviews"
            onClick={() => dialogRef.current?.close()}
            autoFocus
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="review-dialog__product">
          <strong>{product.title}</strong>
          <span>
            {product.rating.toFixed(1)} average · {reviews.length}{' '}
            {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className="review-list" aria-label={`Reviews for ${product.title}`}>
          {reviews.length === 0 ? (
            <p className="empty-reviews">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            reviews.map((review, index) => (
              <article className="review" key={`${review.reviewerName}-${review.date}-${index}`}>
                <div className="review__topline">
                  <strong>{review.reviewerName}</strong>
                  <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                </div>
                {review.rating > 0 && <Stars rating={review.rating} />}
                <p>{review.comment}</p>
              </article>
            ))
          )}
        </div>

        <form className="comment-form" onSubmit={submitComment} noValidate>
          <h3>Add a comment</h3>
          <div className="comment-rating">
            <span id="rating-label">Rating <span>(optional)</span></span>
            <div role="group" aria-labelledby="rating-label">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= rating ? 'rating-choice rating-choice--active' : 'rating-choice'}
                  onClick={() => setRating(value === rating ? 0 : value)}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={value <= rating}
                  disabled={submitting}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <label htmlFor="comment">Your comment</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              if (error) setError('')
            }}
            placeholder="Share your experience with this product"
            rows={4}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'comment-error' : undefined}
            disabled={submitting}
          />
          {error && (
            <p id="comment-error" className="comment-error" role="alert">
              {error}
            </p>
          )}
          <button className="comment-submit" type="submit" disabled={submitting}>
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      </div>
    </dialog>
  )
}

export default function ProductCatalog({
  userId,
  onAddToCart,
}: {
  userId: number
  onAddToCart: (product: Product) => Promise<void>
}) {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchProducts, setSearchProducts] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addedReviews, setAddedReviews] = useState<Record<number, Review[]>>({})
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null)

  async function loadInitialProducts(signal?: AbortSignal) {
    setInitialLoading(true)
    setCatalogError('')
    try {
      const data = await fetchProducts(
        `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=0`,
        signal,
      )
      setCatalogProducts(data.products)
      setCatalogTotal(data.total)
      setNextSkip(PAGE_SIZE)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setCatalogError('Products could not be loaded. Please try again.')
    } finally {
      if (!signal?.aborted) setInitialLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadInitialProducts(controller.signal)
    return () => controller.abort()
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    setCatalogError('')
    try {
      const data = await fetchProducts(
        `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${nextSkip}`,
      )
      setCatalogProducts((current) => {
        const existingIds = new Set(current.map((product) => product.id))
        return [...current, ...data.products.filter((product) => !existingIds.has(product.id))]
      })
      setCatalogTotal(data.total)
      setNextSkip((current) => current + PAGE_SIZE)
    } catch {
      setCatalogError('More products could not be loaded. Your current products are still available.')
    } finally {
      setLoadingMore(false)
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()
    if (!query) {
      setActiveQuery('')
      setSearchProducts([])
      setSearchError('')
      return
    }
    setActiveQuery(query)
  }

  useEffect(() => {
    if (!activeQuery) return
    const controller = new AbortController()

    async function runSearch() {
      setSearchLoading(true)
      setSearchError('')
      setSearchProducts([])
      try {
        const data = await fetchProducts(
          `https://dummyjson.com/products/search?q=${encodeURIComponent(activeQuery)}`,
          controller.signal,
        )
        setSearchProducts(data.products)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setSearchError('Search results could not be loaded. Please try again.')
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false)
      }
    }

    void runSearch()
    return () => controller.abort()
  }, [activeQuery])

  function clearSearch() {
    setSearchInput('')
    setActiveQuery('')
    setSearchProducts([])
    setSearchError('')
  }

  function openReviews(product: Product, trigger: HTMLButtonElement) {
    reviewTriggerRef.current = trigger
    setSelectedProduct(product)
  }

  function closeReviews() {
    setSelectedProduct(null)
    window.requestAnimationFrame(() => reviewTriggerRef.current?.focus())
  }

  const shownProducts = activeQuery ? searchProducts : catalogProducts
  const hasMore = catalogProducts.length < catalogTotal
  const shownCount = shownProducts.length

  return (
    <main className="catalog-main">
      <div className="catalog-container">
        <div className="catalog-heading">
          <div>
            <p className="catalog-heading__eyebrow">Explore our collection</p>
            <h1>All Products</h1>
            <p className="showing-count" aria-live="polite">
              {activeQuery
                ? `Showing ${shownCount} ${shownCount === 1 ? 'result' : 'results'} for “${activeQuery}”`
                : `Showing ${shownCount}${catalogTotal ? ` of ${catalogTotal}` : ''} products`}
            </p>
          </div>

          <form className="search-form" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="product-search">
              Search products
            </label>
            <span className="search-form__icon">
              <SearchIcon />
            </span>
            <input
              id="product-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products"
            />
            {activeQuery && (
              <button className="clear-search" type="button" onClick={clearSearch}>
                Clear
              </button>
            )}
            <button className="search-button" type="submit">
              Search
            </button>
          </form>
        </div>

        {initialLoading && !activeQuery && (
          <div className="catalog-status" role="status">
            <span className="catalog-spinner" aria-hidden="true" />
            <p>Loading products…</p>
          </div>
        )}

        {searchLoading && (
          <div className="catalog-status" role="status">
            <span className="catalog-spinner" aria-hidden="true" />
            <p>Searching products…</p>
          </div>
        )}

        {catalogError && !activeQuery && (
          <div className="catalog-error" role="alert">
            <p>{catalogError}</p>
            {catalogProducts.length === 0 && (
              <button type="button" onClick={() => void loadInitialProducts()}>
                Try again
              </button>
            )}
          </div>
        )}

        {searchError && activeQuery && (
          <div className="catalog-error" role="alert">
            <p>{searchError}</p>
            <button
              type="button"
              onClick={() => {
                const query = activeQuery
                setActiveQuery('')
                window.requestAnimationFrame(() => setActiveQuery(query))
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!initialLoading &&
          !searchLoading &&
          !catalogError &&
          !searchError &&
          shownProducts.length === 0 && (
            <div className="catalog-empty">
              <span aria-hidden="true">⌕</span>
              <h2>{activeQuery ? 'No products found' : 'No products available'}</h2>
              <p>
                {activeQuery
                  ? `We couldn’t find anything matching “${activeQuery}”.`
                  : 'There are no products to display right now.'}
              </p>
              {activeQuery && (
                <button type="button" onClick={clearSearch}>
                  View all products
                </button>
              )}
            </div>
          )}

        {!initialLoading && !searchLoading && !searchError && shownProducts.length > 0 && (
          <div className="product-grid">
            {shownProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                reviews={[...(product.reviews ?? []), ...(addedReviews[product.id] ?? [])]}
                onOpenReviews={openReviews}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        {!activeQuery && catalogProducts.length > 0 && (
          <div className="load-more-area">
            {hasMore ? (
              <button
                className="load-more-button"
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
              >
                {loadingMore && <span className="spinner spinner--blue" aria-hidden="true" />}
                {loadingMore ? 'Loading more…' : 'Load more products'}
              </button>
            ) : (
              <p className="end-message">You’ve reached the end of the collection.</p>
            )}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ReviewDialog
          product={selectedProduct}
          reviews={[
            ...(selectedProduct.reviews ?? []),
            ...(addedReviews[selectedProduct.id] ?? []),
          ]}
          userId={userId}
          onClose={closeReviews}
          onCommentAdded={(review) =>
            setAddedReviews((current) => ({
              ...current,
              [selectedProduct.id]: [...(current[selectedProduct.id] ?? []), review],
            }))
          }
        />
      )}
    </main>
  )
}
