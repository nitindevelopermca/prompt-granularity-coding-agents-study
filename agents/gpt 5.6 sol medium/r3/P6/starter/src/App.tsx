import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const PRODUCTS_URL = 'https://dummyjson.com/products'
const SESSION_KEY = 'myshop.session'
const PAGE_SIZE = 10

type Session = {
  id: number
  accessToken: string
}

type LoginResponse = Session & {
  refreshToken?: string
}

type FieldErrors = {
  username?: string
  password?: string
}

type Review = {
  reviewerName: string
  rating?: number
  comment: string
  date: string
}

type Product = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  brand?: string | null
  thumbnail?: string | null
  images: string[]
  reviews: Review[]
}

type ProductsResponse = {
  products: Product[]
  total: number
}

type CartItem = {
  product: Product
  quantity: number
}

function readSession(): Session | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')

    if (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'number' &&
      'accessToken' in value &&
      typeof value.accessToken === 'string'
    ) {
      return { id: value.id, accessToken: value.accessToken }
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }

  return null
}

function Brand() {
  return (
    <div className="brand" aria-label="MyShop">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" focusable="false">
          <path d="M7 11h18l-1.5 16h-15L7 11Z" />
          <path d="M11 12V9a5 5 0 0 1 10 0v3" />
        </svg>
      </span>
      <span>MyShop</span>
    </div>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" className="eye-slash" />}
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="9.5" cy="19.5" r="1" />
      <circle cx="17.5" cy="19.5" r="1" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  )
}

type AppShellProps = {
  currentPath: string
  cartCount: number
  navigate: (path: string) => void
  children: React.ReactNode
}

function AppShell({
  currentPath,
  cartCount,
  navigate,
  children,
}: AppShellProps) {
  function handleNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    destination: string,
  ) {
    event.preventDefault()
    navigate(destination)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand-link"
            href="/products"
            onClick={(event) => handleNavigation(event, '/products')}
          >
            <Brand />
          </a>

          <nav aria-label="Main navigation">
            <a
              href="/products"
              aria-current={currentPath === '/products' ? 'page' : undefined}
              onClick={(event) => handleNavigation(event, '/products')}
            >
              Products
            </a>
            <a
              className="cart-link"
              href="/cart"
              aria-current={currentPath === '/cart' ? 'page' : undefined}
              onClick={(event) => handleNavigation(event, '/cart')}
            >
              <CartIcon />
              <span>Cart</span>
              <span
                className="cart-badge"
                aria-label={`${cartCount} items`}
                aria-live="polite"
              >
                {cartCount}
              </span>
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}

function isProductsResponse(value: unknown): value is ProductsResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'products' in value &&
    Array.isArray(value.products) &&
    value.products.every(
      (product) =>
        typeof product === 'object' &&
        product !== null &&
        'id' in product &&
        typeof product.id === 'number' &&
        'title' in product &&
        typeof product.title === 'string' &&
        'description' in product &&
        typeof product.description === 'string' &&
        'price' in product &&
        typeof product.price === 'number' &&
        'discountPercentage' in product &&
        typeof product.discountPercentage === 'number' &&
        'rating' in product &&
        typeof product.rating === 'number' &&
        (!('brand' in product) ||
          product.brand === undefined ||
          product.brand === null ||
          typeof product.brand === 'string') &&
        (!('thumbnail' in product) ||
          product.thumbnail === undefined ||
          product.thumbnail === null ||
          typeof product.thumbnail === 'string') &&
        'images' in product &&
        Array.isArray(product.images) &&
        product.images.every((image: unknown) => typeof image === 'string') &&
        'reviews' in product &&
        Array.isArray(product.reviews) &&
        product.reviews.every(
          (review: unknown) =>
            typeof review === 'object' &&
            review !== null &&
            'reviewerName' in review &&
            typeof review.reviewerName === 'string' &&
            'rating' in review &&
            typeof review.rating === 'number' &&
            'comment' in review &&
            typeof review.comment === 'string' &&
            'date' in review &&
            typeof review.date === 'string',
        ),
    ) &&
    'total' in value &&
    typeof value.total === 'number'
  )
}

type ProductCardProps = {
  product: Product
  onOpenReviews: (product: Product, trigger: HTMLButtonElement) => void
  onAddToCart: (product: Product) => Promise<void>
}

function ProductCard({
  product,
  onOpenReviews,
  onAddToCart,
}: ProductCardProps) {
  const imageOptions = product.images.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : []
  const initialImage =
    product.thumbnail && imageOptions.includes(product.thumbnail)
      ? product.thumbnail
      : imageOptions[0] ?? product.thumbnail ?? ''
  const [selectedImage, setSelectedImage] = useState(initialImage)
  const [failedImages, setFailedImages] = useState<Set<string>>(
    () => new Set(),
  )
  const [isAdding, setIsAdding] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const imageIsAvailable =
    Boolean(selectedImage) && !failedImages.has(selectedImage)

  function markImageFailed(image: string) {
    setFailedImages((current) => {
      const next = new Set(current)
      next.add(image)
      return next
    })
  }

  async function handleAddToCart() {
    if (isAdding) return

    setIsAdding(true)
    setCartMessage('')
    setCartError('')

    try {
      await onAddToCart(product)
      setCartMessage('Added to cart.')
    } catch {
      setCartError(
        'Could not add this product. Your existing cart is unchanged.',
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-gallery">
        <div className="main-image-wrap">
          {imageIsAvailable ? (
            <img
              className="main-image"
              src={selectedImage}
              alt={product.title}
              loading="lazy"
              onError={() => markImageFailed(selectedImage)}
            />
          ) : (
            <div className="image-fallback" role="img" aria-label="No image available">
              <span aria-hidden="true">◇</span>
              <span>Image unavailable</span>
            </div>
          )}
        </div>

        {imageOptions.length > 0 && (
          <div className="thumbnail-strip" aria-label={`Images for ${product.title}`}>
            {imageOptions.map((image, index) => (
              <button
                className="thumbnail-button"
                type="button"
                key={`${image}-${index}`}
                onClick={() => setSelectedImage(image)}
                aria-label={`Image ${index + 1} of ${imageOptions.length}`}
                aria-pressed={selectedImage === image}
              >
                {failedImages.has(image) ? (
                  <span className="thumbnail-fallback" aria-hidden="true">
                    ◇
                  </span>
                ) : (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => markImageFailed(image)}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-content">
        <p className="product-brand">{product.brand?.trim() || 'Unbranded'}</p>
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>

        <div className="product-price-row">
          <p className="product-price">${product.price.toFixed(2)}</p>
          <p className="discount">{product.discountPercentage.toFixed(1)}% off</p>
        </div>

        <button
          className="review-control"
          type="button"
          onClick={(event) => onOpenReviews(product, event.currentTarget)}
          aria-label={`View ${product.reviews.length} reviews for ${product.title}, rated ${product.rating} out of 5`}
        >
          <span className="stars" aria-hidden="true">
            ★
          </span>
          <span>{product.rating.toFixed(1)}</span>
          <span className="review-count">
            ({product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </button>

        <button
          className="add-cart-button"
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding && <span className="spinner" aria-hidden="true" />}
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
        <div className="add-cart-feedback" aria-live="polite">
          {cartMessage && <p>{cartMessage}</p>}
          {cartError && (
            <p className="add-cart-error" role="alert">
              {cartError}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

type ReviewModalProps = {
  product: Product
  userId: number
  onClose: () => void
  onCommentAdded: (review: Review) => void
}

function ReviewModal({
  product,
  userId,
  onClose,
  onCommentAdded,
}: ReviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [commentError, setCommentError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const appRoot = document.getElementById('root')
    const previousOverflow = document.body.style.overflow
    if (appRoot) appRoot.inert = true
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      if (appRoot) appRoot.inert = false
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()

    if (!body) {
      setCommentError('Enter a comment before submitting.')
      return
    }

    setCommentError('')
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('https://dummyjson.com/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          postId: product.id,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Comment request failed with status ${response.status}`)
      }

      onCommentAdded({
        reviewerName: 'You',
        rating: rating ? Number(rating) : undefined,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating('')
    } catch {
      setSubmitError(
        'We could not add your comment. Existing reviews are unchanged.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Date unavailable'
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="review-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-title"
        aria-describedby="reviews-product"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow" id="reviews-product">
              {product.title}
            </p>
            <h2 id="reviews-title">Reviews</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close reviews"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="reviews-list-wrap">
          {product.reviews.length === 0 ? (
            <div className="reviews-empty">
              <h3>No reviews yet</h3>
              <p>Be the first to leave a comment about this product.</p>
            </div>
          ) : (
            <ul className="reviews-list">
              {product.reviews.map((review, index) => (
                <li key={`${review.reviewerName}-${review.date}-${index}`}>
                  <div className="review-meta">
                    <strong>{review.reviewerName}</strong>
                    <time dateTime={review.date}>{formatDate(review.date)}</time>
                  </div>
                  {review.rating !== undefined && (
                    <p
                      className="review-stars"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      <span aria-hidden="true">
                        {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
                      </span>
                    </p>
                  )}
                  <p className="review-comment">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="comment-form" onSubmit={handleCommentSubmit} noValidate>
          <h3>Add a comment</h3>

          {submitError && (
            <div className="comment-submit-error" role="alert">
              {submitError}
            </div>
          )}

          <label htmlFor="comment-text">Your comment</label>
          <textarea
            id="comment-text"
            value={comment}
            rows={3}
            placeholder="Share your thoughts"
            onChange={(event) => {
              setComment(event.target.value)
              if (commentError) setCommentError('')
            }}
            aria-invalid={Boolean(commentError)}
            aria-describedby={commentError ? 'comment-error' : undefined}
            disabled={isSubmitting}
          />
          {commentError && (
            <p className="field-error" id="comment-error" role="alert">
              {commentError}
            </p>
          )}

          <div className="comment-actions">
            <div>
              <label htmlFor="comment-rating">Rating (optional)</label>
              <select
                id="comment-rating"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">No rating</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting && <span className="spinner" aria-hidden="true" />}
              {isSubmitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

type ProductsPageProps = {
  userId: number
  onAddToCart: (product: Product) => Promise<void>
}

function ProductsPage({ userId, onAddToCart }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null)

  async function fetchPage(skip: number, signal?: AbortSignal) {
    const response = await fetch(
      `${PRODUCTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`,
      { signal },
    )

    if (!response.ok) {
      throw new Error(`Products request failed with status ${response.status}`)
    }

    const data: unknown = await response.json()
    if (!isProductsResponse(data)) {
      throw new Error('Products response was not in the expected format')
    }

    return data
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadInitialProducts() {
      setIsInitialLoading(true)
      setError('')

      try {
        const data = await fetchPage(0, controller.signal)
        setProducts(data.products)
        setTotal(data.total)
        setNextSkip(PAGE_SIZE)
        setHasMore(
          data.products.length > 0 && data.products.length < data.total,
        )
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return
        }
        setError('We could not load products. Please try again.')
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false)
      }
    }

    void loadInitialProducts()
    return () => controller.abort()
  }, [])

  async function loadMore() {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setError('')

    try {
      const data = await fetchPage(nextSkip)
      setProducts((current) => [...current, ...data.products])
      setTotal(data.total)
      setHasMore(
        data.products.length > 0 &&
          nextSkip + data.products.length < data.total,
      )
      setNextSkip((current) => current + PAGE_SIZE)
    } catch {
      setError(
        'We could not load more products. Your existing products are still available.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()

    if (!query) {
      setSearchQuery('')
      setSearchResults(null)
      setSearchError('')
      return
    }

    setIsSearching(true)
    setSearchError('')
    setSearchQuery(query)

    try {
      const response = await fetch(
        `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
      )
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`)
      }

      const data: unknown = await response.json()
      if (!isProductsResponse(data)) {
        throw new Error('Search response was not in the expected format')
      }
      setSearchResults(data.products)
    } catch {
      setSearchResults(null)
      setSearchError('We could not complete your search. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const visibleProducts = searchResults ?? products
  const isSearchView = searchResults !== null

  function openReviews(product: Product, trigger: HTMLButtonElement) {
    reviewTriggerRef.current = trigger
    setSelectedProduct(product)
  }

  function closeReviews() {
    setSelectedProduct(null)
    window.requestAnimationFrame(() => reviewTriggerRef.current?.focus())
  }

  function addLocalReview(review: Review) {
    if (!selectedProduct) return

    const updateProduct = (product: Product) =>
      product.id === selectedProduct.id
        ? { ...product, reviews: [...product.reviews, review] }
        : product

    setProducts((current) => current.map(updateProduct))
    setSearchResults((current) => current?.map(updateProduct) ?? null)
    setSelectedProduct((current) =>
      current
        ? { ...current, reviews: [...current.reviews, review] }
        : current,
    )
  }

  return (
    <main className="catalog-main" id="main-content">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Our collection</p>
          <h1>All Products</h1>
        </div>
        {!isInitialLoading && (
          <p className="showing-count" aria-live="polite">
            Showing {products.length} of {total} products
          </p>
        )}
      </div>

      <form className="search-form" role="search" onSubmit={handleSearch}>
        <label htmlFor="product-search">Search products</label>
        <div className="search-controls">
          <div className="search-input-wrap">
            <SearchIcon />
            <input
              id="product-search"
              type="search"
              value={searchInput}
              placeholder="Search by product name"
              onChange={(event) => {
                const nextValue = event.target.value
                setSearchInput(nextValue)
                if (!nextValue.trim()) {
                  setSearchQuery('')
                  setSearchResults(null)
                  setSearchError('')
                }
              }}
              disabled={isSearching}
            />
          </div>
          <button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {isInitialLoading && (
        <div className="catalog-status" role="status">
          <span className="spinner spinner-blue" aria-hidden="true" />
          <span>Loading products…</span>
        </div>
      )}

      {searchError && (
        <div className="catalog-error" role="alert">
          <span>{searchError}</span>
        </div>
      )}

      {isSearching && (
        <div className="catalog-status search-status" role="status">
          <span className="spinner spinner-blue" aria-hidden="true" />
          <span>Searching products…</span>
        </div>
      )}

      {error && (
        <div className="catalog-error" role="alert">
          <span>{error}</span>
          {products.length === 0 && (
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
        </div>
      )}

      {!isInitialLoading && products.length === 0 && !error && (
        <div className="empty-state">
          <h2>No products available</h2>
          <p>The catalog is currently empty. Please check back later.</p>
        </div>
      )}

      {!isSearching && isSearchView && searchResults.length === 0 && (
        <div className="empty-state" role="status">
          <h2>No matches found</h2>
          <p>Try another search term or clear the search to view the catalog.</p>
        </div>
      )}

      {!isSearching && visibleProducts.length > 0 && (
        <>
          {isSearchView && (
            <p className="search-summary" aria-live="polite">
              {visibleProducts.length} results for “{searchQuery}”
            </p>
          )}
          <ul className="product-list" aria-label="Products">
            {visibleProducts.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  onOpenReviews={openReviews}
                  onAddToCart={onAddToCart}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {!isSearchView && products.length > 0 && hasMore && (
        <div className="load-more-wrap">
          <button
            className="load-more-button"
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore && (
              <span className="spinner" aria-hidden="true" />
            )}
            {isLoadingMore ? 'Loading more…' : 'Load more products'}
          </button>
        </div>
      )}

      {!isSearchView && products.length > 0 && !hasMore && (
        <p className="end-of-list" role="status">
          You’ve reached the end of the catalog.
        </p>
      )}

      {selectedProduct && (
        <ReviewModal
          product={selectedProduct}
          userId={userId}
          onClose={closeReviews}
          onCommentAdded={addLocalReview}
        />
      )}
    </main>
  )
}

type CartLineProps = {
  item: CartItem
  onChangeQuantity: (productId: number, change: number) => void
  onRemove: (productId: number) => void
}

function CartLine({
  item,
  onChangeQuantity,
  onRemove,
}: CartLineProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = item.product.thumbnail || item.product.images[0] || ''
  const lineTotal = item.product.price * item.quantity

  return (
    <li className="cart-line">
      <div className="cart-product">
        <div className="cart-image-wrap">
          {image && !imageFailed ? (
            <img
              src={image}
              alt=""
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span aria-hidden="true">◇</span>
          )}
        </div>
        <div>
          <h2>{item.product.title}</h2>
          <button
            className="remove-button"
            type="button"
            onClick={() => onRemove(item.product.id)}
            aria-label={`Remove ${item.product.title} from cart`}
          >
            Remove
          </button>
        </div>
      </div>

      <p className="cart-unit-price" aria-label="Unit price">
        ${item.product.price.toFixed(2)}
      </p>

      <div
        className="quantity-stepper"
        role="group"
        aria-label={`Quantity for ${item.product.title}`}
      >
        <button
          type="button"
          onClick={() => onChangeQuantity(item.product.id, -1)}
          disabled={item.quantity === 1}
          aria-label={`Decrease ${item.product.title} quantity`}
        >
          −
        </button>
        <output aria-live="polite" aria-label="Quantity">
          {item.quantity}
        </output>
        <button
          type="button"
          onClick={() => onChangeQuantity(item.product.id, 1)}
          aria-label={`Increase ${item.product.title} quantity`}
        >
          +
        </button>
      </div>

      <p className="cart-line-total" aria-label="Line total">
        ${lineTotal.toFixed(2)}
      </p>
    </li>
  )
}

type CartPageProps = {
  items: CartItem[]
  navigate: (path: string) => void
  onChangeQuantity: (productId: number, change: number) => void
  onRemove: (productId: number) => void
  onPlaceOrder: () => void
}

function CartPage({
  items,
  navigate,
  onChangeQuantity,
  onRemove,
  onPlaceOrder,
}: CartPageProps) {
  const [orderPlaced, setOrderPlaced] = useState(false)
  const successRef = useRef<HTMLDivElement>(null)
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  useEffect(() => {
    if (orderPlaced) successRef.current?.focus()
  }, [orderPlaced])

  function placeOrder() {
    if (items.length === 0) return
    onPlaceOrder()
    setOrderPlaced(true)
  }

  if (orderPlaced) {
    return (
      <main className="cart-main" id="main-content">
        <div
          className="order-success"
          ref={successRef}
          role="status"
          tabIndex={-1}
        >
          <span className="success-mark" aria-hidden="true">
            ✓
          </span>
          <p className="eyebrow">Order complete</p>
          <h1>Thank you for your order!</h1>
          <p>Your order was placed successfully.</p>
          <button type="button" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-main" id="main-content">
      <div className="cart-heading">
        <p className="eyebrow">Your order</p>
        <h1>
          Your Cart <span>({itemCount})</span>
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <CartIcon />
          <h2>Your cart is empty</h2>
          <p>Add a product to get started.</p>
          <button type="button" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-labelledby="cart-items-title">
            <h2 id="cart-items-title" className="visually-hidden">
              Cart items
            </h2>
            <div className="cart-columns" aria-hidden="true">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            <ul>
              {items.map((item) => (
                <CartLine
                  key={item.product.id}
                  item={item}
                  onChangeQuantity={onChangeQuantity}
                  onRemove={onRemove}
                />
              ))}
            </ul>
            <button
              className="continue-button"
              type="button"
              onClick={() => navigate('/products')}
            >
              ← Continue Shopping
            </button>
          </section>

          <aside className="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>${subtotal.toFixed(2)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd>${subtotal.toFixed(2)}</dd>
              </div>
            </dl>
            <button type="button" onClick={placeOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [path, setPath] = useState(window.location.pathname)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const isAppPath = path === '/products' || path === '/cart'
    if (session && !isAppPath) {
      window.history.replaceState({}, '', '/products')
      setPath('/products')
    }
  }, [path, session])

  useEffect(() => {
    document.title = session
      ? path === '/cart'
        ? 'Cart | MyShop'
        : 'Products | MyShop'
      : 'Login | MyShop'
  }, [path, session])

  function navigate(destination: string) {
    if (destination === path) return
    window.history.pushState({}, '', destination)
    setPath(destination)
    window.scrollTo({ top: 0 })
  }

  async function addToCart(product: Product) {
    if (!session) throw new Error('A session is required to add to cart')

    const response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.id,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Cart request failed with status ${response.status}`)
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  function changeCartQuantity(productId: number, change: number) {
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item,
      ),
    )
  }

  function removeFromCart(productId: number) {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId),
    )
  }

  function placeOrder() {
    setCartItems([])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    if (!username.trim()) nextErrors.username = 'Enter your username.'
    if (!password) nextErrors.password = 'Enter your password.'

    setFieldErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          expiresInMins: 60,
        }),
      })

      const data: unknown = await response.json()

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : ''

        if (response.status === 400 && message === 'Invalid credentials') {
          setFormError('Invalid username or password. Please try again.')
        } else {
          setFormError('We could not sign you in. Please try again.')
        }
        return
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        !('id' in data) ||
        typeof data.id !== 'number' ||
        !('accessToken' in data) ||
        typeof data.accessToken !== 'string'
      ) {
        setFormError('We received an unexpected response. Please try again.')
        return
      }

      const login = data as LoginResponse
      const nextSession: Session = {
        id: login.id,
        accessToken: login.accessToken,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      window.history.pushState({}, '', '/products')
      setPath('/products')
      setSession(nextSession)
    } catch {
      setFormError(
        'Unable to connect. Check your internet connection and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (session) {
    const cartCount = cartItems.reduce(
      (count, item) => count + item.quantity,
      0,
    )

    return (
      <AppShell
        currentPath={path}
        cartCount={cartCount}
        navigate={navigate}
      >
        {path === '/cart' ? (
          <CartPage
            items={cartItems}
            navigate={navigate}
            onChangeQuantity={changeCartQuantity}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
          />
        ) : (
          <ProductsPage userId={session.id} onAddToCart={addToCart} />
        )}
      </AppShell>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Brand />

        <div className="login-heading">
          <h1 id="login-title">Welcome Back</h1>
          <p>Sign in to continue shopping</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-error" role="alert">
              {formError}
            </div>
          )}

          <div className="field-group">
            <label htmlFor="username">Username</label>
            <div
              className={`input-shell${fieldErrors.username ? ' input-shell-error' : ''}`}
            >
              <span className="input-icon">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({
                      ...current,
                      username: undefined,
                    }))
                  }
                }}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? 'username-error' : undefined
                }
                disabled={isLoading}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id="username-error" role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div
              className={`input-shell${fieldErrors.password ? ' input-shell-error' : ''}`}
            >
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }))
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                disabled={isLoading}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
            {fieldErrors.password && (
              <p className="field-error" id="password-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading && <span className="spinner" aria-hidden="true" />}
            {isLoading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
