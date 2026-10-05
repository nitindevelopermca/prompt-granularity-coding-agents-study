import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

const PRODUCTS_URL = 'https://dummyjson.com/products'
const COMMENTS_URL = 'https://dummyjson.com/comments/add'
const PAGE_SIZE = 10

type Review = {
  reviewerName: string
  rating: number | null
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
  brand: string | null
  thumbnail: string
  images: string[]
  reviews: Review[]
}

type ProductsResponse = {
  products: Product[]
  total: number
}

type ProductsPageProps = {
  userId: number
  username: string
  onAddToCart: (product: Product) => Promise<void>
}

let initialCatalogRequest: Promise<ProductsResponse> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeReview(value: unknown): Review | null {
  if (!isRecord(value)) return null
  if (
    typeof value.reviewerName !== 'string' ||
    typeof value.comment !== 'string' ||
    typeof value.date !== 'string'
  ) {
    return null
  }

  return {
    reviewerName: value.reviewerName,
    rating: typeof value.rating === 'number' ? value.rating : null,
    comment: value.comment,
    date: value.date,
  }
}

function normalizeProduct(value: unknown): Product | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'number' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.price !== 'number'
  ) {
    return null
  }

  const reviews = Array.isArray(value.reviews)
    ? value.reviews
        .map(normalizeReview)
        .filter((review): review is Review => review !== null)
    : []
  const images = Array.isArray(value.images)
    ? value.images.filter(
        (image): image is string => typeof image === 'string' && image.length > 0,
      )
    : []

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    price: value.price,
    discountPercentage:
      typeof value.discountPercentage === 'number'
        ? value.discountPercentage
        : 0,
    rating: typeof value.rating === 'number' ? value.rating : 0,
    brand:
      typeof value.brand === 'string' && value.brand.trim()
        ? value.brand
        : null,
    thumbnail: typeof value.thumbnail === 'string' ? value.thumbnail : '',
    images,
    reviews,
  }
}

async function fetchProducts(url: string): Promise<ProductsResponse> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Products request failed: ${response.status}`)

  const data = (await response.json()) as unknown
  if (!isRecord(data) || !Array.isArray(data.products)) {
    throw new Error('Invalid products response')
  }

  return {
    products: data.products
      .map(normalizeProduct)
      .filter((product): product is Product => product !== null),
    total: typeof data.total === 'number' ? data.total : data.products.length,
  }
}

function getInitialCatalog(): Promise<ProductsResponse> {
  if (!initialCatalogRequest) {
    initialCatalogRequest = fetchProducts(
      `${PRODUCTS_URL}?limit=${PAGE_SIZE}&skip=0`,
    ).catch((error: unknown) => {
      initialCatalogRequest = null
      throw error
    })
  }
  return initialCatalogRequest
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="not-rated">Not rated</span>

  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      <span aria-hidden="true">
        {'★'.repeat(Math.max(0, Math.min(5, Math.round(value))))}
        {'☆'.repeat(Math.max(0, 5 - Math.round(value)))}
      </span>
    </span>
  )
}

function ProductCard({
  product,
  onOpenReviews,
  onAddToCart,
}: {
  product: Product
  onOpenReviews: (id: number) => void
  onAddToCart: (product: Product) => Promise<void>
}) {
  const firstImage = product.thumbnail || product.images[0] || ''
  const [mainImage, setMainImage] = useState(firstImage)
  const [mainImageFailed, setMainImageFailed] = useState(!firstImage)
  const [failedMainImages, setFailedMainImages] = useState<Set<string>>(
    () => new Set(),
  )
  const [brokenThumbnails, setBrokenThumbnails] = useState<Set<number>>(
    () => new Set(),
  )
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState('')
  const [cartStatus, setCartStatus] = useState('')

  function handleMainImageError() {
    const failed = new Set(failedMainImages)
    failed.add(mainImage)
    setFailedMainImages(failed)
    const fallback = product.images.find((image) => !failed.has(image))
    if (fallback) {
      setMainImage(fallback)
      setMainImageFailed(false)
    } else {
      setMainImageFailed(true)
    }
  }

  async function handleAddToCart() {
    setIsAdding(true)
    setCartError('')
    setCartStatus('')
    try {
      await onAddToCart(product)
      setCartStatus('Added to cart.')
    } catch {
      setCartError('Could not add this product. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-image-stage">
        {mainImageFailed ? (
          <div
            className="image-fallback"
            role="img"
            aria-label={`Image unavailable for ${product.title}`}
          >
            <span aria-hidden="true">▧</span>
            Image unavailable
          </div>
        ) : (
          <img
            src={mainImage}
            alt={product.title}
            onError={handleMainImageError}
            loading="lazy"
          />
        )}
      </div>

      {product.images.length > 0 && (
        <div className="thumbnail-strip" aria-label={`${product.title} images`}>
          {product.images.map((image, index) => (
            <button
              className={mainImage === image ? 'selected' : ''}
              type="button"
              key={`${image}-${index}`}
              aria-label={`Image ${index + 1} of ${product.images.length}`}
              aria-pressed={mainImage === image}
              onClick={() => {
                setMainImage(image)
                setMainImageFailed(brokenThumbnails.has(index))
              }}
            >
              {brokenThumbnails.has(index) ? (
                <span className="thumb-fallback" aria-hidden="true">
                  ▧
                </span>
              ) : (
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  onError={() =>
                    setBrokenThumbnails((current) => {
                      const next = new Set(current)
                      next.add(index)
                      return next
                    })
                  }
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="product-content">
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>

        <div className="price-row">
          <span className="price">${product.price.toFixed(2)}</span>
          {product.discountPercentage > 0 && (
            <span className="discount">
              {product.discountPercentage.toFixed(1)}% off
            </span>
          )}
        </div>

        <button
          className="review-control"
          type="button"
          onClick={() => onOpenReviews(product.id)}
          aria-label={`Open ${product.reviews.length} reviews for ${product.title}; rated ${product.rating} out of 5`}
        >
          <StarRating value={product.rating} />
          <span>
            {product.rating.toFixed(1)} ({product.reviews.length}{' '}
            {product.reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </button>

        <p className="brand">
          <span>Brand:</span> {product.brand ?? 'Brand not available'}
        </p>
      </div>

      {cartError && (
        <p className="cart-add-error" role="alert">
          {cartError}
        </p>
      )}
      {cartStatus && (
        <p className="cart-add-status" role="status">
          {cartStatus}
        </p>
      )}
      <button
        className="add-cart-button"
        type="button"
        aria-label={`Add ${product.title} to cart`}
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        <CartIcon />
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
    </article>
  )
}

function ReviewModal({
  product,
  userId,
  username,
  onAddReview,
  onClose,
}: {
  product: Product
  userId: number
  username: string
  onAddReview: (productId: number, review: Review) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [commentError, setCommentError] = useState('')
  const [postError, setPostError] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment before submitting.')
      return
    }

    setCommentError('')
    setPostError('')
    setIsPosting(true)
    try {
      const response = await fetch(COMMENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          postId: product.id,
          userId,
        }),
      })
      if (!response.ok) throw new Error(`Comment request failed: ${response.status}`)

      onAddReview(product.id, {
        reviewerName: username,
        rating: rating ? Number(rating) : null,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating('')
    } catch {
      setPostError('Your comment could not be added. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <dialog
      className="review-dialog"
      ref={dialogRef}
      aria-labelledby="reviews-heading"
      onClose={onClose}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="dialog-panel">
        <div className="dialog-heading">
          <div>
            <h2 id="reviews-heading">Reviews</h2>
            <p>{product.title}</p>
          </div>
          <button
            className="dialog-close"
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close reviews"
          >
            ×
          </button>
        </div>

        <div className="review-layout">
          <section className="reviews-list" aria-label="Customer reviews">
            {product.reviews.length === 0 ? (
              <div className="empty-reviews">
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience.</p>
              </div>
            ) : (
              product.reviews.map((review, index) => (
                <article
                  className="review-row"
                  key={`${review.reviewerName}-${review.date}-${index}`}
                >
                  <div className="review-meta">
                    <h3>{review.reviewerName}</h3>
                    <time dateTime={review.date}>
                      {new Intl.DateTimeFormat(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(review.date))}
                    </time>
                  </div>
                  <StarRating value={review.rating} />
                  <p>{review.comment}</p>
                </article>
              ))
            )}
          </section>

          <section className="comment-section" aria-labelledby="comment-heading">
            <h3 id="comment-heading">Add a comment</h3>
            <form onSubmit={handleCommentSubmit} noValidate>
              <label htmlFor="comment-rating">Your rating (optional)</label>
              <select
                id="comment-rating"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                disabled={isPosting}
              >
                <option value="">No rating</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>

              <label htmlFor="comment-body">Comment</label>
              <textarea
                id="comment-body"
                value={comment}
                placeholder="Write your comment"
                rows={5}
                onChange={(event) => {
                  setComment(event.target.value)
                  if (commentError) setCommentError('')
                }}
                aria-invalid={Boolean(commentError)}
                aria-describedby={commentError ? 'comment-error' : undefined}
                disabled={isPosting}
              />
              {commentError && (
                <p className="field-error" id="comment-error">
                  {commentError}
                </p>
              )}
              {postError && (
                <p className="comment-post-error" role="alert">
                  {postError}
                </p>
              )}
              <button
                className="submit-comment"
                type="submit"
                disabled={isPosting}
              >
                {isPosting ? 'Submitting…' : 'Submit comment'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </dialog>
  )
}

export default function ProductsPage({
  userId,
  username,
  onAddToCart,
}: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let active = true
    getInitialCatalog()
      .then((data) => {
        if (!active) return
        setProducts(data.products)
        setTotal(data.total)
        setHasMore(data.products.length < data.total)
      })
      .catch(() => {
        if (active) {
          setCatalogError(
            'Products could not be loaded. Check your connection and try again.',
          )
        }
      })
      .finally(() => {
        if (active) setIsInitialLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function loadMore() {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setCatalogError('')
    const skip = nextSkip
    try {
      const data = await fetchProducts(
        `${PRODUCTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`,
      )
      setProducts((current) => [...current, ...data.products])
      setTotal(data.total)
      setNextSkip(skip + PAGE_SIZE)
      setHasMore(skip + data.products.length < data.total)
    } catch {
      setCatalogError(
        'More products could not be loaded. Your current products are still available.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery) {
      searchAbortRef.current?.abort()
      setSubmittedQuery('')
      setSearchResults(null)
      setSearchError('')
      setIsSearching(false)
      return
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    setSubmittedQuery(cleanQuery)
    setSearchError('')
    setIsSearching(true)

    try {
      const response = await fetch(
        `${PRODUCTS_URL}/search?q=${encodeURIComponent(cleanQuery)}`,
        { signal: controller.signal },
      )
      if (!response.ok) throw new Error(`Search request failed: ${response.status}`)
      const data = (await response.json()) as unknown
      if (!isRecord(data) || !Array.isArray(data.products)) {
        throw new Error('Invalid search response')
      }
      setSearchResults(
        data.products
          .map(normalizeProduct)
          .filter((product): product is Product => product !== null),
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setSearchResults(null)
      setSearchError(
        'Search is unavailable right now. Your loaded catalog is unchanged.',
      )
    } finally {
      if (!controller.signal.aborted) setIsSearching(false)
    }
  }

  function clearSearch() {
    searchAbortRef.current?.abort()
    setQuery('')
    setSubmittedQuery('')
    setSearchResults(null)
    setSearchError('')
    setIsSearching(false)
  }

  function updateReviews(productId: number, review: Review) {
    const appendReview = (product: Product) =>
      product.id === productId
        ? { ...product, reviews: [...product.reviews, review] }
        : product
    setProducts((current) => current.map(appendReview))
    setSearchResults((current) =>
      current ? current.map(appendReview) : current,
    )
  }

  function openReviews(productId: number) {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setSelectedProductId(productId)
  }

  function closeReviews() {
    setSelectedProductId(null)
    window.requestAnimationFrame(() => returnFocusRef.current?.focus())
  }

  const visibleProducts = searchResults ?? products
  const selectedProduct =
    visibleProducts.find((product) => product.id === selectedProductId) ??
    products.find((product) => product.id === selectedProductId)

  return (
    <section className="products-page" aria-labelledby="products-heading">
      <div className="catalog-toolbar">
        <div>
          <h1 id="products-heading">All Products</h1>
          <p className="showing-count" aria-live="polite">
            {submittedQuery && searchResults
              ? `Showing ${searchResults.length} ${
                  searchResults.length === 1 ? 'result' : 'results'
                } for “${submittedQuery}”`
              : `Showing ${products.length}${
                  total ? ` of ${total}` : ''
                } products`}
          </p>
        </div>

        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="product-search">
            Search products
          </label>
          <div className="search-box">
            <input
              id="product-search"
              type="search"
              value={query}
              placeholder="Search products"
              onChange={(event) => {
                const value = event.target.value
                setQuery(value)
                if (!value.trim() && (searchResults || submittedQuery)) {
                  clearSearch()
                }
              }}
            />
            <button type="submit" aria-label="Search" disabled={isSearching}>
              <SearchIcon />
            </button>
          </div>
        </form>
      </div>

      {searchError && (
        <div className="catalog-alert" role="alert">
          <span>{searchError}</span>
          <button type="button" onClick={clearSearch}>
            Back to catalog
          </button>
        </div>
      )}

      {catalogError && (
        <div className="catalog-alert" role="alert">
          <span>{catalogError}</span>
          {products.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setCatalogError('')
                setIsInitialLoading(true)
                getInitialCatalog()
                  .then((data) => {
                    setProducts(data.products)
                    setTotal(data.total)
                    setHasMore(data.products.length < data.total)
                  })
                  .catch(() =>
                    setCatalogError(
                      'Products could not be loaded. Check your connection and try again.',
                    ),
                  )
                  .finally(() => setIsInitialLoading(false))
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {(isInitialLoading || isSearching) && (
        <div className="catalog-status" role="status">
          <span className="spinner blue" aria-hidden="true" />
          {isSearching ? 'Searching products…' : 'Loading products…'}
        </div>
      )}

      {!isInitialLoading && !isSearching && visibleProducts.length === 0 && (
        <div className="catalog-empty">
          <h2>{searchResults ? 'No matching products' : 'No products found'}</h2>
          <p>
            {searchResults
              ? 'Try a different search term.'
              : 'There are no products to display right now.'}
          </p>
          {searchResults && (
            <button type="button" onClick={clearSearch}>
              View all products
            </button>
          )}
        </div>
      )}

      {!isSearching && visibleProducts.length > 0 && (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenReviews={openReviews}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {!searchResults && !submittedQuery && hasMore && products.length > 0 && (
        <div className="load-more-area">
          <button type="button" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading more…' : 'Load more'}
          </button>
        </div>
      )}

      {!searchResults &&
        !submittedQuery &&
        !hasMore &&
        products.length > 0 && (
          <p className="end-message">You’ve reached the end of the catalog.</p>
        )}

      {selectedProduct && (
        <ReviewModal
          product={selectedProduct}
          userId={userId}
          username={username}
          onAddReview={updateReviews}
          onClose={closeReviews}
        />
      )}
    </section>
  )
}
