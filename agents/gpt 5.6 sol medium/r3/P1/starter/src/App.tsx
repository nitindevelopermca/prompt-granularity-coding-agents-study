import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Route = 'login' | 'products' | 'cart'

interface AuthUser {
  id: number
  accessToken: string
  firstName?: string
}

interface Review {
  reviewerName: string
  rating?: number
  comment: string
  date: string
}

interface Product {
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

interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

interface CartLine {
  product: Product
  quantity: number
}

const API = 'https://dummyjson.com'
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function readSession(): AuthUser | null {
  try {
    const value = sessionStorage.getItem('myshop-session')
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<AuthUser>
    return typeof parsed.id === 'number' && typeof parsed.accessToken === 'string'
      ? { id: parsed.id, accessToken: parsed.accessToken, firstName: parsed.firstName }
      : null
  } catch {
    return null
  }
}

function routeFromLocation(authenticated: boolean): Route {
  if (!authenticated) return 'login'
  return window.location.pathname === '/cart' ? 'cart' : 'products'
}

function BagIcon({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? 'icon icon-small' : 'icon'} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8h11l1 12h-13l1-12Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="star-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.7Z" />
    </svg>
  )
}

function StoreBrand() {
  return (
    <span className="brand-lockup">
      <span className="brand-mark"><BagIcon small /></span>
      <span>MyShop</span>
    </span>
  )
}

function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!username.trim()) nextErrors.username = 'Enter your username.'
    if (!password) nextErrors.password = 'Enter your password.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, expiresInMins: 60 }),
      })
      const data = await response.json() as Partial<AuthUser> & { message?: string }
      if (!response.ok) {
        setErrors({ form: data.message === 'Invalid credentials' ? 'Invalid username or password.' : (data.message || 'Unable to sign in. Please try again.') })
        return
      }
      if (typeof data.id !== 'number' || typeof data.accessToken !== 'string') {
        setErrors({ form: 'The login response was incomplete. Please try again.' })
        return
      }
      onLogin({ id: data.id, accessToken: data.accessToken, firstName: data.firstName })
    } catch {
      setErrors({ form: 'We could not reach MyShop. Check your connection and try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand"><StoreBrand /></div>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-intro">Sign in to continue shopping.</p>
        {errors.form && <div className="alert alert-error" role="alert">{errors.form}</div>}
        <form onSubmit={submit} noValidate>
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <div className={`input-wrap ${errors.username ? 'input-error' : ''}`}>
              <span className="field-icon" aria-hidden="true">♙</span>
              <input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                aria-invalid={Boolean(errors.username)}
              />
            </div>
            {errors.username && <p className="field-error" id="username-error">{errors.username}</p>}
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className={`input-wrap ${errors.password ? 'input-error' : ''}`}>
              <span className="field-icon lock-symbol" aria-hidden="true">▣</span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={Boolean(errors.password)}
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
          </div>
          <button className="primary-button login-button" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" aria-hidden="true" /> Signing in…</> : 'Login'}
          </button>
        </form>
        <p className="demo-note">Demo account: <strong>emilys</strong> / <strong>emilyspass</strong></p>
      </section>
    </main>
  )
}

function Header({ route, cartCount, navigate }: { route: Route; cartCount: number; navigate: (route: Route) => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" type="button" onClick={() => navigate('products')} aria-label="MyShop products">
          <StoreBrand />
        </button>
        <nav aria-label="Main navigation">
          <button className={route === 'products' ? 'nav-link active' : 'nav-link'} type="button" onClick={() => navigate('products')}>
            Products
          </button>
          <button className={route === 'cart' ? 'cart-link active' : 'cart-link'} type="button" onClick={() => navigate('cart')} aria-label={`Cart, ${cartCount} items`}>
            <BagIcon small />
            <span>Cart</span>
            <span className="cart-badge" aria-hidden="true">{cartCount}</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

function ProductImage({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (!src || failed) {
    return <div className={`${className} image-fallback`} role="img" aria-label={`${alt} image unavailable`}><BagIcon /></div>
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

function ProductCard({
  product,
  onReviews,
  onAdd,
  adding,
  addError,
}: {
  product: Product
  onReviews: (product: Product) => void
  onAdd: (product: Product) => void
  adding: boolean
  addError?: string
}) {
  const imageOptions = product.images?.length ? product.images : (product.thumbnail ? [product.thumbnail] : [])
  const [selectedImage, setSelectedImage] = useState(product.thumbnail || imageOptions[0])

  useEffect(() => {
    setSelectedImage(product.thumbnail || imageOptions[0])
  }, [product.id, product.thumbnail])

  return (
    <article className="product-card">
      <div className="product-media">
        <ProductImage src={selectedImage} alt={product.title} className="product-main-image" />
      </div>
      {imageOptions.length > 0 && (
        <div className="thumbnail-strip" aria-label={`${product.title} images`}>
          {imageOptions.map((image, index) => (
            <button
              className={selectedImage === image ? 'thumbnail-button selected' : 'thumbnail-button'}
              type="button"
              key={`${image}-${index}`}
              onClick={() => setSelectedImage(image)}
              aria-label={`Image ${index + 1} of ${imageOptions.length} for ${product.title}`}
              aria-pressed={selectedImage === image}
            >
              <ProductImage src={image} alt="" className="thumbnail-image" />
            </button>
          ))}
        </div>
      )}
      <div className="product-content">
        <p className="product-brand">{product.brand || 'MyShop Selection'}</p>
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>
        <div className="product-facts">
          <strong className="price">{money.format(product.price)}</strong>
          <span className="discount">{product.discountPercentage.toFixed(1)}% off</span>
        </div>
        <button className="review-trigger" type="button" onClick={() => onReviews(product)}>
          <StarIcon />
          <strong>{product.rating.toFixed(1)}</strong>
          <span>View {product.reviews?.length || 0} reviews</span>
        </button>
        {addError && <p className="card-error" role="alert">{addError}</p>}
        <button className="primary-button add-button" type="button" disabled={adding} onClick={() => onAdd(product)}>
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

function ReviewModal({
  product,
  userId,
  onClose,
  onReviewAdded,
}: {
  product: Product
  userId: number
  onClose: () => void
  onReviewAdded: (productId: number, review: Review) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    document.body.classList.add('modal-open')
    closeRef.current?.focus()
    return () => {
      root?.removeAttribute('inert')
      document.body.classList.remove('modal-open')
    }
  }, [])

  function handleDialogKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], input:not([disabled])')]
    if (!focusable.length) return
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

  async function addComment(event: FormEvent) {
    event.preventDefault()
    if (!comment.trim()) {
      setError('Enter a comment before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment.trim(), postId: product.id, userId }),
      })
      if (!response.ok) throw new Error('Comment request failed')
      onReviewAdded(product.id, {
        reviewerName: 'You',
        rating: rating ? Number(rating) : undefined,
        comment: comment.trim(),
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

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div
        className="review-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-title"
        onKeyDown={handleDialogKey}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{product.title}</p>
            <h2 id="reviews-title">Reviews</h2>
          </div>
          <button ref={closeRef} className="close-button" type="button" onClick={onClose} aria-label="Close reviews">×</button>
        </div>
        <div className="reviews-list">
          {product.reviews.length === 0 ? (
            <p className="empty-inline">No reviews yet. Be the first to share your thoughts.</p>
          ) : product.reviews.map((review, index) => (
            <article className="review-row" key={`${review.reviewerName}-${review.date}-${index}`}>
              <div className="review-meta">
                <strong>{review.reviewerName}</strong>
                {review.rating !== undefined && <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>★ {review.rating}/5</span>}
              </div>
              <p>{review.comment}</p>
              <time dateTime={review.date}>{new Date(review.date).toLocaleDateString()}</time>
            </article>
          ))}
        </div>
        <form className="comment-form" onSubmit={addComment} noValidate>
          <h3>Add a comment</h3>
          <div className="comment-grid">
            <div className="field-group">
              <label htmlFor="comment">Your comment</label>
              <textarea id="comment" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your experience…" aria-describedby={error ? 'comment-error' : undefined} aria-invalid={Boolean(error)} />
            </div>
            <div className="field-group">
              <label htmlFor="comment-rating">Rating <span>(optional)</span></label>
              <select id="comment-rating" value={rating} onChange={(event) => setRating(event.target.value)}>
                <option value="">No rating</option>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
              </select>
            </div>
          </div>
          {error && <p className="field-error" id="comment-error" role="alert">{error}</p>}
          <button className="primary-button comment-button" type="submit" disabled={submitting}>{submitting ? 'Posting…' : 'Post comment'}</button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

function ProductsPage({
  userId,
  addToCart,
}: {
  userId: number
  addToCart: (product: Product) => Promise<boolean>
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addErrors, setAddErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    const controller = new AbortController()
    async function loadInitial() {
      setLoading(true)
      setCatalogError('')
      try {
        const response = await fetch(`${API}/products?limit=10&skip=0`, { signal: controller.signal })
        if (!response.ok) throw new Error('Products request failed')
        const data = await response.json() as ProductsResponse
        setProducts(data.products)
        setTotal(data.total)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setCatalogError('Products could not be loaded. Please try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadInitial()
    return () => controller.abort()
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    setCatalogError('')
    try {
      const response = await fetch(`${API}/products?limit=10&skip=${products.length}`)
      if (!response.ok) throw new Error('Products request failed')
      const data = await response.json() as ProductsResponse
      setProducts((current) => [...current, ...data.products.filter((item) => !current.some((existing) => existing.id === item.id))])
      setTotal(data.total)
    } catch {
      setCatalogError('More products could not be loaded. Your current products are still here.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function search(event: FormEvent) {
    event.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery) {
      setSearchResults(null)
      setSearchError('')
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const response = await fetch(`${API}/products/search?q=${encodeURIComponent(cleanQuery)}`)
      if (!response.ok) throw new Error('Search request failed')
      const data = await response.json() as ProductsResponse
      setSearchResults(data.products)
    } catch {
      setSearchError('Search is unavailable right now. Please try again.')
      setSearchResults(null)
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setQuery('')
    setSearchResults(null)
    setSearchError('')
  }

  function openReviews(product: Product) {
    setReturnFocus(document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setSelectedProduct(product)
  }

  function closeReviews() {
    setSelectedProduct(null)
    window.setTimeout(() => returnFocus?.focus(), 0)
  }

  function updateReviews(productId: number, review: Review) {
    const update = (items: Product[]) => items.map((item) => item.id === productId ? { ...item, reviews: [...item.reviews, review] } : item)
    setProducts(update)
    setSearchResults((current) => current ? update(current) : current)
    setSelectedProduct((current) => current?.id === productId ? { ...current, reviews: [...current.reviews, review] } : current)
  }

  async function handleAdd(product: Product) {
    setAddingId(product.id)
    setAddErrors((current) => ({ ...current, [product.id]: '' }))
    const succeeded = await addToCart(product)
    if (!succeeded) setAddErrors((current) => ({ ...current, [product.id]: 'Could not add this item. Please try again.' }))
    setAddingId(null)
  }

  const visibleProducts = searchResults ?? products
  const isSearchView = searchResults !== null
  const canLoadMore = !isSearchView && products.length < total

  return (
    <main className="page-container products-page">
      <section className="listing-heading" aria-labelledby="products-title">
        <div>
          <p className="eyebrow">Curated for everyday life</p>
          <h1 id="products-title">{isSearchView ? 'Search results' : 'All Products'}</h1>
          <p className="showing-count">
            {isSearchView
              ? `${visibleProducts.length} match${visibleProducts.length === 1 ? '' : 'es'} for “${query.trim()}”`
              : `Showing ${products.length} of ${total || '…'} products`}
          </p>
        </div>
        <form className="search-form" role="search" onSubmit={search}>
          <label className="sr-only" htmlFor="product-search">Search products</label>
          <span aria-hidden="true">⌕</span>
          <input id="product-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); if (!event.target.value) clearSearch() }} placeholder="Search products…" />
          {query && <button className="clear-search" type="button" onClick={clearSearch} aria-label="Clear search">×</button>}
          <button className="search-button" type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
        </form>
      </section>

      {searchError && <div className="alert alert-error" role="alert">{searchError}</div>}
      {catalogError && <div className="alert alert-error" role="alert">{catalogError}</div>}

      {loading ? (
        <div className="page-state" role="status"><span className="spinner dark" aria-hidden="true" /> Loading products…</div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty-state">
          <BagIcon />
          <h2>{isSearchView ? 'No products found' : 'No products available'}</h2>
          <p>{isSearchView ? 'Try a different search term.' : 'Please check back later.'}</p>
          {isSearchView && <button className="secondary-button" type="button" onClick={clearSearch}>View all products</button>}
        </div>
      ) : (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onReviews={openReviews}
              onAdd={(item) => void handleAdd(item)}
              adding={addingId === product.id}
              addError={addErrors[product.id]}
            />
          ))}
        </div>
      )}

      {canLoadMore && (
        <div className="load-more-wrap">
          <button className="secondary-button load-more" type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Loading more…' : 'Load more products'}
          </button>
        </div>
      )}
      {!loading && !isSearchView && products.length > 0 && !canLoadMore && <p className="end-note">You’ve reached the end of the catalog.</p>}

      {selectedProduct && <ReviewModal product={selectedProduct} userId={userId} onClose={closeReviews} onReviewAdded={updateReviews} />}
    </main>
  )
}

function CartPage({
  lines,
  setLines,
  navigate,
}: {
  lines: CartLine[]
  setLines: (updater: (current: CartLine[]) => CartLine[]) => void
  navigate: (route: Route) => void
}) {
  const [ordered, setOrdered] = useState(false)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  function changeQuantity(productId: number, amount: number) {
    setOrdered(false)
    setLines((current) => current
      .map((line) => line.product.id === productId ? { ...line, quantity: line.quantity + amount } : line)
      .filter((line) => line.quantity > 0))
  }

  function remove(productId: number) {
    setOrdered(false)
    setLines((current) => current.filter((line) => line.product.id !== productId))
  }

  function placeOrder() {
    setOrdered(true)
    setLines(() => [])
  }

  if (ordered) {
    return (
      <main className="page-container">
        <section className="order-success" role="status">
          <div className="success-icon" aria-hidden="true">✓</div>
          <p className="eyebrow">Order confirmed</p>
          <h1>Thank you for your order!</h1>
          <p>Your order has been placed successfully. We hope you enjoy your purchase.</p>
          <button className="primary-button" type="button" onClick={() => { setOrdered(false); navigate('products') }}>Continue Shopping</button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-container cart-page">
      <div className="cart-title-row">
        <div>
          <p className="eyebrow">Your selections</p>
          <h1>Your Cart <span>({itemCount})</span></h1>
        </div>
        <button className="text-button" type="button" onClick={() => navigate('products')}>← Continue Shopping</button>
      </div>

      {lines.length === 0 ? (
        <section className="empty-state cart-empty">
          <BagIcon />
          <h2>Your cart is empty</h2>
          <p>Explore the catalog and add something you love.</p>
          <button className="primary-button" type="button" onClick={() => navigate('products')}>Browse products</button>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            <div className="cart-table-head" aria-hidden="true">
              <span>Product</span><span>Price</span><span>Quantity</span><span>Total</span>
            </div>
            {lines.map((line) => (
              <article className="cart-line" key={line.product.id}>
                <div className="cart-product">
                  <ProductImage src={line.product.thumbnail || line.product.images[0]} alt={line.product.title} className="cart-image" />
                  <div>
                    <p className="product-brand">{line.product.brand || 'MyShop Selection'}</p>
                    <h2>{line.product.title}</h2>
                    <button className="remove-button" type="button" onClick={() => remove(line.product.id)}>Remove</button>
                  </div>
                </div>
                <p className="cart-price"><span className="mobile-label">Price</span>{money.format(line.product.price)}</p>
                <div>
                  <span className="mobile-label">Quantity</span>
                  <div className="stepper">
                    <button type="button" onClick={() => changeQuantity(line.product.id, -1)} aria-label={`Decrease ${line.product.title} quantity`}>−</button>
                    <output aria-label={`${line.product.title} quantity`}>{line.quantity}</output>
                    <button type="button" onClick={() => changeQuantity(line.product.id, 1)} aria-label={`Increase ${line.product.title} quantity`}>+</button>
                  </div>
                </div>
                <strong className="line-total"><span className="mobile-label">Total</span>{money.format(line.product.price * line.quantity)}</strong>
              </article>
            ))}
          </section>
          <aside className="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order summary</h2>
            <div className="summary-row"><span>Subtotal</span><span>{money.format(subtotal)}</span></div>
            <div className="summary-total"><span>Total</span><strong>{money.format(subtotal)}</strong></div>
            <button className="primary-button place-order" type="button" onClick={placeOrder}>Place Order</button>
            <p>Secure in-app checkout</p>
          </aside>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => readSession())
  const [route, setRoute] = useState<Route>(() => routeFromLocation(Boolean(readSession())))
  const [cartLines, setCartLines] = useState<CartLine[]>([])

  useEffect(() => {
    const onPopState = () => setRoute(routeFromLocation(Boolean(user)))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [user])

  useEffect(() => {
    const page = route === 'login' ? 'Login' : route === 'cart' ? 'Your Cart' : 'Products'
    document.title = `${page} | MyShop`
  }, [route])

  function navigate(destination: Route, replace = false) {
    const safeDestination = user ? destination : 'login'
    const path = safeDestination === 'cart' ? '/cart' : safeDestination === 'products' ? '/products' : '/'
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
    setRoute(safeDestination)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLogin(authUser: AuthUser) {
    sessionStorage.setItem('myshop-session', JSON.stringify(authUser))
    setUser(authUser)
    window.history.replaceState({}, '', '/products')
    setRoute('products')
  }

  async function addToCart(product: Product) {
    if (!user) return false
    try {
      const response = await fetch(`${API}/carts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, products: [{ id: product.id, quantity: 1 }] }),
      })
      if (!response.ok) throw new Error('Cart request failed')
      setCartLines((current) => {
        const existing = current.find((line) => line.product.id === product.id)
        return existing
          ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
          : [...current, { product, quantity: 1 }]
      })
      return true
    } catch {
      return false
    }
  }

  if (!user) return <Login onLogin={handleLogin} />

  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0)
  return (
    <div className="app-shell">
      <Header route={route} cartCount={cartCount} navigate={navigate} />
      {route === 'cart'
        ? <CartPage lines={cartLines} setLines={setCartLines} navigate={navigate} />
        : <ProductsPage userId={user.id} addToCart={addToCart} />}
    </div>
  )
}
