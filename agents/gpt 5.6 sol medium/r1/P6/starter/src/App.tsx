import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const PRODUCTS_URL = 'https://dummyjson.com/products'
const CARTS_URL = 'https://dummyjson.com/carts/add'
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

type Page = 'products' | 'cart'

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

type CartItem = {
  product: Product
  quantity: number
}

function pageFromPath(): Page {
  return window.location.pathname === '/cart' ? 'cart' : 'products'
}

function readSession(): Session | null {
  try {
    const storedSession = sessionStorage.getItem(SESSION_KEY)

    if (!storedSession) {
      return null
    }

    const session: unknown = JSON.parse(storedSession)

    if (
      typeof session === 'object' &&
      session !== null &&
      'id' in session &&
      typeof session.id === 'number' &&
      'accessToken' in session &&
      typeof session.accessToken === 'string'
    ) {
      return { id: session.id, accessToken: session.accessToken }
    }
  } catch {
    // An unavailable or malformed session should return the user to login.
  }

  return null
}

function Brand() {
  return (
    <div className="brand" aria-label="MyShop">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M7.5 10.5h17l1.5 17H6l1.5-17Z" />
          <path d="M11.5 12V9a4.5 4.5 0 0 1 9 0v3" />
        </svg>
      </span>
      <span>MyShop</span>
    </div>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 7H6" />
      <circle cx="9.5" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  )
}

function ImagePlaceholder() {
  return (
    <div className="image-placeholder" role="img" aria-label="Image unavailable">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m4 17 5-5 4 4 2-2 5 5" />
      </svg>
      <span>Image unavailable</span>
    </div>
  )
}

function ProductCard({
  product,
  onOpenReviews,
  onAddToCart,
}: {
  product: Product
  onOpenReviews: (product: Product) => void
  onAddToCart: (product: Product) => Promise<void>
}) {
  const imageOptions = [product.thumbnail, ...(product.images ?? [])].filter(
    (image, index, all) => Boolean(image) && all.indexOf(image) === index,
  )
  const [selectedImage, setSelectedImage] = useState(imageOptions[0] ?? '')
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const [isAdding, setIsAdding] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const titleId = useId()
  const availableImages = imageOptions.filter((image) => !failedImages.has(image))

  function handleImageError(image: string) {
    setFailedImages((current) => {
      const next = new Set(current)
      next.add(image)
      return next
    })

    if (selectedImage === image) {
      setSelectedImage(
        imageOptions.find(
          (candidate) => candidate !== image && !failedImages.has(candidate),
        ) ?? '',
      )
    }
  }

  async function handleAddToCart() {
    setIsAdding(true)
    setCartError('')
    setCartMessage('')

    try {
      await onAddToCart(product)
      setCartMessage('Added to cart.')
    } catch {
      setCartError('Could not add this product. Your cart was not changed.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card" aria-labelledby={titleId}>
      <div className="product-gallery">
        <div className="main-image">
          {selectedImage && !failedImages.has(selectedImage) ? (
            <img
              src={selectedImage}
              alt={product.title}
              onError={() => handleImageError(selectedImage)}
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>

        {availableImages.length > 0 && (
          <div className="thumbnail-strip" aria-label={`Images for ${product.title}`}>
            {imageOptions.map((image, index) =>
              failedImages.has(image) ? null : (
                <button
                  key={image}
                  type="button"
                  className={selectedImage === image ? 'selected' : ''}
                  aria-label={`Image ${index + 1} of ${imageOptions.length} for ${product.title}`}
                  aria-pressed={selectedImage === image}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => handleImageError(image)}
                  />
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <div className="product-card-body">
        <p className="product-brand">{product.brand || 'Brand not available'}</p>
        <h2 id={titleId}>{product.title}</h2>
        <p className="product-description">{product.description}</p>

        <div className="product-price-row">
          <strong>${product.price.toFixed(2)}</strong>
          <span>{product.discountPercentage.toFixed(1)}% off</span>
        </div>

        <button
          className="review-control"
          type="button"
          aria-label={`${product.title}: rated ${product.rating.toFixed(1)} out of 5, ${product.reviews?.length ?? 0} reviews`}
          onClick={() => onOpenReviews(product)}
        >
          <span aria-hidden="true">★</span>
          {product.rating.toFixed(1)}
          <span className="review-count">
            ({product.reviews?.length ?? 0} reviews)
          </span>
        </button>

        <p
          className={`cart-action-message${cartError ? ' error' : ''}`}
          role={cartError ? 'alert' : undefined}
          aria-live={cartError ? undefined : 'polite'}
        >
          {cartError || cartMessage}
        </p>
        <button
          className="add-cart-button"
          type="button"
          disabled={isAdding}
          onClick={() => void handleAddToCart()}
        >
          {isAdding && <span className="spinner" aria-hidden="true" />}
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

function ReviewModal({
  product,
  userId,
  onClose,
  onAppendReview,
}: {
  product: Product
  userId: number
  onClose: () => void
  onAppendReview: (productId: number, review: Review) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const requestController = useRef<AbortController | null>(null)
  const previousFocus = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog) {
      if (!dialog.open) {
        dialog.showModal()
      }
      closeButtonRef.current?.focus()
    }

    return () => {
      requestController.current?.abort()
      const elementToRestore = previousFocus.current
      queueMicrotask(() => elementToRestore?.focus())
    }
  }, [])

  function requestClose() {
    dialogRef.current?.close()
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()

    if (!body) {
      setCommentError('Enter a comment before submitting.')
      setSuccessMessage('')
      commentInputRef.current?.focus()
      return
    }

    const controller = new AbortController()
    requestController.current = controller
    setIsSubmitting(true)
    setCommentError('')
    setSuccessMessage('')

    try {
      const response = await fetch('https://dummyjson.com/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          postId: product.id,
          userId,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Comment request failed with status ${response.status}`)
      }

      onAppendReview(product.id, {
        reviewerName: 'You',
        rating: rating ? Number(rating) : undefined,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating('')
      setSuccessMessage('Your comment was added.')
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }
      setCommentError(
        'We could not add your comment. Your existing reviews are unchanged.',
      )
    } finally {
      if (!controller.signal.aborted) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose()
        }
      }}
    >
      <div className="review-dialog-panel">
        <header className="review-dialog-header">
          <div>
            <p className="eyebrow">{product.title}</p>
            <h2 id={titleId}>Reviews</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="dialog-close"
            type="button"
            aria-label="Close reviews"
            onClick={requestClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="reviews-content">
          {product.reviews.length === 0 ? (
            <p className="no-reviews">This product has no reviews yet.</p>
          ) : (
            <ul className="reviews-list">
              {product.reviews.map((review, index) => {
                const parsedDate = new Date(review.date)
                const hasValidDate = !Number.isNaN(parsedDate.getTime())

                return (
                  <li key={`${review.reviewerName}-${review.date}-${index}`}>
                    <div className="review-meta">
                      <strong>{review.reviewerName}</strong>
                      {review.rating !== undefined && (
                        <span
                          className="review-stars"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          <span aria-hidden="true">★</span>{' '}
                          {review.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p>{review.comment}</p>
                    {hasValidDate && (
                      <time dateTime={review.date}>
                        {parsedDate.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <form className="comment-form" onSubmit={handleAddComment} noValidate>
          <h3>Add a comment</h3>
          <label htmlFor={commentId}>Your comment</label>
          <textarea
            ref={commentInputRef}
            id={commentId}
            rows={3}
            value={comment}
            placeholder="Share your thoughts"
            aria-invalid={Boolean(commentError)}
            aria-describedby={commentError ? commentErrorId : undefined}
            disabled={isSubmitting}
            onChange={(event) => {
              setComment(event.target.value)
              if (commentError) {
                setCommentError('')
              }
              if (successMessage) {
                setSuccessMessage('')
              }
            }}
          />

          <div className="comment-form-footer">
            <div className="rating-field">
              <label htmlFor={`${commentId}-rating`}>Rating (optional)</label>
              <select
                id={`${commentId}-rating`}
                value={rating}
                disabled={isSubmitting}
                onChange={(event) => setRating(event.target.value)}
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
              {isSubmitting ? 'Adding…' : 'Add comment'}
            </button>
          </div>

          {commentError && (
            <p className="comment-error" id={commentErrorId} role="alert">
              {commentError}
            </p>
          )}
          <p className="comment-success" aria-live="polite">
            {successMessage}
          </p>
        </form>
      </div>
    </dialog>
  )
}

function AppShell({
  page,
  userId,
  cartItems,
  cartCount,
  onNavigate,
  onAddToCart,
  onChangeQuantity,
  onRemoveFromCart,
  onPlaceOrder,
}: {
  page: Page
  userId: number
  cartItems: CartItem[]
  cartCount: number
  onNavigate: (page: Page) => void
  onAddToCart: (product: Product) => Promise<void>
  onChangeQuantity: (productId: number, quantity: number) => void
  onRemoveFromCart: (productId: number) => void
  onPlaceOrder: () => void
}) {
  return (
    <div className="app-page">
      <header className="app-header">
        <div className="header-inner">
          <a
            className="brand-link"
            href="/products"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('products')
            }}
          >
            <Brand />
          </a>
          <nav aria-label="Main navigation">
            <a
              href="/products"
              aria-current={page === 'products' ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                onNavigate('products')
              }}
            >
              Products
            </a>
            <a
              className="cart-link"
              href="/cart"
              aria-current={page === 'cart' ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                onNavigate('cart')
              }}
            >
              <CartIcon />
              <span>Cart</span>
              <span
                className="cart-badge"
                aria-label={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}
              >
                {cartCount}
              </span>
            </a>
          </nav>
        </div>
      </header>
      {page === 'products' ? (
        <ProductsPage userId={userId} onAddToCart={onAddToCart} />
      ) : (
        <CartPage
          items={cartItems}
          cartCount={cartCount}
          onContinueShopping={() => onNavigate('products')}
          onChangeQuantity={onChangeQuantity}
          onRemove={onRemoveFromCart}
          onPlaceOrder={onPlaceOrder}
        />
      )}
    </div>
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
  const [nextSkip, setNextSkip] = useState(0)
  const [total, setTotal] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const searchController = useRef<AbortController | null>(null)
  const searchInputId = useId()

  const loadProducts = useCallback(async (skip: number, signal?: AbortSignal) => {
    const isFirstPage = skip === 0

    if (isFirstPage) {
      setIsInitialLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError('')

    try {
      const response = await fetch(
        `${PRODUCTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`,
        { signal },
      )

      if (!response.ok) {
        throw new Error(`Products request failed with status ${response.status}`)
      }

      const data: ProductsResponse = await response.json()

      if (!Array.isArray(data.products) || typeof data.total !== 'number') {
        throw new Error('Products response was malformed')
      }

      setProducts((current) =>
        isFirstPage ? data.products : [...current, ...data.products],
      )
      setTotal(data.total)
      setNextSkip(skip + PAGE_SIZE)
      setHasMore(
        data.products.length > 0 && skip + data.products.length < data.total,
      )
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }
      setError(
        isFirstPage
          ? 'We could not load products. Check your connection and try again.'
          : 'We could not load more products. Your loaded products are still available.',
      )
    } finally {
      if (!signal?.aborted) {
        setIsInitialLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  const searchProducts = useCallback(async (query: string) => {
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    setIsSearching(true)
    setSearchError('')

    try {
      const response = await fetch(
        `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      )

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`)
      }

      const data: ProductsResponse = await response.json()

      if (!Array.isArray(data.products)) {
        throw new Error('Search response was malformed')
      }

      setSearchResults(data.products)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }
      setSearchError(
        'We could not search products. Check your connection and try again.',
      )
      setSearchResults([])
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadProducts(0, controller.signal)
    return () => controller.abort()
  }, [loadProducts])

  useEffect(() => {
    return () => searchController.current?.abort()
  }, [])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()

    if (!query) {
      searchController.current?.abort()
      setSearchQuery('')
      setSearchResults([])
      setSearchError('')
      setIsSearching(false)
      return
    }

    setSearchQuery(query)
    void searchProducts(query)
  }

  function appendReview(productId: number, review: Review) {
    const addReview = (product: Product) =>
      product.id === productId
        ? { ...product, reviews: [...product.reviews, review] }
        : product

    setProducts((current) => current.map(addReview))
    setSearchResults((current) => current.map(addReview))
    setSelectedProduct((current) => (current ? addReview(current) : current))
  }

  const visibleProducts = searchQuery ? searchResults : products

  return (
    <main className="catalog-main">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>All Products</h1>
        </div>
        {!isInitialLoading && !isSearching && (
          <p className="showing-count" aria-live="polite">
            {searchQuery
              ? `${visibleProducts.length} ${visibleProducts.length === 1 ? 'result' : 'results'} for “${searchQuery}”`
              : `Showing ${products.length} of ${total} products`}
          </p>
        )}
      </div>

      <form className="search-form" role="search" onSubmit={handleSearch}>
        <label className="visually-hidden" htmlFor={searchInputId}>
          Search products
        </label>
        <div className="search-shell">
          <SearchIcon />
          <input
            id={searchInputId}
            type="search"
            value={searchInput}
            placeholder="Search products"
            autoComplete="off"
            onChange={(event) => {
              const value = event.target.value
              setSearchInput(value)

              if (!value.trim()) {
                searchController.current?.abort()
                setSearchQuery('')
                setSearchResults([])
                setSearchError('')
                setIsSearching(false)
              }
            }}
          />
          <button type="submit" disabled={isSearching}>
            Search
          </button>
        </div>
      </form>

      {isSearching ? (
        <div className="catalog-status" role="status">
          <span className="spinner spinner-dark" aria-hidden="true" />
          Searching products…
        </div>
      ) : searchQuery && searchError ? (
        <div className="catalog-empty">
          <h2>Search unavailable</h2>
          <p role="alert">{searchError}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void searchProducts(searchQuery)}
          >
            Try again
          </button>
        </div>
      ) : searchQuery && visibleProducts.length === 0 ? (
        <div className="catalog-empty">
          <h2>No matches found</h2>
          <p>Try another word or clear the search to return to the catalog.</p>
        </div>
      ) : !searchQuery && isInitialLoading ? (
        <div className="catalog-status" role="status">
          <span className="spinner spinner-dark" aria-hidden="true" />
          Loading products…
        </div>
      ) : !searchQuery && products.length === 0 ? (
        <div className="catalog-empty">
          <h2>{error ? 'Products unavailable' : 'No products found'}</h2>
          <p>
            {error ||
              'The catalog returned no products. Please check back later.'}
          </p>
          {error && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => void loadProducts(0)}
            >
              Try again
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className="product-grid"
            aria-label={searchQuery ? 'Product search results' : 'Loaded products'}
          >
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenReviews={setSelectedProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>

          {!searchQuery && error && (
            <div className="catalog-error" role="alert">
              {error}
            </div>
          )}

          {!searchQuery && (
            <div className="load-more-area">
              {hasMore ? (
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => void loadProducts(nextSkip)}
                >
                  {isLoadingMore && (
                    <span className="spinner spinner-dark" aria-hidden="true" />
                  )}
                  {isLoadingMore ? 'Loading more…' : 'Load more'}
                </button>
              ) : (
                <p className="end-message">
                  You’ve reached the end of the catalog.
                </p>
              )}
            </div>
          )}
        </>
      )}
      {selectedProduct && (
        <ReviewModal
          key={selectedProduct.id}
          product={selectedProduct}
          userId={userId}
          onClose={() => setSelectedProduct(null)}
          onAppendReview={appendReview}
        />
      )}
    </main>
  )
}

function CartProductImage({ product }: { product: Product }) {
  const image = product.thumbnail || product.images?.[0] || ''
  const [hasError, setHasError] = useState(false)

  return (
    <div className="cart-product-image">
      {image && !hasError ? (
        <img
          src={image}
          alt={product.title}
          onError={() => setHasError(true)}
        />
      ) : (
        <ImagePlaceholder />
      )}
    </div>
  )
}

function CartPage({
  items,
  cartCount,
  onContinueShopping,
  onChangeQuantity,
  onRemove,
  onPlaceOrder,
}: {
  items: CartItem[]
  cartCount: number
  onContinueShopping: () => void
  onChangeQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onPlaceOrder: () => void
}) {
  const [orderPlaced, setOrderPlaced] = useState(false)
  const confirmationRef = useRef<HTMLHeadingElement>(null)
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  useEffect(() => {
    if (orderPlaced) {
      confirmationRef.current?.focus()
    }
  }, [orderPlaced])

  function placeOrder() {
    if (items.length === 0) {
      return
    }
    onPlaceOrder()
    setOrderPlaced(true)
  }

  return (
    <main className="cart-main">
      {orderPlaced ? (
        <section className="order-confirmation" aria-labelledby="order-success">
          <span className="confirmation-mark" aria-hidden="true">
            ✓
          </span>
          <h1 id="order-success" ref={confirmationRef} tabIndex={-1}>
            Order placed successfully
          </h1>
          <p>Thank you for shopping with MyShop.</p>
          <button
            className="primary-button"
            type="button"
            onClick={onContinueShopping}
          >
            Continue Shopping
          </button>
        </section>
      ) : (
        <>
          <div className="cart-heading">
            <p className="eyebrow">MyShop</p>
            <h1>Your Cart ({cartCount})</h1>
          </div>

          {items.length === 0 ? (
            <section className="cart-empty" aria-labelledby="empty-cart-title">
              <h2 id="empty-cart-title">Your cart is empty</h2>
              <p>Add a product to see it here.</p>
              <button
                className="primary-button"
                type="button"
                onClick={onContinueShopping}
              >
                Continue Shopping
              </button>
            </section>
          ) : (
            <div className="cart-layout">
              <section className="cart-items-section" aria-label="Cart items">
                <ul className="cart-items">
                  {items.map((item) => {
                    const lineTotal = item.product.price * item.quantity

                    return (
                      <li key={item.product.id}>
                        <CartProductImage product={item.product} />
                        <div className="cart-item-details">
                          <h2>{item.product.title}</h2>
                          <p className="cart-unit-price">
                            ${item.product.price.toFixed(2)} each
                          </p>
                          <button
                            className="remove-button"
                            type="button"
                            onClick={() => onRemove(item.product.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div
                          className="quantity-stepper"
                          role="group"
                          aria-label={`Quantity for ${item.product.title}`}
                        >
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.product.title}`}
                            disabled={item.quantity === 1}
                            onClick={() =>
                              onChangeQuantity(
                                item.product.id,
                                item.quantity - 1,
                              )
                            }
                          >
                            <span aria-hidden="true">−</span>
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.product.title}`}
                            onClick={() =>
                              onChangeQuantity(
                                item.product.id,
                                item.quantity + 1,
                              )
                            }
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                        <div className="line-total">
                          <span>Line total</span>
                          <strong>${lineTotal.toFixed(2)}</strong>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <button
                  className="continue-button"
                  type="button"
                  onClick={onContinueShopping}
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
                <button
                  className="place-order-button"
                  type="button"
                  onClick={placeOrder}
                >
                  Place Order
                </button>
              </aside>
            </div>
          )}
        </>
      )}
    </main>
  )
}

function AuthenticatedApp({ session }: { session: Session }) {
  const [page, setPage] = useState<Page>(pageFromPath)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const cartCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0,
  )

  useEffect(() => {
    const handlePopState = () => setPage(pageFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.title =
      page === 'products' ? 'Products | MyShop' : 'Cart | MyShop'
  }, [page])

  function navigate(nextPage: Page) {
    if (nextPage === page) {
      return
    }
    window.history.pushState(null, '', `/${nextPage}`)
    setPage(nextPage)
    window.scrollTo({ top: 0 })
  }

  async function addToCart(product: Product) {
    const response = await fetch(CARTS_URL, {
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
      const existingItem = current.find(
        (item) => item.product.id === product.id,
      )

      if (existingItem) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...current, { product, quantity: 1 }]
    })
  }

  function changeQuantity(productId: number, quantity: number) {
    if (quantity < 1) {
      return
    }
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    )
  }

  function removeFromCart(productId: number) {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId),
    )
  }

  return (
    <AppShell
      page={page}
      userId={session.id}
      cartItems={cartItems}
      cartCount={cartCount}
      onNavigate={navigate}
      onAddToCart={addToCart}
      onChangeQuantity={changeQuantity}
      onRemoveFromCart={removeFromCart}
      onPlaceOrder={() => setCartItems([])}
    />
  )
}

function LoginPage({
  onLogin,
}: {
  onLogin: (session: Session) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const usernameInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  useEffect(() => {
    document.title = 'Login | MyShop'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: FieldErrors = {}
    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      errors.username = 'Enter your username.'
    }

    if (!password) {
      errors.password = 'Enter your password.'
    }

    setFieldErrors(errors)
    setFormError('')

    if (errors.username || errors.password) {
      if (errors.username) {
        usernameInput.current?.focus()
      } else {
        passwordInput.current?.focus()
      }
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          expiresInMins: 60,
        }),
      })

      if (!response.ok) {
        let message = ''

        try {
          const body: unknown = await response.json()
          if (
            typeof body === 'object' &&
            body !== null &&
            'message' in body &&
            typeof body.message === 'string'
          ) {
            message = body.message
          }
        } catch {
          // Fall through to the status-based error below.
        }

        if (response.status === 400 && message === 'Invalid credentials') {
          setFormError('The username or password you entered is incorrect.')
        } else {
          setFormError('We could not sign you in. Please try again.')
        }
        return
      }

      const login: LoginResponse = await response.json()

      if (typeof login.id !== 'number' || typeof login.accessToken !== 'string') {
        throw new Error('The login response did not contain a valid session.')
      }

      const nextSession = { id: login.id, accessToken: login.accessToken }
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      } catch {
        // React state still retains the authenticated session for this page.
      }
      window.history.replaceState(null, '', '/products')
      onLogin(nextSession)
    } catch {
      setFormError(
        'We could not connect to MyShop. Check your connection and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <Brand />

        <div className="login-heading">
          <h1 id="login-heading">Welcome Back</h1>
          <p>Log in to continue shopping with MyShop.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div
              className="form-error"
              id={formErrorId}
              role="alert"
              tabIndex={-1}
            >
              {formError}
            </div>
          )}

          <div className="field">
            <label htmlFor="username">Username</label>
            <div
              className={`input-shell${fieldErrors.username ? ' input-shell-error' : ''}`}
            >
              <span className="input-icon">
                <UserIcon />
              </span>
              <input
                ref={usernameInput}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? usernameErrorId : undefined
                }
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({
                      ...current,
                      username: undefined,
                    }))
                  }
                }}
                disabled={isLoading}
              />
            </div>
            {fieldErrors.username && (
              <p className="field-error" id={usernameErrorId}>
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div
              className={`input-shell${fieldErrors.password ? ' input-shell-error' : ''}`}
            >
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                ref={passwordInput}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? passwordErrorId : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }))
                  }
                }}
                disabled={isLoading}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={isLoading}
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

          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading && <span className="spinner" aria-hidden="true" />}
            {isLoading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)

  return session ? (
    <AuthenticatedApp session={session} />
  ) : (
    <LoginPage onLogin={setSession} />
  )
}
