import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

const API = 'https://dummyjson.com'
const PAGE_SIZE = 10
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23f1f3f2'/%3E%3Cpath d='M265 190h110v100H265z' fill='none' stroke='%2396a09b' stroke-width='8'/%3E%3Ccircle cx='290' cy='215' r='12' fill='%2396a09b'/%3E%3Cpath d='m275 275 38-40 25 25 18-17 24 32' fill='none' stroke='%2396a09b' stroke-width='8'/%3E%3Ctext x='320' y='330' text-anchor='middle' font-family='Arial' font-size='18' fill='%236f7873'%3EImage unavailable%3C/text%3E%3C/svg%3E"

type Session = {
  id: number
  accessToken: string
  firstName?: string
  username?: string
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

type IconName = 'bag' | 'cart' | 'user' | 'lock' | 'eye' | 'eyeOff' | 'search' | 'star' | 'close' | 'minus' | 'plus'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    bag: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    cart: <><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.1 2.8M6.5 6.5C3.6 8.3 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    star: <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />,
    close: <><path d="m5 5 14 14" /><path d="m19 5-14 14" /></>,
    minus: <path d="M5 12h14" />,
    plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

async function responseMessage(response: Response, fallback: string) {
  try {
    const data = await response.json() as { message?: string }
    return data.message || fallback
  } catch {
    return fallback
  }
}

function safeSession(): Session | null {
  try {
    const stored = sessionStorage.getItem('myshop-session')
    return stored ? JSON.parse(stored) as Session : null
  } catch {
    return null
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(safeSession)
  const [view, setView] = useState<'products' | 'cart'>('products')
  const [cart, setCart] = useState<CartLine[]>([])

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  if (!session) {
    return <Login onLogin={(nextSession) => {
      sessionStorage.setItem('myshop-session', JSON.stringify(nextSession))
      setSession(nextSession)
    }} />
  }

  return (
    <div className="app-shell">
      <Header view={view} cartCount={cartCount} onNavigate={setView} />
      <main id="main-content">
        {view === 'products' ? (
          <ProductsPage
            session={session}
            onCartChange={(product) => {
              setCart((current) => {
                const existing = current.find((line) => line.product.id === product.id)
                if (existing) {
                  return current.map((line) => line.product.id === product.id
                    ? { ...line, quantity: line.quantity + 1 }
                    : line)
                }
                return [...current, { product, quantity: 1 }]
              })
            }}
          />
        ) : (
          <CartPage cart={cart} onCartChange={setCart} onContinue={() => setView('products')} />
        )}
      </main>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter both your username and password.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, expiresInMins: 60 }),
      })
      if (!response.ok) {
        setError(await responseMessage(response, 'We could not sign you in. Check your details and try again.'))
        return
      }
      const data = await response.json() as Session
      if (!data.id || !data.accessToken) throw new Error('Incomplete login response')
      onLogin(data)
    } catch {
      setError('Unable to connect. Check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Brand centered />
        <div className="login-heading">
          <h1 id="login-title">Welcome Back</h1>
          <p>Sign in to continue shopping</p>
        </div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="username">Username</label>
          <div className="field-with-icon">
            <Icon name="user" />
            <input id="username" name="username" autoComplete="username" placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} aria-invalid={Boolean(error) && !username.trim()} />
          </div>
          <label htmlFor="password">Password</label>
          <div className="field-with-icon">
            <Icon name="lock" />
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error) && !password} />
            <button className="icon-button password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <Icon name={showPassword ? 'eyeOff' : 'eye'} />
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-button" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        </form>
      </section>
    </main>
  )
}

function Brand({ centered = false }: { centered?: boolean }) {
  return <div className={`brand ${centered ? 'brand-centered' : ''}`}><span className="brand-mark"><Icon name="bag" size={24} /></span><span>MyShop</span></div>
}

function Header({ view, cartCount, onNavigate }: { view: 'products' | 'cart'; cartCount: number; onNavigate: (view: 'products' | 'cart') => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" onClick={() => onNavigate('products')} aria-label="MyShop home"><Brand /></button>
        <nav aria-label="Main navigation">
          <button className={view === 'products' ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate('products')} aria-current={view === 'products' ? 'page' : undefined}>Products</button>
          <button className={view === 'cart' ? 'cart-link active' : 'cart-link'} onClick={() => onNavigate('cart')} aria-current={view === 'cart' ? 'page' : undefined}>
            <Icon name="cart" size={22} /><span>Cart</span><span className="cart-badge" aria-label={`${cartCount} items in cart`}>{cartCount}</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

function ProductsPage({ session, onCartChange }: { session: Session; onCartChange: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [localReviews, setLocalReviews] = useState<Record<number, Review[]>>({})
  const [addingIds, setAddingIds] = useState<number[]>([])
  const [cartErrors, setCartErrors] = useState<Record<number, string>>({})
  const initialRequested = useRef(false)

  async function loadPage(skip: number) {
    setCatalogError('')
    setCatalogLoading(true)
    try {
      const response = await fetch(`${API}/products?limit=${PAGE_SIZE}&skip=${skip}`)
      if (!response.ok) throw new Error('Products request failed')
      const data = await response.json() as ProductsResponse
      setProducts((current) => skip === 0 ? data.products : [...current, ...data.products])
      setTotal(data.total)
      if (data.products.length === 0 && skip === 0) setCatalogError('No products are available right now.')
    } catch {
      setCatalogError(skip === 0 ? 'Unable to load products. Please try again.' : 'Could not load more products. Your current products are still here.')
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    if (initialRequested.current) return
    initialRequested.current = true
    void loadPage(0)
  }, [])

  async function search(event: FormEvent) {
    event.preventDefault()
    const nextQuery = query.trim()
    if (!nextQuery) {
      setSearchQuery('')
      setSearchResults([])
      setSearchError('')
      return
    }
    setSearchQuery(nextQuery)
    setSearchLoading(true)
    setSearchError('')
    try {
      const response = await fetch(`${API}/products/search?q=${encodeURIComponent(nextQuery)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json() as ProductsResponse
      setSearchResults(data.products)
    } catch {
      setSearchResults([])
      setSearchError('Search is unavailable right now. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setQuery('')
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
  }

  async function addToCart(product: Product) {
    setCartErrors((current) => ({ ...current, [product.id]: '' }))
    setAddingIds((current) => [...current, product.id])
    try {
      const response = await fetch(`${API}/carts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.id, products: [{ id: product.id, quantity: 1 }] }),
      })
      if (!response.ok) throw new Error('Cart request failed')
      onCartChange(product)
    } catch {
      setCartErrors((current) => ({ ...current, [product.id]: 'Could not add this item. Please try again.' }))
    } finally {
      setAddingIds((current) => current.filter((id) => id !== product.id))
    }
  }

  const visibleProducts = searchQuery ? searchResults : products
  const hasMore = products.length < total
  const selectedWithLocalReviews = selectedProduct
    ? { ...selectedProduct, reviews: [...(selectedProduct.reviews || []), ...(localReviews[selectedProduct.id] || [])] }
    : null

  return (
    <div className="page-container products-page">
      <div className="catalog-heading">
        <div><p className="eyebrow">Discover something new</p><h1>All Products</h1></div>
        <p className="showing-count" aria-live="polite">{searchQuery ? `${visibleProducts.length} results for “${searchQuery}”` : `Showing ${products.length} of ${total || '…'} products`}</p>
      </div>
      <form className="search-form" role="search" onSubmit={search}>
        <label className="sr-only" htmlFor="product-search">Search products</label>
        <span className="search-icon"><Icon name="search" /></span>
        <input id="product-search" placeholder="Search products…" value={query} onChange={(event) => setQuery(event.target.value)} />
        {searchQuery && <button type="button" className="clear-search" onClick={clearSearch}>Clear</button>}
        <button className="search-button" disabled={searchLoading}>{searchLoading ? 'Searching…' : 'Search'}</button>
      </form>

      {searchError && <div className="notice error-notice" role="alert">{searchError}</div>}
      {!searchQuery && catalogError && <div className="notice error-notice" role="alert">{catalogError}</div>}
      {catalogLoading && products.length === 0 && <LoadingCards />}
      {searchLoading && <p className="status-message" role="status">Finding matching products…</p>}
      {!searchLoading && searchQuery && !searchError && visibleProducts.length === 0 && <div className="empty-state"><h2>No products found</h2><p>Try a different search term.</p><button className="secondary-button" onClick={clearSearch}>View all products</button></div>}
      {!catalogLoading && !searchQuery && products.length === 0 && catalogError && <button className="secondary-button retry-button" onClick={() => void loadPage(0)}>Try again</button>}

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            reviews={[...(product.reviews || []), ...(localReviews[product.id] || [])]}
            onReviews={() => setSelectedProduct(product)}
            onAdd={() => void addToCart(product)}
            adding={addingIds.includes(product.id)}
            cartError={cartErrors[product.id]}
          />
        ))}
      </div>

      {!searchQuery && products.length > 0 && (
        <div className="load-more-wrap">
          {hasMore ? <button className="secondary-button load-more" disabled={catalogLoading} onClick={() => void loadPage(products.length)}>{catalogLoading ? 'Loading…' : 'Load more products'}</button> : <p className="end-message">You’ve reached the end of the collection.</p>}
        </div>
      )}

      {selectedWithLocalReviews && (
        <ReviewDialog
          product={selectedWithLocalReviews}
          session={session}
          onClose={() => setSelectedProduct(null)}
          onAdded={(review) => setLocalReviews((current) => ({ ...current, [selectedProduct!.id]: [...(current[selectedProduct!.id] || []), review] }))}
        />
      )}
    </div>
  )
}

function LoadingCards() {
  return <div className="product-grid" aria-label="Loading products" aria-busy="true">{[1, 2, 3].map((number) => <div className="skeleton-card" key={number}><div className="skeleton image" /><div className="skeleton line wide" /><div className="skeleton line" /><div className="skeleton line short" /></div>)}</div>
}

function ProductCard({ product, reviews, onReviews, onAdd, adding, cartError }: { product: Product; reviews: Review[]; onReviews: () => void; onAdd: () => void; adding: boolean; cartError?: string }) {
  const gallery = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : []
  const [selectedImage, setSelectedImage] = useState(product.thumbnail || gallery[0] || FALLBACK_IMAGE)

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img className="product-image" src={selectedImage || FALLBACK_IMAGE} alt={selectedImage === FALLBACK_IMAGE ? '' : product.title} loading="lazy" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE }} />
        {product.discountPercentage > 0 && <span className="discount-badge">−{product.discountPercentage.toFixed(0)}%</span>}
      </div>
      <div className="thumbnail-strip" aria-label={`${product.title} images`}>
        {(gallery.length ? gallery : [FALLBACK_IMAGE]).map((image, index) => (
          <button key={`${image}-${index}`} className={selectedImage === image ? 'thumbnail active' : 'thumbnail'} onClick={() => setSelectedImage(image)} aria-label={`Image ${index + 1} of ${gallery.length || 1}`} aria-pressed={selectedImage === image}>
            <img src={image} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE }} />
          </button>
        ))}
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand || 'Everyday essentials'}</p>
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          <span className="price">${product.price.toFixed(2)}</span>
          <button className="review-button" onClick={onReviews} aria-label={`Read ${reviews.length} reviews for ${product.title}`}>
            <span className="star"><Icon name="star" size={17} /></span><strong>{product.rating.toFixed(1)}</strong><span>({reviews.length})</span>
          </button>
        </div>
        <button className="primary-button add-button" onClick={onAdd} disabled={adding}><Icon name="bag" size={19} />{adding ? 'Adding…' : 'Add to Cart'}</button>
        {cartError && <p className="card-error" role="alert">{cartError}</p>}
      </div>
    </article>
  )
}

function ReviewDialog({ product, session, onClose, onAdded }: { product: Product; session: Session; onClose: () => void; onAdded: (review: Review) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
      openerRef.current?.focus()
    }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const body = comment.trim()
    setError('')
    if (!body) {
      setError('Write a comment before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, postId: product.id, userId: session.id }),
      })
      if (!response.ok) throw new Error('Comment request failed')
      onAdded({
        reviewerName: session.firstName || session.username || 'You',
        comment: body,
        rating: rating || undefined,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating(0)
    } catch {
      setError('Your comment could not be added. Existing reviews have not changed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="review-dialog" aria-labelledby="reviews-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
      <div className="dialog-header">
        <div><p className="eyebrow">What customers say</p><h2 id="reviews-title">Reviews</h2><p className="dialog-product-name">{product.title}</p></div>
        <button className="icon-button close-button" onClick={onClose} aria-label="Close reviews" autoFocus><Icon name="close" /></button>
      </div>
      <div className="reviews-list">
        {product.reviews.length === 0 ? <div className="empty-reviews"><p>No reviews yet.</p><span>Be the first to share your thoughts.</span></div> : product.reviews.map((review, index) => (
          <article className="review-row" key={`${review.reviewerName}-${review.date}-${index}`}>
            <div className="review-top"><strong>{review.reviewerName}</strong>{review.rating && <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}><Icon name="star" size={15} /> {review.rating}/5</span>}</div>
            <p>{review.comment}</p>
            <time dateTime={review.date}>{new Date(review.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>
          </article>
        ))}
      </div>
      <form className="comment-form" onSubmit={submit}>
        <h3>Add a comment</h3>
        <label htmlFor="comment">Your comment</label>
        <textarea id="comment" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your experience…" />
        <fieldset className="rating-field">
          <legend>Rating <span>(optional)</span></legend>
          <div className="rating-options">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= rating ? 'rating-star selected' : 'rating-star'} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={rating === value}><Icon name="star" size={24} /></button>)}</div>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button comment-submit" disabled={submitting}>{submitting ? 'Posting…' : 'Post comment'}</button>
      </form>
    </dialog>
  )
}

function CartPage({ cart, onCartChange, onContinue }: { cart: CartLine[]; onCartChange: (cart: CartLine[]) => void; onContinue: () => void }) {
  const [ordered, setOrdered] = useState(false)
  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  function changeQuantity(productId: number, amount: number) {
    setOrdered(false)
    onCartChange(cart.map((line) => line.product.id === productId ? { ...line, quantity: Math.max(1, line.quantity + amount) } : line))
  }

  function remove(productId: number) {
    setOrdered(false)
    onCartChange(cart.filter((line) => line.product.id !== productId))
  }

  return (
    <div className="page-container cart-page">
      <div className="cart-heading"><div><p className="eyebrow">Your selections</p><h1>Your Cart <span>({count})</span></h1></div><button className="text-button" onClick={onContinue}>← Continue Shopping</button></div>
      {ordered && <div className="order-success" role="status"><span>✓</span><div><strong>Order placed successfully!</strong><p>Thank you for shopping with MyShop.</p></div></div>}
      {cart.length === 0 ? (
        <div className="empty-state cart-empty"><span className="empty-cart-icon"><Icon name="cart" size={42} /></span><h2>Your cart is empty</h2><p>Explore our products and find something you’ll love.</p><button className="primary-button" onClick={onContinue}>Start shopping</button></div>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            <div className="cart-table-header" aria-hidden="true"><span>Product</span><span>Price</span><span>Quantity</span><span>Total</span></div>
            {cart.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <div className="cart-product">
                  <img src={product.thumbnail || product.images?.[0] || FALLBACK_IMAGE} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE }} />
                  <div><p className="product-brand">{product.brand || 'Everyday essentials'}</p><h2>{product.title}</h2><button className="remove-button" onClick={() => remove(product.id)}>Remove</button></div>
                </div>
                <p className="cart-price"><span className="mobile-label">Price</span>${product.price.toFixed(2)}</p>
                <div><span className="mobile-label">Quantity</span><div className="quantity-control">
                  <button onClick={() => changeQuantity(product.id, -1)} disabled={quantity === 1} aria-label={`Decrease quantity of ${product.title}`}><Icon name="minus" size={16} /></button>
                  <span aria-live="polite" aria-label={`Quantity ${quantity}`}>{quantity}</span>
                  <button onClick={() => changeQuantity(product.id, 1)} aria-label={`Increase quantity of ${product.title}`}><Icon name="plus" size={16} /></button>
                </div></div>
                <p className="line-total"><span className="mobile-label">Total</span>${(product.price * quantity).toFixed(2)}</p>
              </article>
            ))}
          </section>
          <aside className="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order Summary</h2>
            <div className="summary-row"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
            <div className="summary-divider" />
            <div className="summary-row summary-total"><span>Total</span><strong>${subtotal.toFixed(2)}</strong></div>
            <button className="primary-button place-order" onClick={() => setOrdered(true)} disabled={ordered}>{ordered ? 'Order placed' : 'Place Order'}</button>
            <p className="secure-note">Secure checkout · No payment required</p>
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
