import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

type Session = { id: number; accessToken: string; username?: string }
type Review = {
  rating?: number
  comment: string
  date?: string
  reviewerName?: string
}
type Product = {
  id: number
  title: string
  description: string
  price: number
  discountPercentage?: number
  rating?: number
  brand?: string
  thumbnail?: string
  images?: string[]
  reviews?: Review[]
}
type CartLine = { product: Product; quantity: number }

const API = 'https://dummyjson.com'
const PAGE_SIZE = 10

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Network error. Check your connection and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      typeof data.message === 'string' ? data.message : 'Something went wrong. Please try again.',
    )
  }
  return data as T
}

function Icon({ name }: { name: 'bag' | 'user' | 'lock' | 'cart' | 'star' }) {
  const paths = {
    bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    cart: <><path d="M3 4h2l2.2 10h9.9l2-7H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z" />,
  }
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <span className="brand"><span className="brand-mark"><Icon name="bag" /></span>MyShop</span>
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter both your username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await jsonRequest<Session>(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      localStorage.setItem('myshop-session', JSON.stringify(data))
      onLogin(data)
    } catch (err) {
      setError(messageFrom(err, 'Unable to sign in. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <Brand />
        <h1 id="login-heading">Welcome Back</h1>
        <p className="muted">Log in to continue shopping.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="username">Username</label>
          <div className="input-wrap">
            <Icon name="user" />
            <input id="username" autoComplete="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} aria-invalid={!!error && !username.trim()} />
          </div>
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <Icon name="lock" />
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error && !password} />
            <button className="show-password" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={`${showPassword ? 'Hide' : 'Show'} password`}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary login-button" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
      </section>
    </main>
  )
}

function Header({ route, setRoute, count }: { route: 'products' | 'cart'; setRoute: (route: 'products' | 'cart') => void; count: number }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" onClick={() => setRoute('products')} aria-label="MyShop products"><Brand /></button>
        <nav aria-label="Main navigation">
          <button className={route === 'products' ? 'active' : ''} onClick={() => setRoute('products')} aria-current={route === 'products' ? 'page' : undefined}>Products</button>
          <button className={`cart-link ${route === 'cart' ? 'active' : ''}`} onClick={() => setRoute('cart')} aria-current={route === 'cart' ? 'page' : undefined}>
            <Icon name="cart" /> Cart <span className="badge" aria-label={`${count} items in cart`}>{count}</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

function ProductCard({ product, onReview, onAdd, adding, addError }: {
  product: Product
  onReview: () => void
  onAdd: () => void
  adding: boolean
  addError?: string
}) {
  const images = (product.images?.length ? product.images : [product.thumbnail]).filter(Boolean) as string[]
  const [selected, setSelected] = useState(images[0] ?? '')
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setSelected(images[0] ?? '')
    setBroken(false)
  }, [product.id])

  return (
    <article className="product-card">
      <div className="image-stage">
        {selected && !broken
          ? <img src={selected} alt={product.title} onError={() => setBroken(true)} />
          : <div className="image-fallback" role="img" aria-label={`No image available for ${product.title}`}>Image unavailable</div>}
      </div>
      {images.length > 0 && <div className="thumbs" aria-label={`${product.title} image gallery`}>
        {images.map((image, index) => (
          <button key={`${image}-${index}`} className={selected === image ? 'selected' : ''} onClick={() => { setSelected(image); setBroken(false) }} aria-label={`Image ${index + 1} of ${images.length}`} aria-pressed={selected === image}>
            <img src={image} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
          </button>
        ))}
      </div>}
      <div className="product-copy">
        <p className="eyebrow">{product.brand || 'Brand unavailable'}</p>
        <h2>{product.title}</h2>
        <p className="description">{product.description}</p>
        <div className="product-meta">
          <strong>${product.price.toFixed(2)}</strong>
          {typeof product.discountPercentage === 'number' && <span>{product.discountPercentage.toFixed(1)}% off</span>}
        </div>
        <button className="review-button" onClick={onReview}><Icon name="star" /> {product.rating?.toFixed(1) ?? 'Not rated'} · {product.reviews?.length ?? 0} reviews</button>
        <button className="primary add-button" onClick={onAdd} disabled={adding}>{adding ? 'Adding…' : 'Add to Cart'}</button>
        {addError && <p className="error compact" role="alert">{addError}</p>}
      </div>
    </article>
  )
}

function ReviewModal({ product, reviews, session, onClose, onAppend }: {
  product: Product
  reviews: Review[]
  session: Session
  onClose: () => void
  onAppend: (review: Review) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previous?.focus()
  }, [])

  function keyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose()
    if (event.key === 'Tab' && dialogRef.current) {
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button,input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter((node) => !node.hasAttribute('disabled'))
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!comment.trim()) {
      setError('Enter a comment before submitting.')
      return
    }
    setPosting(true)
    setError('')
    try {
      await jsonRequest(`${API}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment.trim(), postId: product.id, userId: session.id }),
      })
      onAppend({
        comment: comment.trim(),
        reviewerName: session.username || 'You',
        date: new Date().toISOString(),
        rating: rating ? Number(rating) : undefined,
      })
      setComment('')
      setRating('')
    } catch (err) {
      setError(messageFrom(err, 'Could not add your comment.'))
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reviews-title" ref={dialogRef} onKeyDown={keyDown}>
        <div className="modal-heading">
          <div><p className="eyebrow">{product.title}</p><h2 id="reviews-title">Reviews</h2></div>
          <button className="close" onClick={onClose} ref={closeRef} aria-label="Close reviews">×</button>
        </div>
        <div className="reviews">
          {reviews.length === 0
            ? <p className="empty-state">No reviews yet. Be the first to comment.</p>
            : reviews.map((review, index) => (
              <article className="review" key={`${review.reviewerName}-${review.date}-${index}`}>
                <div><strong>{review.reviewerName || 'Anonymous'}</strong>{review.rating && <span className="stars">★ {review.rating}/5</span>}</div>
                <p>{review.comment}</p>
                {review.date && <time dateTime={review.date}>{new Date(review.date).toLocaleDateString()}</time>}
              </article>
            ))}
        </div>
        <form className="comment-form" onSubmit={submit}>
          <h3>Add a comment</h3>
          <label htmlFor="comment">Your comment</label>
          <textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts" />
          <label htmlFor="rating">Rating (optional)</label>
          <select id="rating" value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}
          </select>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={posting}>{posting ? 'Posting…' : 'Post comment'}</button>
        </form>
      </div>
    </div>
  )
}

function Products({ session, onAdd }: { session: Session; onAdd: (product: Product) => Promise<void> }) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [localReviews, setLocalReviews] = useState<Record<number, Review[]>>({})
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addErrors, setAddErrors] = useState<Record<number, string>>({})

  async function loadPage(skip: number) {
    if (skip === 0) setInitialLoading(true)
    else setLoadingMore(true)
    setCatalogError('')
    try {
      const data = await jsonRequest<{ products: Product[]; total: number }>(`${API}/products?limit=${PAGE_SIZE}&skip=${skip}`)
      setProducts((current) => skip === 0 ? data.products : [...current, ...data.products])
      setTotal(data.total)
    } catch (err) {
      setCatalogError(messageFrom(err, 'Could not load products.'))
    } finally {
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { void loadPage(0) }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults(null)
      setSearchError('')
      setSearching(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const data = await jsonRequest<{ products: Product[] }>(`${API}/products/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        setSearchResults(data.products)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setSearchError(messageFrom(err, 'Could not search products.'))
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 350)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query])

  const visible = searchResults ?? products
  const reviewsFor = (product: Product) => [...(product.reviews ?? []), ...(localReviews[product.id] ?? [])]

  async function add(product: Product) {
    setAddingId(product.id)
    setAddErrors((errors) => ({ ...errors, [product.id]: '' }))
    try {
      await onAdd(product)
    } catch (err) {
      setAddErrors((errors) => ({ ...errors, [product.id]: messageFrom(err, 'Could not add this item.') }))
    } finally {
      setAddingId(null)
    }
  }

  return (
    <>
      <main className="page" aria-hidden={modalProduct ? true : undefined}>
        <div className="page-heading">
          <div><p className="eyebrow">Shop the collection</p><h1>All Products</h1><p className="muted">Showing {visible.length}{searchResults === null && total ? ` of ${total}` : ''} products</p></div>
          <div className="search">
            <label htmlFor="product-search">Search products</label>
            <input id="product-search" type="search" placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        {searching && <p className="status" role="status">Searching…</p>}
        {searchError && <p className="error panel" role="alert">{searchError}</p>}
        {initialLoading && <p className="status" role="status">Loading products…</p>}
        {!initialLoading && catalogError && products.length === 0 && <div className="error panel" role="alert"><p>{catalogError}</p><button onClick={() => void loadPage(0)}>Try again</button></div>}
        {!initialLoading && !catalogError && products.length === 0 && searchResults === null && <p className="empty-state">No products are available.</p>}
        {!searching && searchResults?.length === 0 && !searchError && <p className="empty-state">No products match “{query.trim()}”.</p>}
        <section className="product-grid" aria-label="Products">
          {visible.map((product) => <ProductCard key={product.id} product={{ ...product, reviews: reviewsFor(product) }} onReview={() => setModalProduct(product)} onAdd={() => void add(product)} adding={addingId === product.id} addError={addErrors[product.id]} />)}
        </section>
        {searchResults === null && products.length > 0 && products.length < total && (
          <div className="load-more">
            {catalogError && <p className="error" role="alert">{catalogError}</p>}
            <button className="secondary" onClick={() => void loadPage(products.length)} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</button>
          </div>
        )}
      </main>
      {modalProduct && <ReviewModal product={modalProduct} reviews={reviewsFor(modalProduct)} session={session} onClose={() => setModalProduct(null)} onAppend={(review) => setLocalReviews((current) => ({ ...current, [modalProduct.id]: [...(current[modalProduct.id] ?? []), review] }))} />}
    </>
  )
}

function Cart({ lines, onQuantity, onRemove, onContinue }: {
  lines: CartLine[]
  onQuantity: (id: number, quantity: number) => void
  onRemove: (id: number) => void
  onContinue: () => void
}) {
  const [ordered, setOrdered] = useState(false)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  if (ordered) {
    return <main className="page confirmation"><div className="success-mark">✓</div><h1>Order placed!</h1><p>Thank you for shopping with MyShop.</p><button className="primary" onClick={onContinue}>Continue Shopping</button></main>
  }

  return (
    <main className="page cart-page">
      <div className="page-heading"><div><p className="eyebrow">Shopping bag</p><h1>Your Cart ({count})</h1></div><button className="text-button" onClick={onContinue}>← Continue Shopping</button></div>
      {lines.length === 0
        ? <div className="empty-state"><h2>Your cart is empty</h2><p>Add a product to get started.</p><button className="primary" onClick={onContinue}>Browse Products</button></div>
        : <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            {lines.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                {product.thumbnail ? <img src={product.thumbnail} alt="" /> : <div className="cart-image-fallback">No image</div>}
                <div className="line-info"><h2>{product.title}</h2><p>${product.price.toFixed(2)} each</p><button className="remove" onClick={() => onRemove(product.id)}>Remove</button></div>
                <div className="quantity" aria-label={`Quantity for ${product.title}`}>
                  <button onClick={() => onQuantity(product.id, quantity - 1)} aria-label={`Decrease ${product.title} quantity`}>−</button>
                  <span aria-live="polite">{quantity}</span>
                  <button onClick={() => onQuantity(product.id, quantity + 1)} aria-label={`Increase ${product.title} quantity`}>+</button>
                </div>
                <strong className="line-total">${(product.price * quantity).toFixed(2)}</strong>
              </article>
            ))}
          </section>
          <aside className="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order Summary</h2>
            <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
            <div className="total"><span>Total</span><strong>${subtotal.toFixed(2)}</strong></div>
            <button className="primary" onClick={() => setOrdered(true)}>Place Order</button>
          </aside>
        </div>}
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem('myshop-session') || 'null') }
    catch { return null }
  })
  const [route, setRouteState] = useState<'products' | 'cart'>(() => window.location.hash === '#cart' ? 'cart' : 'products')
  const [cart, setCart] = useState<CartLine[]>([])

  useEffect(() => {
    document.title = route === 'cart' ? 'Your Cart | MyShop' : session ? 'Products | MyShop' : 'Login | MyShop'
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.append(meta) }
    meta.content = 'Browse products and shop online with MyShop.'
  }, [route, session])

  function setRoute(next: 'products' | 'cart') {
    setRouteState(next)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function addToCart(product: Product) {
    if (!session) throw new Error('Please log in again.')
    await jsonRequest(`${API}/carts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.id, products: [{ id: product.id, quantity: 1 }] }),
    })
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id)
      return line
        ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { product, quantity: 1 }]
    })
  }

  if (!session) return <Login onLogin={(value) => { setSession(value); setRoute('products') }} />

  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  return (
    <>
      <Header route={route} setRoute={setRoute} count={count} />
      {route === 'products'
        ? <Products session={session} onAdd={addToCart} />
        : <Cart lines={cart} onContinue={() => setRoute('products')} onRemove={(id) => setCart((lines) => lines.filter((line) => line.product.id !== id))} onQuantity={(id, quantity) => setCart((lines) => quantity < 1 ? lines.filter((line) => line.product.id !== id) : lines.map((line) => line.product.id === id ? { ...line, quantity } : line))} />}
    </>
  )
}
