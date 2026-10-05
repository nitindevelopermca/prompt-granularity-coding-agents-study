import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const PRODUCTS_URL = 'https://dummyjson.com/products'
const COMMENTS_URL = 'https://dummyjson.com/comments/add'
const CARTS_URL = 'https://dummyjson.com/carts/add'
const PRODUCTS_LIMIT = 10
const SESSION_KEY = 'myshop-session'

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

type AppRoute = '/products' | '/cart'

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
  images?: string[]
  reviews?: Review[]
}

type ProductsResponse = {
  products: Product[]
  total: number
}

type CartItem = {
  product: Product
  quantity: number
}

async function fetchProductPage(skip: number, signal?: AbortSignal) {
  const response = await fetch(
    `${PRODUCTS_URL}?limit=${PRODUCTS_LIMIT}&skip=${skip}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error('Products request failed')
  }

  const data = (await response.json()) as Partial<ProductsResponse>
  if (!Array.isArray(data.products) || typeof data.total !== 'number') {
    throw new Error('Products response was invalid')
  }

  return data as ProductsResponse
}

async function searchProducts(query: string, signal: AbortSignal) {
  const response = await fetch(
    `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error('Product search failed')
  }

  const data = (await response.json()) as Partial<ProductsResponse>
  if (!Array.isArray(data.products)) {
    throw new Error('Product search response was invalid')
  }

  return data.products
}

function readSession(): Session | null {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY)
    if (!storedSession) return null

    const session = JSON.parse(storedSession) as Partial<Session>
    if (typeof session.id === 'number' && typeof session.accessToken === 'string') {
      return { id: session.id, accessToken: session.accessToken }
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }

  return null
}

function BagIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12.5 15.5h23l2.2 27h-27.4l2.2-27Z" />
      <path d="M18 18v-7a6 6 0 0 1 12 0v7" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
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
      <path d="M3 4h2l2 11h10.5l2-7H6" />
      <circle cx="9" cy="19" r="1.25" />
      <circle cx="17" cy="19" r="1.25" />
    </svg>
  )
}

function ProductCard({
  product,
  onOpenReviews,
  onAddToCart,
}: {
  product: Product
  onOpenReviews: (product: Product, trigger: HTMLButtonElement) => void
  onAddToCart: (product: Product) => Promise<void>
}) {
  const galleryImages = product.images?.filter(Boolean) ?? []
  const reviewCount = product.reviews?.length ?? 0
  const initialImage = product.thumbnail || galleryImages[0] || ''
  const thumbnails = galleryImages.length > 0
    ? galleryImages
    : initialImage
      ? [initialImage]
      : []
  const [selectedImage, setSelectedImage] = useState(initialImage)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set())
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const imageIsAvailable =
    Boolean(selectedImage) && !brokenImages.has(selectedImage)

  function markImageAsBroken(image: string) {
    setBrokenImages((current) => {
      const next = new Set(current)
      next.add(image)
      return next
    })
  }

  async function handleAddToCart() {
    setIsAddingToCart(true)
    setCartError('')
    setCartMessage('')

    try {
      await onAddToCart(product)
      setCartMessage('Added to cart.')
    } catch {
      setCartError('Could not add this product. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-gallery">
        <div className="main-image-frame">
          {imageIsAvailable ? (
            <img
              src={selectedImage}
              alt={product.title}
              loading="lazy"
              onError={() => markImageAsBroken(selectedImage)}
            />
          ) : (
            <div
              className="image-fallback"
              role="img"
              aria-label={`No image available for ${product.title}`}
            >
              Image unavailable
            </div>
          )}
        </div>

        {thumbnails.length > 0 && (
          <div
            className="thumbnail-strip"
            role="group"
            aria-label={`${product.title} image gallery`}
          >
            {thumbnails.map((image, index) => {
              const isBroken = brokenImages.has(image)
              return (
                <button
                  className="thumbnail-button"
                  type="button"
                  key={`${image}-${index}`}
                  aria-label={
                    isBroken
                      ? `Image ${index + 1} of ${thumbnails.length} unavailable`
                      : `Image ${index + 1} of ${thumbnails.length}`
                  }
                  aria-pressed={selectedImage === image && !isBroken}
                  disabled={isBroken}
                  onClick={() => setSelectedImage(image)}
                >
                  {isBroken ? (
                    <span aria-hidden="true">!</span>
                  ) : (
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      onError={() => markImageAsBroken(image)}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="product-card-body">
        <h2>{product.title}</h2>
        <p className="product-description">{product.description}</p>

        <div className="product-price-row">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <span className="discount-badge">
            {product.discountPercentage.toFixed(0)}% off
          </span>
        </div>

        <button
          className="review-control"
          type="button"
          aria-label={`${product.rating.toFixed(1)} out of 5 stars, ${reviewCount} reviews for ${product.title}`}
          onClick={(event) => onOpenReviews(product, event.currentTarget)}
        >
          <span className="rating-star" aria-hidden="true">
            ★
          </span>
          <span>{product.rating.toFixed(1)}</span>
          <span className="review-count">({reviewCount} reviews)</span>
        </button>

        <p className="product-brand">
          Brand: <span>{product.brand || 'Not available'}</span>
        </p>
      </div>

      <button
        className="add-to-cart-button"
        type="button"
        disabled={isAddingToCart}
        onClick={() => void handleAddToCart()}
      >
        <CartIcon />
        {isAddingToCart ? 'Adding…' : 'Add to Cart'}
      </button>
      <div className="cart-feedback" aria-live="polite">
        {cartError ? (
          <p className="cart-add-error" role="alert">
            {cartError}
          </p>
        ) : (
          cartMessage && <p className="cart-add-success">{cartMessage}</p>
        )}
      </div>
    </article>
  )
}

function formatReviewDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function ReviewModal({
  product,
  userId,
  onClose,
  onCommentAdded,
}: {
  product: Product
  userId: number
  onClose: () => void
  onCommentAdded: (productId: number, review: Review) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const reviews = product.reviews ?? []

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousOverflow = document.body.style.overflow
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      dialog.removeEventListener('close', handleClose)
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [])

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()

    if (!body) {
      setCommentError('Enter a comment before submitting.')
      return
    }

    setCommentError('')
    setIsSubmitting(true)

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

      if (!response.ok) {
        throw new Error('Comment request failed')
      }

      const selectedRating = rating ? Number(rating) : undefined
      onCommentAdded(product.id, {
        reviewerName: 'You',
        comment: body,
        date: new Date().toISOString(),
        ...(selectedRating ? { rating: selectedRating } : {}),
      })
      setComment('')
      setRating('')
    } catch {
      setCommentError(
        'We could not add your comment. Existing reviews were not changed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      className="review-dialog"
      ref={dialogRef}
      aria-labelledby={`reviews-title-${product.id}`}
    >
      <div className="review-dialog-header">
        <div>
          <h2 id={`reviews-title-${product.id}`}>Reviews</h2>
          <p>{product.title}</p>
        </div>
        <button
          className="dialog-close"
          type="button"
          ref={closeButtonRef}
          aria-label="Close reviews"
          onClick={() => dialogRef.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="review-dialog-summary">
        <strong>{product.rating.toFixed(1)}</strong>
        <span>
          <span className="summary-stars" aria-hidden="true">
            ★★★★★
          </span>
          <span className="visually-hidden">
            {product.rating.toFixed(1)} out of 5 stars
          </span>
        </span>
        <span>
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="empty-reviews">This product does not have any reviews yet.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((review, index) => (
            <li key={`${review.reviewerName}-${review.date}-${index}`}>
              <article className="review-item">
                <div className="review-item-heading">
                  <h3>{review.reviewerName}</h3>
                  <time dateTime={review.date}>
                    {formatReviewDate(review.date)}
                  </time>
                </div>
                {typeof review.rating === 'number' && (
                  <p className="review-rating">
                    <span aria-hidden="true">★</span>
                    {review.rating.toFixed(1)} out of 5
                  </p>
                )}
                <p className="review-comment">{review.comment}</p>
              </article>
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" noValidate onSubmit={handleCommentSubmit}>
        <h3>Add a comment</h3>
        <div className="comment-fields">
          <div className="comment-text-field">
            <label htmlFor={`comment-${product.id}`}>Your comment</label>
            <textarea
              id={`comment-${product.id}`}
              value={comment}
              placeholder="Write your comment"
              rows={3}
              disabled={isSubmitting}
              aria-invalid={Boolean(commentError)}
              aria-describedby={
                commentError ? `comment-error-${product.id}` : undefined
              }
              onChange={(event) => {
                setComment(event.target.value)
                if (commentError) setCommentError('')
              }}
            />
          </div>
          <div className="comment-rating-field">
            <label htmlFor={`comment-rating-${product.id}`}>
              Rating <span>(optional)</span>
            </label>
            <select
              id={`comment-rating-${product.id}`}
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
        </div>

        {commentError && (
          <p
            className="comment-error"
            id={`comment-error-${product.id}`}
            role="alert"
          >
            {commentError}
          </p>
        )}

        <button
          className="submit-comment-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting…' : 'Submit comment'}
        </button>
      </form>
    </dialog>
  )
}

function ProductGrid({
  products,
  onOpenReviews,
  onAddToCart,
}: {
  products: Product[]
  onOpenReviews: (product: Product, trigger: HTMLButtonElement) => void
  onAddToCart: (product: Product) => Promise<void>
}) {
  return (
    <ul className="product-list">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            onOpenReviews={onOpenReviews}
            onAddToCart={onAddToCart}
          />
        </li>
      ))}
    </ul>
  )
}

function ProductsCatalog({
  userId,
  onAddToCart,
}: {
  userId: number
  onAddToCart: (product: Product) => Promise<void>
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [nextSkip, setNextSkip] = useState(PRODUCTS_LIMIT)
  const [hasMore, setHasMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null)
  const searchController = useRef<AbortController | null>(null)
  const reviewTrigger = useRef<HTMLButtonElement | null>(null)

  async function loadInitialProducts(signal?: AbortSignal) {
    setIsInitialLoading(true)
    setError('')

    try {
      const data = await fetchProductPage(0, signal)
      setProducts(data.products)
      setTotal(data.total)
      setNextSkip(PRODUCTS_LIMIT)
      setHasMore(
        data.products.length > 0 && data.products.length < data.total,
      )
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }
      setError('We could not load products. Please try again.')
    } finally {
      if (!signal?.aborted) setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadInitialProducts(controller.signal)
    return () => {
      controller.abort()
      searchController.current?.abort()
    }
  }, [])

  async function loadMoreProducts() {
    setIsLoadingMore(true)
    setError('')

    try {
      const data = await fetchProductPage(nextSkip)
      const loadedThrough = nextSkip + data.products.length

      setProducts((current) => [...current, ...data.products])
      setTotal(data.total)
      setHasMore(data.products.length > 0 && loadedThrough < data.total)
      setNextSkip((current) => current + PRODUCTS_LIMIT)
    } catch {
      setError(
        'We could not load more products. Your loaded products are still available.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  function clearSearch() {
    searchController.current?.abort()
    searchController.current = null
    setActiveQuery('')
    setSearchResults([])
    setSearchError('')
    setIsSearching(false)
  }

  async function performSearch(query: string) {
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    setActiveQuery(query)
    setSearchResults([])
    setSearchError('')
    setIsSearching(true)

    try {
      const matches = await searchProducts(query, controller.signal)
      setSearchResults(matches)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }
      setSearchError('We could not search products. Please try again.')
    } finally {
      if (!controller.signal.aborted) setIsSearching(false)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchInput.trim()

    if (!query) {
      clearSearch()
      return
    }

    void performSearch(query)
  }

  const isSearchMode = Boolean(activeQuery)

  function openReviews(product: Product, trigger: HTMLButtonElement) {
    reviewTrigger.current = trigger
    setReviewProduct(product)
  }

  function closeReviews() {
    setReviewProduct(null)
    window.requestAnimationFrame(() => reviewTrigger.current?.focus())
  }

  function appendComment(productId: number, review: Review) {
    const appendReview = (product: Product) =>
      product.id === productId
        ? { ...product, reviews: [...(product.reviews ?? []), review] }
        : product

    setProducts((current) => current.map(appendReview))
    setSearchResults((current) => current.map(appendReview))
    setReviewProduct((current) => (current ? appendReview(current) : current))
  }

  return (
    <main className="app-content catalog-content">
      <div className="catalog-toolbar">
        <div className="catalog-heading">
          <h1>All Products</h1>
          {isSearchMode ? (
            !isSearching &&
            !searchError && (
              <p aria-live="polite">
                Showing {searchResults.length}{' '}
                {searchResults.length === 1 ? 'result' : 'results'} for “
                {activeQuery}”
              </p>
            )
          ) : (
            !isInitialLoading &&
            (products.length > 0 || !error) && (
              <p aria-live="polite">
                Showing {products.length} of {total} products
              </p>
            )
          )}
        </div>

        <form
          className="product-search"
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <label htmlFor="product-search">Search products</label>
          <div className="search-input-row">
            <input
              id="product-search"
              type="search"
              placeholder="Search products"
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value
                setSearchInput(value)
                if (!value.trim()) clearSearch()
              }}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {isSearchMode ? (
        isSearching ? (
          <div className="catalog-status" role="status">
            <span className="catalog-spinner" aria-hidden="true" />
            Searching products…
          </div>
        ) : searchError ? (
          <div className="catalog-error" role="alert">
            <p>{searchError}</p>
            <button
              type="button"
              onClick={() => void performSearch(activeQuery)}
            >
              Try again
            </button>
          </div>
        ) : searchResults.length === 0 ? (
          <p className="empty-products" role="status">
            No products match “{activeQuery}”.
          </p>
        ) : (
          <ProductGrid
            products={searchResults}
            onOpenReviews={openReviews}
            onAddToCart={onAddToCart}
          />
        )
      ) : isInitialLoading ? (
        <div className="catalog-status" role="status">
          <span className="catalog-spinner" aria-hidden="true" />
          Loading products…
        </div>
      ) : (
        <>
          {error && (
            <div className="catalog-error" role="alert">
              <p>{error}</p>
              {products.length === 0 && (
                <button type="button" onClick={() => void loadInitialProducts()}>
                  Try again
                </button>
              )}
            </div>
          )}

          {products.length === 0 && !error ? (
            <p className="empty-products" role="status">
              No products are available right now.
            </p>
          ) : (
            <ProductGrid
              products={products}
              onOpenReviews={openReviews}
              onAddToCart={onAddToCart}
            />
          )}

          {products.length > 0 && hasMore && (
            <div className="load-more-row">
              <button
                className="load-more-button"
                type="button"
                disabled={isLoadingMore}
                onClick={() => void loadMoreProducts()}
              >
                {isLoadingMore ? 'Loading more…' : 'Load more'}
              </button>
            </div>
          )}

          {products.length > 0 && !hasMore && (
            <p className="end-of-list" role="status">
              You’ve reached the end of the catalog.
            </p>
          )}
        </>
      )}

      {reviewProduct && (
        <ReviewModal
          product={reviewProduct}
          userId={userId}
          onClose={closeReviews}
          onCommentAdded={appendComment}
        />
      )}
    </main>
  )
}

function CartProductImage({ product }: { product: Product }) {
  const source = product.thumbnail || product.images?.[0] || ''
  const [isBroken, setIsBroken] = useState(false)

  if (!source || isBroken) {
    return (
      <div
        className="cart-image-fallback"
        role="img"
        aria-label={`No image available for ${product.title}`}
      >
        No image
      </div>
    )
  }

  return (
    <img
      className="cart-product-image"
      src={source}
      alt=""
      onError={() => setIsBroken(true)}
    />
  )
}

function CartScreen({
  items,
  count,
  orderPlaced,
  onChangeQuantity,
  onRemove,
  onContinueShopping,
  onPlaceOrder,
}: {
  items: CartItem[]
  count: number
  orderPlaced: boolean
  onChangeQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onContinueShopping: () => void
  onPlaceOrder: () => void
}) {
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  useEffect(() => {
    if (orderPlaced) successHeadingRef.current?.focus()
  }, [orderPlaced])

  return (
    <main className="app-content cart-content">
      <h1>Your Cart ({count})</h1>

      {orderPlaced ? (
        <section className="order-success" role="status" aria-live="polite">
          <div className="success-mark" aria-hidden="true">
            ✓
          </div>
          <h2 ref={successHeadingRef} tabIndex={-1}>
            Order placed successfully
          </h2>
          <p>Thank you for your order. Your cart is now empty.</p>
          <button
            className="continue-shopping"
            type="button"
            onClick={onContinueShopping}
          >
            Continue Shopping
          </button>
        </section>
      ) : (
        <div className="cart-layout">
        <section className="cart-items-panel" aria-labelledby="cart-items-title">
          <h2 className="visually-hidden" id="cart-items-title">
            Cart items
          </h2>

          {items.length === 0 ? (
            <p className="empty-cart">Your cart is currently empty.</p>
          ) : (
            <div className="cart-table-wrapper">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Price</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ product, quantity }) => (
                    <tr key={product.id}>
                      <td data-label="Product">
                        <div className="cart-product">
                          <CartProductImage product={product} />
                          <strong>{product.title}</strong>
                        </div>
                      </td>
                      <td data-label="Price">${product.price.toFixed(2)}</td>
                      <td data-label="Quantity">
                        <div className="quantity-cell">
                          <div
                            className="quantity-stepper"
                            aria-label={`Quantity for ${product.title}`}
                          >
                            <button
                              type="button"
                              aria-label={`Decrease ${product.title} quantity`}
                              disabled={quantity === 1}
                              onClick={() =>
                                onChangeQuantity(product.id, quantity - 1)
                              }
                            >
                              −
                            </button>
                            <output aria-live="polite">{quantity}</output>
                            <button
                              type="button"
                              aria-label={`Increase ${product.title} quantity`}
                              onClick={() =>
                                onChangeQuantity(product.id, quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="remove-item"
                            type="button"
                            aria-label={`Remove ${product.title} from cart`}
                            onClick={() => onRemove(product.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                      <td className="line-total" data-label="Total">
                        ${(product.price * quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            className="continue-shopping"
            type="button"
            onClick={onContinueShopping}
          >
            <span aria-hidden="true">←</span> Continue Shopping
          </button>
        </section>

        <aside className="order-summary" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Order Summary</h2>
          <dl>
            <div>
              <dt>Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
              <dd>${subtotal.toFixed(2)}</dd>
            </div>
            <div className="order-total">
              <dt>Total</dt>
              <dd>${subtotal.toFixed(2)}</dd>
            </div>
          </dl>
          <button
            className="place-order-button"
            type="button"
            disabled={items.length === 0}
            onClick={onPlaceOrder}
          >
            Place Order
          </button>
        </aside>
        </div>
      )}
    </main>
  )
}

function AppShell({
  route,
  userId,
  onNavigate,
}: {
  route: AppRoute
  userId: number
  onNavigate: (route: AppRoute) => void
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const cartCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0,
  )

  async function addToCart(product: Product) {
    const response = await fetch(CARTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })

    if (!response.ok) {
      throw new Error('Add to cart request failed')
    }

    setOrderPlaced(false)
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

  function changeCartQuantity(productId: number, quantity: number) {
    if (quantity < 1) return
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    )
  }

  function removeCartItem(productId: number) {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId),
    )
  }

  function placeOrder() {
    if (cartItems.length === 0) return
    setCartItems([])
    setOrderPlaced(true)
  }

  function continueShopping() {
    setOrderPlaced(false)
    onNavigate('/products')
  }

  function navigationProps(destination: AppRoute) {
    return {
      href: destination,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault()
        onNavigate(destination)
      },
    }
  }

  return (
    <div className="authenticated-app">
      <header className="app-header">
        <a className="app-brand" {...navigationProps('/products')}>
          <span className="app-brand-mark">
            <BagIcon />
          </span>
          <span>MyShop</span>
        </a>

        <nav className="app-nav" aria-label="Main navigation">
          <a
            {...navigationProps('/products')}
            aria-current={route === '/products' ? 'page' : undefined}
          >
            Products
          </a>
          <a
            {...navigationProps('/cart')}
            aria-current={route === '/cart' ? 'page' : undefined}
          >
            Cart
          </a>
        </nav>

        <a
          className="cart-link"
          {...navigationProps('/cart')}
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          aria-current={route === '/cart' ? 'page' : undefined}
        >
          <CartIcon />
          <span className="cart-badge" aria-live="polite">
            {cartCount}
          </span>
        </a>
      </header>

      {route === '/products' ? (
        <ProductsCatalog userId={userId} onAddToCart={addToCart} />
      ) : (
        <CartScreen
          items={cartItems}
          count={cartCount}
          orderPlaced={orderPlaced}
          onChangeQuantity={changeCartQuantity}
          onRemove={removeCartItem}
          onContinueShopping={continueShopping}
          onPlaceOrder={placeOrder}
        />
      )}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [route, setRoute] = useState<AppRoute>(
    window.location.pathname === '/cart' ? '/cart' : '/products',
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    function handlePopState() {
      setRoute(window.location.pathname === '/cart' ? '/cart' : '/products')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.title = session
      ? `${route === '/cart' ? 'Cart' : 'Products'} | MyShop`
      : 'Login | MyShop'
  }, [route, session])

  function navigate(destination: AppRoute) {
    if (window.location.pathname !== destination) {
      window.history.pushState({}, '', destination)
    }
    setRoute(destination)
  }

  if (session) {
    return <AppShell route={route} userId={session.id} onNavigate={navigate} />
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

      const data = (await response.json()) as Partial<LoginResponse> & {
        message?: string
      }

      if (!response.ok) {
        if (response.status === 400 && data.message === 'Invalid credentials') {
          setFormError('Invalid username or password. Please try again.')
        } else {
          setFormError('We could not sign you in. Please try again.')
        }
        return
      }

      if (typeof data.id !== 'number' || typeof data.accessToken !== 'string') {
        setFormError('We could not start your session. Please try again.')
        return
      }

      const nextSession: LoginResponse = {
        id: data.id,
        accessToken: data.accessToken,
        ...(typeof data.refreshToken === 'string'
          ? { refreshToken: data.refreshToken }
          : {}),
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      window.history.pushState({}, '', '/products')
      setRoute('/products')
      setSession(nextSession)
    } catch {
      setFormError('Unable to connect. Check your network and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <div className="brand-mark">
            <BagIcon />
          </div>
          <p className="brand-name">MyShop</p>
          <h1 id="login-title">Welcome Back</h1>
          <p className="login-intro">Please login to your account</p>
        </header>

        <form noValidate onSubmit={handleSubmit}>
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
              <span className="field-icon">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? 'username-error' : undefined
                }
                disabled={isLoading}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({
                      ...current,
                      username: undefined,
                    }))
                  }
                }}
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
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                disabled={isLoading}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }))
                  }
                }}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
                onClick={() => setShowPassword((current) => !current)}
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
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Signing in…
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
