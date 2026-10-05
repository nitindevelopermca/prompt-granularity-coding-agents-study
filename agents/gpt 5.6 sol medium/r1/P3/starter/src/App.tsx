import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'

type Session = {
  id: number
  accessToken: string
}

type Destination = 'products' | 'cart'

const SESSION_KEY = 'myshop-session'
const PAGE_SIZE = 10

type Review = {
  reviewerName: string
  rating: number
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
  thumbnail?: string
  images: string[]
  reviews: Review[]
}

type ProductsResponse = {
  products: Product[]
  total: number
  skip: number
  limit: number
}

type CartLine = {
  product: Product
  quantity: number
}

function BagIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="bag-icon"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M6.7 8.2h10.6l.8 11.3H5.9L6.7 8.2Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect height="10" rx="1.5" width="13" x="5.5" y="10" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
      <path d="M12 14v2.5" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 4h2l2.1 10h10.7l2-7H6" />
      <circle cx="9" cy="19" r="1.25" />
      <circle cx="17" cy="19" r="1.25" />
    </svg>
  )
}

function readSession(): Session | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY)
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<Session>
    return typeof parsed.id === 'number' && typeof parsed.accessToken === 'string'
      ? { id: parsed.id, accessToken: parsed.accessToken }
      : null
  } catch {
    return null
  }
}

function destinationFromPath(): Destination {
  return window.location.pathname === '/cart' ? 'cart' : 'products'
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' })
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = {
      username: username.trim() ? '' : 'Enter your username.',
      password: password ? '' : 'Enter your password.',
    }
    setFieldErrors(errors)
    setFormError('')
    if (errors.username || errors.password) return

    setLoading(true)
    try {
      const response = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = (await response.json().catch(() => null)) as
        | { id?: number; accessToken?: string; message?: string }
        | null

      if (!response.ok) {
        setFormError(
          response.status === 400 && data?.message === 'Invalid credentials'
            ? 'Invalid username or password.'
            : 'We could not log you in. Please try again.',
        )
        return
      }
      if (typeof data?.id !== 'number' || typeof data.accessToken !== 'string') {
        setFormError('The login response was incomplete. Please try again.')
        return
      }

      const session = { id: data.id, accessToken: data.accessToken }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      onLogin(session)
    } catch {
      setFormError('Unable to reach MyShop. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-brand">
          <BagIcon size={48} />
          <span>MyShop</span>
        </div>
        <h1 id="login-heading">Welcome Back</h1>
        <p className="login-intro">Please login to your account</p>

        <form noValidate onSubmit={submit}>
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <div className={`input-shell ${fieldErrors.username ? 'input-error' : ''}`}>
              <UserIcon />
              <input
                aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                aria-invalid={Boolean(fieldErrors.username)}
                autoComplete="username"
                disabled={loading}
                id="username"
                name="username"
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) setFieldErrors((old) => ({ ...old, username: '' }))
                }}
                placeholder="Enter your username"
                value={username}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id={usernameErrorId}>
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className={`input-shell ${fieldErrors.password ? 'input-error' : ''}`}>
              <LockIcon />
              <input
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="current-password"
                disabled={loading}
                id="password"
                name="password"
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) setFieldErrors((old) => ({ ...old, password: '' }))
                }}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="password-toggle"
                disabled={loading}
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
            {fieldErrors.password && (
              <p className="field-error" id={passwordErrorId}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          {formError && (
            <p className="form-error" id={formErrorId} role="alert">
              {formError}
            </p>
          )}
          <button
            aria-describedby={formError ? formErrorId : undefined}
            className="login-button"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Logging in…
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </section>
    </main>
  )
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

function ProductCard({
  product,
  onAddToCart,
  onOpenReviews,
}: {
  product: Product
  onAddToCart: (product: Product) => Promise<void>
  onOpenReviews: (productId: number, opener: HTMLButtonElement) => void
}) {
  const gallery = product.images.filter(Boolean)
  const initialImage = product.thumbnail || gallery[0] || ''
  const [mainImage, setMainImage] = useState(initialImage)
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState('')
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    setMainImage(product.thumbnail || product.images.find(Boolean) || '')
    setFailedImages(new Set())
  }, [product.id, product.images, product.thumbnail])

  const mainImageFailed = !mainImage || failedImages.has(mainImage)

  async function addToCart() {
    setAdding(true)
    setCartError('')
    setCartMessage('')
    try {
      await onAddToCart(product)
      setCartMessage(`${product.title} added to your cart.`)
    } catch {
      setCartError(`${product.title} could not be added. Please try again.`)
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-image-stage">
        {mainImageFailed ? (
          <div className="image-placeholder" role="img" aria-label={`No image available for ${product.title}`}>
            <BagIcon size={45} />
            <span>Image unavailable</span>
          </div>
        ) : (
          <img
            alt={product.title}
            loading="lazy"
            onError={() => setFailedImages((old) => new Set(old).add(mainImage))}
            src={mainImage}
          />
        )}
      </div>

      {gallery.length > 0 && (
        <div className="thumbnail-strip" aria-label={`${product.title} images`} role="group">
          {gallery.map((image, index) => (
            <button
              aria-label={`Image ${index + 1} of ${gallery.length}`}
              aria-pressed={mainImage === image}
              className="thumbnail-button"
              key={`${image}-${index}`}
              onClick={() => setMainImage(image)}
              type="button"
            >
              {failedImages.has(image) ? (
                <span aria-hidden="true">—</span>
              ) : (
                <img
                  alt=""
                  loading="lazy"
                  onError={() => setFailedImages((old) => new Set(old).add(image))}
                  src={image}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="product-card-body">
        <p className="product-brand">{product.brand?.trim() || 'Brand unavailable'}</p>
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>
        <div className="product-price-row">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {product.discountPercentage > 0 && (
            <span className="product-discount">{product.discountPercentage.toFixed(1)}% off</span>
          )}
        </div>
        <button
          className="review-control"
          onClick={(event) => onOpenReviews(product.id, event.currentTarget)}
          type="button"
        >
          <StarIcon />
          <span>{product.rating.toFixed(1)}</span>
          <span className="review-count">
            {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </button>
        <div className="cart-action-status" aria-live="polite">
          {cartError && (
            <p className="product-cart-error" role="alert">
              {cartError}
            </p>
          )}
          {!cartError && cartMessage && <p className="product-cart-success">{cartMessage}</p>}
        </div>
        <button className="add-cart-button" disabled={adding} onClick={addToCart} type="button">
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

function formatReviewDate(date: string) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(parsed)
}

function ReviewDialog({
  product,
  userId,
  onAppendReview,
  onClose,
}: {
  product: Product
  userId: number
  onAppendReview: (productId: number, review: Review) => void
  onClose: () => void
}) {
  const titleId = useId()
  const commentErrorId = useId()
  const requestErrorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [commentError, setCommentError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const background = document.querySelector<HTMLElement>('[data-app-background]')
    background?.setAttribute('inert', '')
    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      background?.removeAttribute('inert')
    }
  }, [onClose])

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    )
    if (!focusable?.length) return
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

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    setRequestError('')
    if (!body) {
      setCommentError('Enter a comment before submitting.')
      return
    }
    setCommentError('')
    setSubmitting(true)

    try {
      const response = await fetch('https://dummyjson.com/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, postId: product.id, userId }),
      })
      if (!response.ok) throw new Error('Comment request failed')

      onAppendReview(product.id, {
        reviewerName: 'You',
        rating: rating ? Number(rating) : 0,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating('')
    } catch {
      setRequestError('Your comment could not be added. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="review-dialog"
        onKeyDown={trapFocus}
        ref={dialogRef}
        role="dialog"
      >
        <div className="dialog-heading">
          <div>
            <p>{product.title}</p>
            <h2 id={titleId}>Reviews</h2>
          </div>
          <button aria-label="Close reviews" className="dialog-close" onClick={onClose} ref={closeRef} type="button">
            ×
          </button>
        </div>

        <div className="reviews-list">
          {product.reviews.length === 0 ? (
            <p className="empty-reviews">No reviews yet. Be the first to leave a comment.</p>
          ) : (
            product.reviews.map((review, index) => (
              <article className="review-item" key={`${review.reviewerName}-${review.date}-${index}`}>
                <div className="review-meta">
                  <strong>{review.reviewerName}</strong>
                  {review.rating > 0 && (
                    <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      <StarIcon />
                      {review.rating}
                    </span>
                  )}
                  <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                </div>
                <p>{review.comment}</p>
              </article>
            ))
          )}
        </div>

        <form className="comment-form" noValidate onSubmit={submitComment}>
          <h3>Add a comment</h3>
          <div className="comment-fields">
            <div>
              <label htmlFor="comment">Comment</label>
              <textarea
                aria-describedby={commentError ? commentErrorId : undefined}
                aria-invalid={Boolean(commentError)}
                disabled={submitting}
                id="comment"
                onChange={(event) => {
                  setComment(event.target.value)
                  if (commentError) setCommentError('')
                }}
                placeholder="Share your thoughts"
                rows={3}
                value={comment}
              />
              {commentError && (
                <p className="field-error" id={commentErrorId}>
                  {commentError}
                </p>
              )}
            </div>
            <div className="rating-field">
              <label htmlFor="comment-rating">Rating (optional)</label>
              <select
                disabled={submitting}
                id="comment-rating"
                onChange={(event) => setRating(event.target.value)}
                value={rating}
              >
                <option value="">No rating</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>
          </div>
          {requestError && (
            <p className="form-error" id={requestErrorId} role="alert">
              {requestError}
            </p>
          )}
          <button
            aria-describedby={requestError ? requestErrorId : undefined}
            className="comment-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

function ProductsPage({
  onAddToCart,
  userId,
}: {
  onAddToCart: (product: Product) => Promise<void>
  userId: number
}) {
  const [catalog, setCatalog] = useState<Product[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [nextSkip, setNextSkip] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [activeProductId, setActiveProductId] = useState<number | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)

  async function fetchCatalogPage(skip: number, signal?: AbortSignal) {
    const response = await fetch(
      `https://dummyjson.com/products?limit=${PAGE_SIZE}&skip=${skip}`,
      { signal },
    )
    if (!response.ok) throw new Error('Products request failed')
    const data = (await response.json()) as ProductsResponse
    if (!Array.isArray(data.products) || typeof data.total !== 'number') {
      throw new Error('Invalid products response')
    }
    return data
  }

  useEffect(() => {
    const controller = new AbortController()
    setInitialLoading(true)
    setCatalogError('')
    fetchCatalogPage(0, controller.signal)
      .then((data) => {
        setCatalog(data.products)
        setTotal(data.total)
        setNextSkip(PAGE_SIZE)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setCatalogError('Products could not be loaded. Please try again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitialLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    setCatalogError('')
    try {
      const data = await fetchCatalogPage(nextSkip)
      setCatalog((old) => {
        const knownIds = new Set(old.map((product) => product.id))
        return [...old, ...data.products.filter((product) => !knownIds.has(product.id))]
      })
      setTotal(data.total)
      setNextSkip((old) => old + PAGE_SIZE)
    } catch {
      setCatalogError('More products could not be loaded. Your current products are still here.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()
    setSearchError('')
    if (!query) {
      setSearchQuery('')
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    setSearchQuery(query)
    try {
      const response = await fetch(
        `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`,
      )
      if (!response.ok) throw new Error('Search request failed')
      const data = (await response.json()) as ProductsResponse
      if (!Array.isArray(data.products)) throw new Error('Invalid search response')
      setSearchResults(data.products)
    } catch {
      setSearchResults([])
      setSearchError('Search results could not be loaded. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setSearchInput('')
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
  }

  function appendReview(productId: number, review: Review) {
    const append = (products: Product[]) =>
      products.map((product) =>
        product.id === productId ? { ...product, reviews: [...product.reviews, review] } : product,
      )
    setCatalog(append)
    setSearchResults(append)
  }

  const searching = Boolean(searchQuery)
  const displayedProducts = searching ? searchResults : catalog
  const activeProduct = displayedProducts.find((product) => product.id === activeProductId)
  const hasMore = total !== null && nextSkip < total && catalog.length < total

  const closeDialog = useCallback(() => {
    setActiveProductId(null)
    window.setTimeout(() => openerRef.current?.focus(), 0)
  }, [])

  return (
    <>
      <div className="catalog-content">
        <div className="catalog-heading">
          <div>
            <h1>All Products</h1>
            <p aria-live="polite">
              {searching
                ? `${displayedProducts.length} search ${displayedProducts.length === 1 ? 'result' : 'results'}`
                : `Showing ${catalog.length}${total === null ? '' : ` of ${total}`} products`}
            </p>
          </div>
          <form className="search-form" role="search" onSubmit={search}>
            <label className="sr-only" htmlFor="product-search">
              Search products
            </label>
            <div className="search-input">
              <SearchIcon />
              <input
                id="product-search"
                onChange={(event) => {
                  setSearchInput(event.target.value)
                  if (!event.target.value.trim() && searchQuery) clearSearch()
                }}
                placeholder="Search products"
                type="search"
                value={searchInput}
              />
            </div>
            <button disabled={searchLoading} type="submit">
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
            {searching && (
              <button className="clear-search" onClick={clearSearch} type="button">
                Clear
              </button>
            )}
          </form>
        </div>

        {searchError && (
          <p className="catalog-alert" role="alert">
            {searchError}
          </p>
        )}
        {!searching && catalogError && (
          <div className="catalog-alert" role="alert">
            <p>{catalogError}</p>
            {catalog.length === 0 && (
              <button onClick={() => window.location.reload()} type="button">
                Try again
              </button>
            )}
          </div>
        )}

        {initialLoading ? (
          <div className="catalog-status" role="status">
            <span className="spinner blue-spinner" aria-hidden="true" />
            Loading products…
          </div>
        ) : searchLoading ? (
          <div className="catalog-status" role="status">
            <span className="spinner blue-spinner" aria-hidden="true" />
            Searching products…
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                onAddToCart={onAddToCart}
                onOpenReviews={(productId, opener) => {
                  openerRef.current = opener
                  setActiveProductId(productId)
                }}
                product={product}
              />
            ))}
          </div>
        ) : !catalogError && !searchError ? (
          <div className="empty-products" role="status">
            <h2>{searching ? 'No matches found' : 'No products available'}</h2>
            <p>
              {searching
                ? `No products matched “${searchQuery}”. Try a different search.`
                : 'Please check back later.'}
            </p>
          </div>
        ) : null}

        {!searching && !initialLoading && catalog.length > 0 && (
          <div className="load-more-area">
            {hasMore ? (
              <button className="load-more-button" disabled={loadingMore} onClick={loadMore} type="button">
                {loadingMore ? 'Loading more…' : 'Load more products'}
              </button>
            ) : (
              <p>You've reached the end of the catalog.</p>
            )}
          </div>
        )}
      </div>

      {activeProduct && (
        <ReviewDialog
          onAppendReview={appendReview}
          onClose={closeDialog}
          product={activeProduct}
          userId={userId}
        />
      )}
    </>
  )
}

function CartProductImage({ product }: { product: Product }) {
  const source = product.thumbnail || product.images.find(Boolean) || ''
  const [failed, setFailed] = useState(false)

  if (!source || failed) {
    return (
      <div className="cart-image-placeholder" role="img" aria-label={`No image available for ${product.title}`}>
        <BagIcon size={29} />
      </div>
    )
  }

  return <img alt="" onError={() => setFailed(true)} src={source} />
}

function CartPage({
  cart,
  onContinueShopping,
  onPlaceOrder,
  onRemove,
  onSetQuantity,
  orderedCount,
}: {
  cart: CartLine[]
  onContinueShopping: () => void
  onPlaceOrder: () => void
  onRemove: (productId: number) => void
  onSetQuantity: (productId: number, quantity: number) => void
  orderedCount: number | null
}) {
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const itemCount = cart.reduce((count, line) => count + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  useEffect(() => {
    if (orderedCount !== null) successHeadingRef.current?.focus()
  }, [orderedCount])

  if (orderedCount !== null) {
    return (
      <section className="order-success" aria-labelledby="order-success-heading" role="status">
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>
        <h1 id="order-success-heading" ref={successHeadingRef} tabIndex={-1}>
          Order placed successfully
        </h1>
        <p>
          Thank you. Your order for {orderedCount} {orderedCount === 1 ? 'item' : 'items'} has
          been confirmed.
        </p>
        <button onClick={onContinueShopping} type="button">
          Continue Shopping
        </button>
      </section>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-page-heading">
        <h1>Your Cart ({itemCount})</h1>
        <p>Review your items and adjust quantities before placing your order.</p>
      </div>

      {cart.length === 0 ? (
        <section className="empty-cart">
          <CartIcon />
          <h2>Your cart is empty</h2>
          <p>Add something from the catalog to get started.</p>
          <button onClick={onContinueShopping} type="button">
            Continue Shopping
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section aria-label="Cart items" className="cart-items">
            <div aria-hidden="true" className="cart-columns">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span />
            </div>
            {cart.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <div className="cart-product">
                  <div className="cart-product-image">
                    <CartProductImage product={product} />
                  </div>
                  <div>
                    <h2>{product.title}</h2>
                    <p>{product.brand?.trim() || 'Brand unavailable'}</p>
                  </div>
                </div>
                <div className="cart-cell" data-label="Price">
                  ${product.price.toFixed(2)}
                </div>
                <div className="quantity-stepper" data-label="Quantity" role="group" aria-label={`Quantity for ${product.title}`}>
                  <button
                    aria-label={`Decrease ${product.title} quantity`}
                    disabled={quantity === 1}
                    onClick={() => onSetQuantity(product.id, quantity - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <output aria-live="polite" aria-label={`${quantity} in cart`}>
                    {quantity}
                  </output>
                  <button
                    aria-label={`Increase ${product.title} quantity`}
                    onClick={() => onSetQuantity(product.id, quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <strong className="cart-cell line-total" data-label="Total">
                  ${(product.price * quantity).toFixed(2)}
                </strong>
                <button
                  aria-label={`Remove ${product.title} from cart`}
                  className="remove-item"
                  onClick={() => onRemove(product.id)}
                  type="button"
                >
                  Remove
                </button>
              </article>
            ))}
            <button className="continue-shopping" onClick={onContinueShopping} type="button">
              ← Continue Shopping
            </button>
          </section>

          <aside className="order-summary" aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <button onClick={onPlaceOrder} type="button">
              Place Order
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

function AppShell({
  destination,
  onNavigate,
  session,
}: {
  destination: Destination
  onNavigate: (destination: Destination) => void
  session: Session
}) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [orderedCount, setOrderedCount] = useState<number | null>(null)
  const cartCount = cart.reduce((count, line) => count + line.quantity, 0)

  async function addToCart(product: Product) {
    const response = await fetch('https://dummyjson.com/carts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.id,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })
    if (!response.ok) throw new Error('Cart request failed')

    setOrderedCount(null)
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      return existing
        ? current.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...current, { product, quantity: 1 }]
    })
  }

  function setQuantity(productId: number, quantity: number) {
    if (quantity < 1) return
    setCart((current) =>
      current.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    )
  }

  function navigateInShop(nextDestination: Destination) {
    if (nextDestination === 'products') setOrderedCount(null)
    onNavigate(nextDestination)
  }

  return (
    <div className="app-shell">
      <div data-app-background>
        <header className="site-header">
          <a
            className="header-brand"
            href="/products"
            onClick={(event) => {
              event.preventDefault()
              navigateInShop('products')
            }}
          >
            <BagIcon size={32} />
            <span>MyShop</span>
          </a>
          <nav aria-label="Primary navigation">
            <a
              aria-current={destination === 'products' ? 'page' : undefined}
              href="/products"
              onClick={(event) => {
                event.preventDefault()
                navigateInShop('products')
              }}
            >
              Products
            </a>
            <a
              aria-current={destination === 'cart' ? 'page' : undefined}
              className="cart-link"
              href="/cart"
              onClick={(event) => {
                event.preventDefault()
                navigateInShop('cart')
              }}
            >
              <CartIcon />
              <span>Cart</span>
              <span
                aria-label={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}
                className="cart-badge"
              >
                {cartCount}
              </span>
            </a>
          </nav>
        </header>
        <main className="page-content">
          {destination === 'products' ? (
            <ProductsPage onAddToCart={addToCart} userId={session.id} />
          ) : (
            <CartPage
              cart={cart}
              onContinueShopping={() => navigateInShop('products')}
              onPlaceOrder={() => {
                if (cartCount === 0) return
                setOrderedCount(cartCount)
                setCart([])
              }}
              onRemove={(productId) =>
                setCart((current) => current.filter((line) => line.product.id !== productId))
              }
              onSetQuantity={setQuantity}
              orderedCount={orderedCount}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [destination, setDestination] = useState<Destination>(() => destinationFromPath())

  useEffect(() => {
    const handlePopState = () => setDestination(destinationFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.title = session
      ? `${destination === 'products' ? 'Products' : 'Cart'} | MyShop`
      : 'Login | MyShop'
  }, [destination, session])

  function navigate(nextDestination: Destination, replace = false) {
    const path = `/${nextDestination}`
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
    setDestination(nextDestination)
  }

  if (!session) {
    return (
      <Login
        onLogin={(nextSession) => {
          setSession(nextSession)
          navigate('products', true)
        }}
      />
    )
  }

  return <AppShell destination={destination} onNavigate={navigate} session={session} />
}
