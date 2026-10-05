import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

const API = 'https://dummyjson.com'
const PAGE_SIZE = 10
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='520' viewBox='0 0 700 520'%3E%3Crect width='700' height='520' fill='%23edf1f3'/%3E%3Cpath d='M278 212h144v96H278z' fill='none' stroke='%2395a1a8' stroke-width='8'/%3E%3Cpath d='m288 296 42-42 31 31 25-25 27 36' fill='none' stroke='%2395a1a8' stroke-width='8'/%3E%3Ccircle cx='385' cy='237' r='10' fill='%2395a1a8'/%3E%3Ctext x='350' y='344' text-anchor='middle' font-family='Arial' font-size='20' fill='%2367737a'%3EImage unavailable%3C/text%3E%3C/svg%3E"

type Session = {
  id: number
  accessToken: string
  firstName?: string
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

function readSession(): Session | null {
  try {
    const saved = sessionStorage.getItem('myshop-session')
    if (!saved) return null
    const parsed = JSON.parse(saved) as Partial<Session>
    return typeof parsed.id === 'number' && typeof parsed.accessToken === 'string'
      ? (parsed as Session)
      : null
  } catch {
    return null
  }
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function Icon({
  children,
  size = 20,
}: {
  children: ReactNode
  size?: number
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function BagIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </Icon>
  )
}

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <BagIcon size={22} />
      </span>
      <span>MyShop</span>
    </span>
  )
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string
    password?: string
  }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: typeof fieldErrors = {}
    if (!username.trim()) errors.username = 'Enter your username.'
    if (!password) errors.password = 'Enter your password.'
    setFieldErrors(errors)
    setError('')
    if (Object.keys(errors).length) return

    setLoading(true)
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = (await response.json().catch(() => ({}))) as Partial<
        Session & { message: string }
      >
      if (!response.ok) {
        setError(
          response.status === 400 && data.message === 'Invalid credentials'
            ? 'Invalid username or password. Please try again.'
            : data.message || 'We could not sign you in. Please try again.',
        )
        return
      }
      if (typeof data.id !== 'number' || !data.accessToken) {
        setError('The sign-in response was incomplete. Please try again.')
        return
      }
      onLogin({
        id: data.id,
        accessToken: data.accessToken,
        firstName: data.firstName,
      })
    } catch {
      setError('Unable to reach MyShop. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Brand />
        <div className="login-heading">
          <p className="eyebrow">Welcome back</p>
          <h1 id="login-title">Sign in to your account</h1>
          <p>Enter your details to continue shopping.</p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <div className="input-wrap">
              <Icon>
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
              </Icon>
              <input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setFieldErrors((current) => ({ ...current, username: undefined }))
                }}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id="username-error">
                {fieldErrors.username}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <Icon>
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </Icon>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldErrors((current) => ({ ...current, password: undefined }))
                }}
              />
              <button
                className="show-password"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                <Icon>
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </Icon>
              </button>
            </div>
            {fieldErrors.password && (
              <p className="field-error" id="password-error">
                {fieldErrors.password}
              </p>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button login-button" disabled={loading}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="demo-note">
          Demo account: <strong>emilys</strong> / <strong>emilyspass</strong>
        </p>
      </section>
    </main>
  )
}

function Header({
  route,
  cartCount,
}: {
  route: 'products' | 'cart'
  cartCount: number
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand-link" href="#products" aria-label="MyShop products">
          <Brand />
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#products"
            className={route === 'products' ? 'active' : undefined}
            aria-current={route === 'products' ? 'page' : undefined}
          >
            Products
          </a>
          <a
            href="#cart"
            className={`cart-link ${route === 'cart' ? 'active' : ''}`}
            aria-current={route === 'cart' ? 'page' : undefined}
            aria-label={`Cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <BagIcon />
            <span>Cart</span>
            <span className="cart-badge" aria-hidden="true">
              {cartCount}
            </span>
          </a>
        </nav>
      </div>
    </header>
  )
}

function Stars({ rating }: { rating?: number }) {
  return (
    <span
      className="stars"
      aria-label={
        typeof rating === 'number' ? `${rating} out of 5 stars` : 'No rating'
      }
    >
      <span aria-hidden="true">★</span>
      <span>{typeof rating === 'number' ? rating.toFixed(1) : '—'}</span>
    </span>
  )
}

function SafeImage({
  src,
  alt,
  className,
  loading,
}: {
  src?: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  return (
    <img
      src={src || FALLBACK_IMAGE}
      alt={alt}
      className={className}
      loading={loading}
      onError={(event) => {
        if (event.currentTarget.src !== FALLBACK_IMAGE) {
          event.currentTarget.src = FALLBACK_IMAGE
        }
      }}
    />
  )
}

function ProductCard({
  product,
  reviews,
  onReviews,
  onAdd,
}: {
  product: Product
  reviews: Review[]
  onReviews: () => void
  onAdd: () => Promise<void>
}) {
  const images = product.images?.filter(Boolean) ?? []
  const initialImage = product.thumbnail || images[0]
  const [selectedImage, setSelectedImage] = useState(initialImage)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const titleId = useId()

  async function add() {
    setAdding(true)
    setAddError('')
    try {
      await onAdd()
    } catch {
      setAddError('Could not add this item. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card" aria-labelledby={titleId}>
      <div className="product-visual">
        <SafeImage
          className="product-main-image"
          src={selectedImage}
          alt={product.title}
          loading="lazy"
        />
      </div>
      <div className="thumbnail-strip" aria-label={`Images for ${product.title}`}>
        {(images.length ? images : [initialImage]).map((image, index, all) => (
          <button
            type="button"
            key={`${image || 'fallback'}-${index}`}
            className={selectedImage === image ? 'selected' : undefined}
            aria-label={`Image ${index + 1} of ${all.length} for ${product.title}`}
            aria-pressed={selectedImage === image}
            onClick={() => setSelectedImage(image)}
          >
            <SafeImage src={image} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <div className="product-content">
        <p className="product-brand">{product.brand || 'Independent brand'}</p>
        <h2 id={titleId}>{product.title}</h2>
        <p className="product-description">{product.description}</p>
        <div className="price-row">
          <strong>{money(product.price)}</strong>
          <span>{product.discountPercentage.toFixed(1)}% off</span>
        </div>
        <button className="review-trigger" type="button" onClick={onReviews}>
          <Stars rating={product.rating} />
          <span>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </button>
        {addError && (
          <p className="card-error" role="alert">
            {addError}
          </p>
        )}
        <button
          className="primary-button add-button"
          type="button"
          disabled={adding}
          onClick={add}
        >
          <BagIcon />
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

function ReviewModal({
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
  const [rating, setRating] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setError('Enter a comment before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, postId: product.id, userId }),
      })
      if (!response.ok) throw new Error('Comment request failed')
      onCommentAdded({
        reviewerName: 'You',
        comment: body,
        rating: rating ? Number(rating) : undefined,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating('')
    } catch {
      setError('Your comment could not be added. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby="reviews-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
      <div className="dialog-header">
        <div>
          <p className="eyebrow">{product.title}</p>
          <h2 id="reviews-title">Customer Reviews</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close reviews</span>
        </button>
      </div>
      <div className="review-list" aria-live="polite">
        {reviews.length === 0 ? (
          <div className="empty-reviews">
            <Stars />
            <h3>No reviews yet</h3>
            <p>Be the first to share your thoughts.</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <article className="review" key={`${review.reviewerName}-${review.date}-${index}`}>
              <div className="review-meta">
                <strong>{review.reviewerName}</strong>
                <Stars rating={review.rating} />
              </div>
              <p>{review.comment}</p>
              <time dateTime={review.date}>
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(review.date))}
              </time>
            </article>
          ))
        )}
      </div>
      <form className="comment-form" onSubmit={submit} noValidate>
        <h3>Add a comment</h3>
        <div className="field">
          <label htmlFor="comment">Your comment</label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            placeholder="What did you think?"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'comment-error' : undefined}
            onChange={(event) => {
              setComment(event.target.value)
              setError('')
            }}
          />
        </div>
        <div className="comment-actions">
          <div className="field rating-field">
            <label htmlFor="comment-rating">Rating <span>(optional)</span></label>
            <select
              id="comment-rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            >
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option value={value} key={value}>
                  {value} {value === 1 ? 'star' : 'stars'}
                </option>
              ))}
            </select>
          </div>
          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </div>
        {error && (
          <p className="form-error" id="comment-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </dialog>
  )
}

function ProductsPage({
  userId,
  onAddToCart,
}: {
  userId: number
  onAddToCart: (product: Product) => Promise<void>
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [reviewOverrides, setReviewOverrides] = useState<Record<number, Review[]>>({})

  async function fetchPage(skip: number) {
    const response = await fetch(
      `${API}/products?limit=${PAGE_SIZE}&skip=${skip}`,
    )
    if (!response.ok) throw new Error('Products request failed')
    return (await response.json()) as ProductsResponse
  }

  useEffect(() => {
    let active = true
    async function load() {
      setInitialLoading(true)
      setCatalogError('')
      try {
        const data = await fetchPage(0)
        if (!active) return
        setProducts(data.products)
        setTotal(data.total)
        setHasMore(data.skip + data.products.length < data.total)
      } catch {
        if (active) setCatalogError('Products could not be loaded. Please try again.')
      } finally {
        if (active) setInitialLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  async function loadMore() {
    setMoreLoading(true)
    setCatalogError('')
    try {
      const data = await fetchPage(products.length)
      setProducts((current) => {
        const ids = new Set(current.map((product) => product.id))
        return [...current, ...data.products.filter((product) => !ids.has(product.id))]
      })
      setTotal(data.total)
      setHasMore(data.skip + data.products.length < data.total)
    } catch {
      setCatalogError(
        'More products could not be loaded. Your current products are still here.',
      )
    } finally {
      setMoreLoading(false)
    }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = queryInput.trim()
    if (!query) {
      setSearchQuery('')
      setSearchResults([])
      setSearchError('')
      return
    }
    setSearchQuery(query)
    setSearchLoading(true)
    setSearchError('')
    setSearchResults([])
    try {
      const response = await fetch(
        `${API}/products/search?q=${encodeURIComponent(query)}`,
      )
      if (!response.ok) throw new Error('Search request failed')
      const data = (await response.json()) as ProductsResponse
      setSearchResults(data.products)
      setSearchTotal(data.total)
    } catch {
      setSearchError('Search is unavailable right now. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  const displayedProducts = searchQuery ? searchResults : products
  const selectedReviews = selectedProduct
    ? reviewOverrides[selectedProduct.id] ?? selectedProduct.reviews ?? []
    : []

  return (
    <main className="page-shell" id="main-content">
      <section className="listing-heading" aria-labelledby="products-title">
        <div>
          <p className="eyebrow">Explore the collection</p>
          <h1 id="products-title">All Products</h1>
          <p className="showing-count" aria-live="polite">
            {searchQuery
              ? `Showing ${displayedProducts.length} of ${searchTotal} matches`
              : `Showing ${products.length} of ${total || '—'} products`}
          </p>
        </div>
        <form className="search" role="search" onSubmit={search}>
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <Icon>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </Icon>
          <input
            id="product-search"
            type="search"
            placeholder="Search products"
            value={queryInput}
            onChange={(event) => {
              const value = event.target.value
              setQueryInput(value)
              if (!value.trim()) {
                setSearchQuery('')
                setSearchResults([])
                setSearchError('')
              }
            }}
          />
          <button type="submit" disabled={searchLoading}>
            {searchLoading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </section>

      {initialLoading && (
        <div className="state-panel" role="status">
          <span className="spinner dark" aria-hidden="true" />
          Loading products…
        </div>
      )}
      {(catalogError || searchError) && (
        <div className="state-panel error-panel" role="alert">
          <strong>Something went wrong</strong>
          <p>{searchQuery ? searchError : catalogError}</p>
        </div>
      )}
      {!initialLoading &&
        !searchLoading &&
        !searchError &&
        displayedProducts.length === 0 && (
          <div className="state-panel">
            <h2>{searchQuery ? 'No matching products' : 'No products available'}</h2>
            <p>
              {searchQuery
                ? `Try a different search than “${searchQuery}”.`
                : 'Please check back later.'}
            </p>
          </div>
        )}
      {!initialLoading && displayedProducts.length > 0 && (
        <div className="product-grid">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              reviews={reviewOverrides[product.id] ?? product.reviews ?? []}
              onReviews={() => setSelectedProduct(product)}
              onAdd={() => onAddToCart(product)}
            />
          ))}
        </div>
      )}
      {!searchQuery && !initialLoading && products.length > 0 && hasMore && (
        <div className="load-more-wrap">
          <button
            className="secondary-button"
            type="button"
            disabled={moreLoading}
            onClick={loadMore}
          >
            {moreLoading ? 'Loading…' : 'Load more products'}
          </button>
        </div>
      )}
      {!searchQuery && !initialLoading && products.length > 0 && !hasMore && (
        <p className="end-message">You’ve reached the end of the collection.</p>
      )}
      {selectedProduct && (
        <ReviewModal
          product={selectedProduct}
          reviews={selectedReviews}
          userId={userId}
          onClose={() => setSelectedProduct(null)}
          onCommentAdded={(review) =>
            setReviewOverrides((current) => ({
              ...current,
              [selectedProduct.id]: [...selectedReviews, review],
            }))
          }
        />
      )}
    </main>
  )
}

function CartPage({
  lines,
  onQuantity,
  onRemove,
  onOrder,
}: {
  lines: CartLine[]
  onQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onOrder: () => void
}) {
  const [ordered, setOrdered] = useState(false)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  )

  function placeOrder() {
    onOrder()
    setOrdered(true)
  }

  if (ordered) {
    return (
      <main className="page-shell">
        <section className="order-success" aria-labelledby="order-success-title">
          <span className="success-icon" aria-hidden="true">✓</span>
          <p className="eyebrow">Order confirmed</p>
          <h1 id="order-success-title">Thank you for your order!</h1>
          <p>Your order was placed successfully. We hope you enjoy your purchase.</p>
          <a className="primary-button button-link" href="#products">
            Continue Shopping
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell cart-page" id="main-content">
      <div className="cart-title-row">
        <div>
          <p className="eyebrow">Your selections</p>
          <h1>Your Cart ({count})</h1>
        </div>
        {lines.length > 0 && (
          <a className="continue-link" href="#products">← Continue Shopping</a>
        )}
      </div>
      {lines.length === 0 ? (
        <section className="empty-cart">
          <span className="empty-cart-icon"><BagIcon size={34} /></span>
          <h2>Your cart is empty</h2>
          <p>Discover something you’ll love in our collection.</p>
          <a className="primary-button button-link" href="#products">
            Browse Products
          </a>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            <div className="cart-columns" aria-hidden="true">
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            {lines.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <SafeImage
                  src={product.thumbnail || product.images?.[0]}
                  alt={product.title}
                  className="cart-image"
                />
                <div className="cart-product">
                  <p>{product.brand || 'Independent brand'}</p>
                  <h2>{product.title}</h2>
                  <strong>{money(product.price)}</strong>
                  <button type="button" onClick={() => onRemove(product.id)}>
                    Remove
                  </button>
                </div>
                <div
                  className="stepper"
                  role="group"
                  aria-label={`Quantity for ${product.title}`}
                >
                  <button
                    type="button"
                    aria-label={`Decrease ${product.title} quantity`}
                    disabled={quantity === 1}
                    onClick={() => onQuantity(product.id, quantity - 1)}
                  >
                    −
                  </button>
                  <span aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${product.title} quantity`}
                    onClick={() => onQuantity(product.id, quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <strong className="line-total">
                  {money(product.price * quantity)}
                </strong>
              </article>
            ))}
          </section>
          <aside className="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <button className="primary-button" type="button" onClick={placeOrder}>
              Place Order
            </button>
            <p>No payment is required for this demo order.</p>
          </aside>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [route, setRoute] = useState<'products' | 'cart'>(() =>
    window.location.hash === '#cart' ? 'cart' : 'products',
  )
  const [cart, setCart] = useState<CartLine[]>([])

  useEffect(() => {
    function routeFromHash() {
      setRoute(window.location.hash === '#cart' ? 'cart' : 'products')
    }
    window.addEventListener('hashchange', routeFromHash)
    return () => window.removeEventListener('hashchange', routeFromHash)
  }, [])

  useEffect(() => {
    document.title = session
      ? route === 'cart'
        ? 'Your Cart | MyShop'
        : 'Products | MyShop'
      : 'Login | MyShop'
  }, [route, session])

  function login(nextSession: Session) {
    sessionStorage.setItem('myshop-session', JSON.stringify(nextSession))
    setSession(nextSession)
    window.location.hash = 'products'
    setRoute('products')
  }

  async function addToCart(product: Product) {
    if (!session) throw new Error('Not signed in')
    const response = await fetch(`${API}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.id,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })
    if (!response.ok) throw new Error('Cart request failed')
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      return existing
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...current, { product, quantity: 1 }]
    })
  }

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  if (!session) return <Login onLogin={login} />

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header route={route} cartCount={cartCount} />
      {route === 'products' ? (
        <ProductsPage userId={session.id} onAddToCart={addToCart} />
      ) : (
        <CartPage
          lines={cart}
          onQuantity={(productId, quantity) =>
            setCart((current) =>
              current.map((line) =>
                line.product.id === productId ? { ...line, quantity } : line,
              ),
            )
          }
          onRemove={(productId) =>
            setCart((current) =>
              current.filter((line) => line.product.id !== productId),
            )
          }
          onOrder={() => setCart([])}
        />
      )}
    </div>
  )
}
