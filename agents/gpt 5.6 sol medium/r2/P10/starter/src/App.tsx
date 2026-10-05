import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const SESSION_KEY = 'myshop.session'
const CART_KEY = 'myshop.cart'

type Session = {
  id: number
  accessToken: string
}

type LoginResponse = Session & {
  refreshToken?: string
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
  brand?: string
  thumbnail: string
  images: string[]
  reviews: Review[]
}

type ProductsResponse = {
  products: Product[]
  total: number
  skip: number
  limit: number
}

type FieldErrors = {
  username?: string
  password?: string
}

type CartItem = {
  product: Product
  quantity: number
}

function readSession(): Session | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const parsed: unknown = JSON.parse(stored)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Session).id === 'number' &&
      typeof (parsed as Session).accessToken === 'string'
    ) {
      return parsed as Session
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
  }

  return null
}

function readCart(): CartItem[] {
  try {
    const stored = sessionStorage.getItem(CART_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed as CartItem[]
  } catch {
    sessionStorage.removeItem(CART_KEY)
  }
  return []
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.75 8.25h10.5l1 11.25H5.75l1-11.25Z" />
      <path d="M9 9V6.75a3 3 0 0 1 6 0V9" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l1.7 9.1a2 2 0 0 0 2 1.65h7.95a2 2 0 0 0 1.95-1.55L20 7H6" />
      <circle cx="9" cy="19" r="1.25" />
      <circle cx="17" cy="19" r="1.25" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.75 19c.55-3.35 2.63-5 6.25-5s5.7 1.65 6.25 5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.75" y="10" width="12.5" height="9.5" rx="2" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.75 12s3.25-5 9.25-5 9.25 5 9.25 5-3.25 5-9.25 5-9.25-5-9.25-5Z" />
      <circle cx="12" cy="12" r="2.25" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  )
}

function Login({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const usernameId = useId()
  const passwordId = useId()
  const formErrorId = useId()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FieldErrors = {}

    if (!username.trim()) nextErrors.username = 'Enter your username.'
    if (!password) nextErrors.password = 'Enter your password.'

    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!response.ok) {
        if (response.status === 400) {
          setFormError('Invalid username or password. Please try again.')
        } else {
          setFormError('We could not sign you in. Please try again.')
        }
        return
      }

      const data = (await response.json()) as LoginResponse
      if (typeof data.id !== 'number' || !data.accessToken) {
        throw new Error('Login response did not include the required session data.')
      }

      const session = { id: data.id, accessToken: data.accessToken }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      onSuccess(session)
    } catch {
      setFormError('Unable to connect. Check your internet connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="brand" aria-label="MyShop">
          <span className="brand-mark">
            <BagIcon />
          </span>
          <span>MyShop</span>
        </div>

        <div className="intro">
          <h1 id="login-heading">Welcome Back</h1>
          <p>Sign in to continue shopping</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor={usernameId}>Username</label>
            <div className={`input-shell ${errors.username ? 'input-error' : ''}`}>
              <span className="field-icon"><UserIcon /></span>
              <input
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (errors.username) setErrors((current) => ({ ...current, username: undefined }))
                }}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? `${usernameId}-error` : undefined}
                disabled={isLoading}
              />
            </div>
            {errors.username && <p className="field-error" id={`${usernameId}-error`}>{errors.username}</p>}
          </div>

          <div className="field">
            <label htmlFor={passwordId}>Password</label>
            <div className={`input-shell ${errors.password ? 'input-error' : ''}`}>
              <span className="field-icon"><LockIcon /></span>
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (errors.password) setErrors((current) => ({ ...current, password: undefined }))
                }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                disabled={isLoading}
              />
              <button
                className="visibility-button"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
            {errors.password && <p className="field-error" id={`${passwordId}-error`}>{errors.password}</p>}
          </div>

          {formError && (
            <div className="form-error" id={formErrorId} role="alert">
              {formError}
            </div>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={isLoading}
            aria-describedby={formError ? formErrorId : undefined}
          >
            {isLoading && <span className="spinner" aria-hidden="true" />}
            {isLoading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

type AppDestination = 'products' | 'cart'

function destinationFromPath(): AppDestination {
  return window.location.pathname === '/cart' ? 'cart' : 'products'
}

type ProductCardProps = {
  product: Product
  onOpenReviews: (trigger: HTMLButtonElement) => void
  onAddToCart: () => void
  isAdding: boolean
  cartError?: string
}

function ProductCard({ product, onOpenReviews, onAddToCart, isAdding, cartError }: ProductCardProps) {
  const availableImages = product.images.filter(Boolean)
  const initialImage = product.thumbnail || availableImages[0] || null
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage)
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const mainImageUnavailable = !selectedImage || failedImages.has(selectedImage)

  function markImageFailed(image: string) {
    setFailedImages((current) => new Set(current).add(image))
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {mainImageUnavailable ? (
          <div className="image-fallback" role="img" aria-label={`Image unavailable for ${product.title}`}>
            <BagIcon />
            <span>Image unavailable</span>
          </div>
        ) : (
          <img
            src={selectedImage}
            alt={product.title}
            loading="lazy"
            onError={() => markImageFailed(selectedImage)}
          />
        )}
      </div>

      {availableImages.length > 0 && (
        <div className="thumbnail-strip" aria-label={`Images for ${product.title}`}>
          {availableImages.map((image, index) => (
            <button
              className={selectedImage === image ? 'selected-thumbnail' : ''}
              type="button"
              key={`${image}-${index}`}
              onClick={() => setSelectedImage(image)}
              aria-label={`Image ${index + 1} of ${availableImages.length} for ${product.title}`}
              aria-pressed={selectedImage === image}
            >
              {failedImages.has(image) ? (
                <span aria-hidden="true">—</span>
              ) : (
                <img src={image} alt="" loading="lazy" onError={() => markImageFailed(image)} />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="product-card-body">
        <p className="product-brand">{product.brand || 'Unbranded'}</p>
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <div>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-discount">{product.discountPercentage}% off</p>
          </div>
          <button
            className="review-control"
            type="button"
            onClick={(event) => onOpenReviews(event.currentTarget)}
            aria-label={`${product.rating} out of 5 stars, ${product.reviews.length} reviews for ${product.title}`}
          >
            <span aria-hidden="true">★</span>
            {product.rating.toFixed(1)}
            <span className="review-count">({product.reviews.length})</span>
          </button>
        </div>

        {cartError && <p className="card-error" role="alert">{cartError}</p>}
        <button
          className="add-cart-button"
          type="button"
          onClick={onAddToCart}
          disabled={isAdding}
        >
          {isAdding && <span className="spinner" aria-hidden="true" />}
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

type ReviewDialogProps = {
  product: Product
  userId: number
  onClose: () => void
  onAppendReview: (review: Review) => void
}

function ReviewDialog({ product, userId, onClose, onAppendReview }: ReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const commentId = useId()
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setValidationError('Enter a comment before submitting.')
      return
    }

    setValidationError('')
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('https://dummyjson.com/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, postId: product.id, userId }),
      })
      if (!response.ok) throw new Error(`Comment request failed with status ${response.status}`)

      onAppendReview({
        reviewerName: 'You',
        rating: rating ? Number(rating) : undefined,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating('')
    } catch {
      setSubmitError('Your comment could not be added. Existing reviews have not changed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      className="review-dialog"
      ref={dialogRef}
      aria-labelledby="reviews-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-header">
        <div>
          <p className="dialog-eyebrow">{product.title}</p>
          <h2 id="reviews-title">Reviews</h2>
        </div>
        <button
          className="dialog-close"
          type="button"
          aria-label="Close reviews"
          onClick={onClose}
          autoFocus
        >
          ×
        </button>
      </div>

      <div className="reviews-list">
        {product.reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to leave a comment.</p>
        ) : (
          product.reviews.map((review, index) => (
            <article className="review-row" key={`${review.reviewerName}-${review.date}-${index}`}>
              <div className="review-heading">
                <strong>{review.reviewerName}</strong>
                {review.rating !== undefined && (
                  <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                    <span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </span>
                )}
              </div>
              <p>{review.comment}</p>
              <time dateTime={review.date}>
                {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(review.date))}
              </time>
            </article>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={submitComment} noValidate>
        <h3>Add a comment</h3>
        <label htmlFor={commentId}>Your comment</label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value)
            if (validationError) setValidationError('')
          }}
          placeholder="Share your thoughts"
          rows={3}
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? `${commentId}-error` : undefined}
          disabled={isSubmitting}
        />
        {validationError && <p className="field-error" id={`${commentId}-error`}>{validationError}</p>}

        <label htmlFor={`${commentId}-rating`}>Rating (optional)</label>
        <select
          id={`${commentId}-rating`}
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

        {submitError && <div className="catalog-error" role="alert">{submitError}</div>}
        <button className="submit-comment-button" type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="spinner" aria-hidden="true" />}
          {isSubmitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </dialog>
  )
}

type ProductCatalogProps = {
  userId: number
  onCartAdd: (product: Product) => Promise<void>
  addingProductId: number | null
  cartErrors: Record<number, string>
}

function ProductCatalog({ userId, onCartAdd, addingProductId, cartErrors }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchController = useRef<AbortController | null>(null)
  const [reviewProductId, setReviewProductId] = useState<number | null>(null)
  const reviewTrigger = useRef<HTMLButtonElement | null>(null)

  async function fetchPage(skip: number, signal?: AbortSignal) {
    const response = await fetch(`https://dummyjson.com/products?limit=10&skip=${skip}`, { signal })
    if (!response.ok) throw new Error(`Products request failed with status ${response.status}`)

    const data = (await response.json()) as ProductsResponse
    if (!Array.isArray(data.products) || typeof data.total !== 'number') {
      throw new Error('Products response was invalid')
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
        setNextSkip(10)
        setHasMore(data.products.length > 0 && data.products.length < data.total)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
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
      setHasMore(data.products.length > 0 && nextSkip + data.products.length < data.total)
      setNextSkip((current) => current + 10)
    } catch {
      setError('We could not load more products. Your loaded products are still available.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()

    searchController.current?.abort()
    if (!query) {
      setActiveQuery('')
      setSearchResults(null)
      setSearchError('')
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    searchController.current = controller
    setActiveQuery(query)
    setSearchResults(null)
    setSearchError('')
    setIsSearching(true)

    try {
      const response = await fetch(
        `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      )
      if (!response.ok) throw new Error(`Search request failed with status ${response.status}`)

      const data = (await response.json()) as ProductsResponse
      if (!Array.isArray(data.products)) throw new Error('Search response was invalid')
      setSearchResults(data.products)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setSearchError('Search is unavailable right now. Your loaded catalog is still available below.')
    } finally {
      if (!controller.signal.aborted) setIsSearching(false)
    }
  }

  function handleSearchInput(value: string) {
    setSearchInput(value)
    if (!value.trim()) {
      searchController.current?.abort()
      setActiveQuery('')
      setSearchResults(null)
      setSearchError('')
      setIsSearching(false)
    }
  }

  const isSearchView = Boolean(activeQuery)
  const visibleProducts = isSearchView && searchResults !== null ? searchResults : products
  const reviewProduct =
    (searchResults ?? []).find((product) => product.id === reviewProductId) ??
    products.find((product) => product.id === reviewProductId) ??
    null

  function closeReviews() {
    setReviewProductId(null)
    window.requestAnimationFrame(() => reviewTrigger.current?.focus())
  }

  function appendReview(productId: number, review: Review) {
    const addReview = (product: Product) => (
      product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product
    )
    setProducts((current) => current.map(addReview))
    setSearchResults((current) => current?.map(addReview) ?? null)
  }

  return (
    <section aria-labelledby="products-heading">
      <div className="catalog-heading">
        <div>
          <h1 id="products-heading">All Products</h1>
          {!isInitialLoading && !isSearching && (
            <p className="showing-count" aria-live="polite">
              {isSearchView && searchResults !== null
                ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for “${activeQuery}”`
                : `Showing ${products.length}${total > 0 ? ` of ${total}` : ''} products`}
            </p>
          )}
        </div>
        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label htmlFor="product-search">Search products</label>
          <div className="search-row">
            <input
              id="product-search"
              type="search"
              placeholder="Search products"
              value={searchInput}
              onChange={(event) => handleSearchInput(event.target.value)}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {isInitialLoading ? (
        <div className="catalog-status" role="status">
          <span className="spinner dark-spinner" aria-hidden="true" />
          <span>Loading products…</span>
        </div>
      ) : (
        <>
          {error && <div className="catalog-error" role="alert">{error}</div>}
          {searchError && <div className="catalog-error" role="alert">{searchError}</div>}

          {isSearching ? (
            <div className="catalog-status" role="status">
              <span className="spinner dark-spinner" aria-hidden="true" />
              <span>Searching products…</span>
            </div>
          ) : visibleProducts.length === 0 && isSearchView && searchResults !== null ? (
            <div className="empty-catalog">
              <h2>No matches found</h2>
              <p>Try a different search term.</p>
            </div>
          ) : visibleProducts.length === 0 && !error ? (
            <div className="empty-catalog">
              <h2>No products available</h2>
              <p>The catalog is empty right now.</p>
            </div>
          ) : (
            <ul className="product-grid" aria-label="Product catalog">
              {visibleProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    onOpenReviews={(trigger) => {
                      reviewTrigger.current = trigger
                      setReviewProductId(product.id)
                    }}
                    onAddToCart={() => void onCartAdd(product)}
                    isAdding={addingProductId === product.id}
                    cartError={cartErrors[product.id]}
                  />
                </li>
              ))}
            </ul>
          )}

          {!isSearchView && products.length > 0 && hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-button" type="button" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore && <span className="spinner" aria-hidden="true" />}
                {isLoadingMore ? 'Loading more…' : 'Load more'}
              </button>
            </div>
          )}

          {!isSearchView && products.length > 0 && !hasMore && (
            <p className="end-of-list" role="status">You’ve reached the end of the catalog.</p>
          )}
        </>
      )}

      {reviewProduct && (
        <ReviewDialog
          product={reviewProduct}
          userId={userId}
          onClose={closeReviews}
          onAppendReview={(review) => appendReview(reviewProduct.id, review)}
        />
      )}
    </section>
  )
}

type CartScreenProps = {
  items: CartItem[]
  onQuantityChange: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onContinueShopping: () => void
  onPlaceOrder: () => void
  orderPlaced: boolean
}

function CartScreen({
  items,
  onQuantityChange,
  onRemove,
  onContinueShopping,
  onPlaceOrder,
  orderPlaced,
}: CartScreenProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (orderPlaced) {
    return (
      <section className="order-success" aria-labelledby="order-success-heading" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h1 id="order-success-heading">Order placed successfully</h1>
        <p>Thank you for shopping with MyShop.</p>
        <button type="button" onClick={onContinueShopping}>Continue Shopping</button>
      </section>
    )
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <div className="cart-title-row">
        <div>
          <h1 id="cart-heading">Your Cart ({itemCount})</h1>
          <p>Review and update your items before placing your order.</p>
        </div>
        <button className="continue-button" type="button" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <CartIcon />
          <h2>Your cart is empty</h2>
          <p>Add a product to get started.</p>
          <button type="button" onClick={onContinueShopping}>Browse Products</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items" aria-label="Cart items">
            {items.map(({ product, quantity }) => (
              <article className="cart-item" key={product.id}>
                <div className="cart-item-image">
                  {product.thumbnail || product.images[0] ? (
                    <img src={product.thumbnail || product.images[0]} alt="" />
                  ) : (
                    <BagIcon />
                  )}
                </div>
                <div className="cart-item-details">
                  <h2>{product.title}</h2>
                  <p className="cart-unit-price">${product.price.toFixed(2)} each</p>
                  <button className="remove-button" type="button" onClick={() => onRemove(product.id)}>
                    Remove
                  </button>
                </div>
                <div className="quantity-control">
                  <span id={`quantity-${product.id}`}>Quantity</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(product.id, quantity - 1)}
                      disabled={quantity <= 1}
                      aria-label={`Decrease quantity of ${product.title}`}
                    >
                      −
                    </button>
                    <output aria-labelledby={`quantity-${product.id}`}>{quantity}</output>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(product.id, quantity + 1)}
                      aria-label={`Increase quantity of ${product.title}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="line-total" aria-label={`Line total $${(product.price * quantity).toFixed(2)}`}>
                  ${(product.price * quantity).toFixed(2)}
                </p>
              </article>
            ))}
          </div>

          <aside className="order-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Order Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <button type="button" onClick={onPlaceOrder}>Place Order</button>
          </aside>
        </div>
      )}
    </section>
  )
}

function AppShell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [destination, setDestination] = useState<AppDestination>(destinationFromPath)
  const [cart, setCart] = useState<CartItem[]>(readCart)
  const [addingProductId, setAddingProductId] = useState<number | null>(null)
  const [cartErrors, setCartErrors] = useState<Record<number, string>>({})
  const [orderPlaced, setOrderPlaced] = useState(false)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const handlePopState = () => setDestination(destinationFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.title = `${destination === 'cart' ? 'Cart' : 'Products'} | MyShop`
  }, [destination])

  useEffect(() => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  function goTo(next: AppDestination) {
    const path = next === 'cart' ? '/cart' : '/products'
    window.history.pushState({}, '', path)
    setDestination(next)
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, next: AppDestination) {
    event.preventDefault()
    goTo(next)
  }

  async function addToCart(product: Product) {
    if (addingProductId !== null) return

    setAddingProductId(product.id)
    setCartErrors((current) => ({ ...current, [product.id]: '' }))
    try {
      const response = await fetch('https://dummyjson.com/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.id,
          products: [{ id: product.id, quantity: 1 }],
        }),
      })
      if (!response.ok) throw new Error(`Cart request failed with status ${response.status}`)

      setCart((current) => {
        const existing = current.find((item) => item.product.id === product.id)
        if (existing) {
          return current.map((item) => (
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ))
        }
        return [...current, { product, quantity: 1 }]
      })
      setOrderPlaced(false)
    } catch {
      setCartErrors((current) => ({
        ...current,
        [product.id]: 'Could not add this product. Your cart has not changed.',
      }))
    } finally {
      setAddingProductId(null)
    }
  }

  return (
    <div className="authenticated-app">
      <header className="site-header">
        <a className="brand header-brand" href="/products" onClick={(event) => navigate(event, 'products')}>
          <span className="brand-mark"><BagIcon /></span>
          <span>MyShop</span>
        </a>

        <nav aria-label="Main navigation">
          <a
            href="/products"
            onClick={(event) => navigate(event, 'products')}
            aria-current={destination === 'products' ? 'page' : undefined}
          >
            Products
          </a>
          <a
            className="cart-link"
            href="/cart"
            onClick={(event) => navigate(event, 'cart')}
            aria-current={destination === 'cart' ? 'page' : undefined}
          >
            <CartIcon />
            <span>Cart</span>
            <span className="cart-badge" aria-label={`${cartCount} items in cart`}>{cartCount}</span>
          </a>
        </nav>

        <button className="logout-button" type="button" onClick={onLogout}>Log out</button>
      </header>

      <main className="page-content">
        {destination === 'products' ? (
          <ProductCatalog
            userId={session.id}
            onCartAdd={addToCart}
            addingProductId={addingProductId}
            cartErrors={cartErrors}
          />
        ) : (
          <CartScreen
            items={cart}
            onQuantityChange={(productId, quantity) => {
              if (quantity < 1) return
              setCart((current) => current.map((item) => (
                item.product.id === productId ? { ...item, quantity } : item
              )))
            }}
            onRemove={(productId) => {
              setCart((current) => current.filter((item) => item.product.id !== productId))
            }}
            onContinueShopping={() => {
              setOrderPlaced(false)
              goTo('products')
            }}
            onPlaceOrder={() => {
              setCart([])
              setOrderPlaced(true)
            }}
            orderPlaced={orderPlaced}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)

  if (session) {
    return (
      <AppShell
        session={session}
        onLogout={() => {
          sessionStorage.removeItem(SESSION_KEY)
          sessionStorage.removeItem(CART_KEY)
          window.history.replaceState({}, '', '/')
          document.title = 'Login | MyShop'
          setSession(null)
        }}
      />
    )
  }

  return (
    <Login
      onSuccess={(nextSession) => {
        window.history.replaceState({}, '', '/products')
        setSession(nextSession)
      }}
    />
  )
}
