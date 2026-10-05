import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'

const LOGIN_URL = 'https://dummyjson.com/auth/login'
const PRODUCTS_URL = 'https://dummyjson.com/products'
const ADD_COMMENT_URL = 'https://dummyjson.com/comments/add'
const ADD_CART_URL = 'https://dummyjson.com/carts/add'
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

type Destination = 'products' | 'cart'

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
  brand?: string
  discountPercentage?: number
  rating?: number
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

function readSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const session: unknown = JSON.parse(stored)
    if (
      typeof session === 'object' &&
      session !== null &&
      typeof (session as Session).id === 'number' &&
      typeof (session as Session).accessToken === 'string'
    ) {
      return session as Session
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }

  return null
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path d="M11 16h26l2 27H9l2-27Z" />
      <path d="M17 19v-6a7 7 0 0 1 14 0v6" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="9.5" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) return false
  const product = value as Partial<Product>
  return (
    typeof product.id === 'number' &&
    typeof product.title === 'string' &&
    typeof product.description === 'string' &&
    typeof product.price === 'number'
  )
}

function isReview(value: unknown): value is Review {
  if (typeof value !== 'object' || value === null) return false
  const review = value as Partial<Review>
  return (
    typeof review.reviewerName === 'string' &&
    (review.rating === undefined || typeof review.rating === 'number') &&
    typeof review.comment === 'string' &&
    typeof review.date === 'string'
  )
}

async function fetchProductsPage(
  skip: number,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const response = await fetch(
    `${PRODUCTS_URL}?limit=${PAGE_SIZE}&skip=${skip}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`Products request failed with status ${response.status}`)
  }

  const data: unknown = await response.json()
  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray((data as { products?: unknown }).products) ||
    typeof (data as { total?: unknown }).total !== 'number'
  ) {
    throw new Error('Products response was incomplete')
  }

  return {
    products: (data as { products: unknown[] }).products.filter(isProduct),
    total: (data as { total: number }).total,
  }
}

async function searchProducts(
  query: string,
  signal: AbortSignal,
): Promise<ProductsResponse> {
  const response = await fetch(
    `${PRODUCTS_URL}/search?q=${encodeURIComponent(query)}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`)
  }

  const data: unknown = await response.json()
  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray((data as { products?: unknown }).products) ||
    typeof (data as { total?: unknown }).total !== 'number'
  ) {
    throw new Error('Search response was incomplete')
  }

  return {
    products: (data as { products: unknown[] }).products.filter(isProduct),
    total: (data as { total: number }).total,
  }
}

function ReviewModal({
  product,
  userId,
  onCommentAdded,
  onClose,
}: {
  product: Product
  userId: number
  onCommentAdded: (review: Review) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const commentController = useRef<AbortController | null>(null)
  const [comment, setComment] = useState('')
  const [commentRating, setCommentRating] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentSuccess, setCommentSuccess] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const reviews = Array.isArray(product.reviews)
    ? product.reviews.filter(isReview)
    : []

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    closeButtonRef.current?.focus()

    return () => {
      commentController.current?.abort()
      if (dialog.open) dialog.close()
    }
  }, [])

  const formatDate = (date: string) => {
    const parsedDate = new Date(date)
    return Number.isNaN(parsedDate.getTime())
      ? date
      : new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(parsedDate)
  }

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment before submitting.')
      setCommentSuccess('')
      commentRef.current?.focus()
      return
    }

    const controller = new AbortController()
    commentController.current?.abort()
    commentController.current = controller
    setCommentError('')
    setCommentSuccess('')
    setIsSubmittingComment(true)

    try {
      const response = await fetch(ADD_COMMENT_URL, {
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

      const rating = commentRating ? Number(commentRating) : undefined
      onCommentAdded({
        reviewerName: 'You',
        comment: body,
        date: new Date().toISOString(),
        rating,
      })
      setComment('')
      setCommentRating('')
      setCommentSuccess('Your comment was added.')
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        return
      }
      setCommentError(
        'Unable to add your comment. Existing reviews were not changed.',
      )
    } finally {
      if (!controller.signal.aborted) setIsSubmittingComment(false)
    }
  }

  return (
    <dialog
      className="review-dialog"
      ref={dialogRef}
      aria-labelledby="review-dialog-title"
      onClose={onClose}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="review-dialog-content">
        <header className="review-dialog-header">
          <div>
            <p>{product.title}</p>
            <h2 id="review-dialog-title">Reviews ({reviews.length})</h2>
          </div>
          <button
            className="dialog-close-button"
            ref={closeButtonRef}
            type="button"
            aria-label="Close reviews"
            onClick={() => dialogRef.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="review-dialog-body">
          <form className="comment-form" noValidate onSubmit={handleCommentSubmit}>
            <h3>Add a comment</h3>
            <div className="comment-fields">
              <div>
                <label htmlFor="comment-rating">Rating (optional)</label>
                <select
                  id="comment-rating"
                  value={commentRating}
                  disabled={isSubmittingComment}
                  onChange={(event) => setCommentRating(event.target.value)}
                >
                  <option value="">No rating</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>
              <div className="comment-input">
                <label htmlFor="comment-body">Your comment</label>
                <textarea
                  id="comment-body"
                  ref={commentRef}
                  rows={3}
                  placeholder="Write your comment"
                  value={comment}
                  disabled={isSubmittingComment}
                  aria-invalid={Boolean(commentError)}
                  aria-describedby={
                    commentError ? 'comment-error' : undefined
                  }
                  onChange={(event) => {
                    setComment(event.target.value)
                    if (commentError) setCommentError('')
                    if (commentSuccess) setCommentSuccess('')
                  }}
                />
              </div>
            </div>
            {commentError && (
              <p className="comment-message is-error" id="comment-error" role="alert">
                {commentError}
              </p>
            )}
            {commentSuccess && (
              <p className="comment-message is-success" role="status">
                {commentSuccess}
              </p>
            )}
            <button
              className="submit-comment-button"
              type="submit"
              disabled={isSubmittingComment}
            >
              {isSubmittingComment && (
                <span className="spinner" aria-hidden="true" />
              )}
              {isSubmittingComment ? 'Submitting…' : 'Submit comment'}
            </button>
          </form>

          {reviews.length === 0 ? (
            <p className="empty-reviews">This product has no reviews yet.</p>
          ) : (
            <ul className="review-list">
              {reviews.map((review, index) => {
                const starCount =
                  typeof review.rating === 'number'
                    ? Math.max(0, Math.min(5, Math.round(review.rating)))
                    : 0
                return (
                  <li key={`${review.reviewerName}-${review.date}-${index}`}>
                    <article className="review">
                      <div className="review-heading">
                        <h3>{review.reviewerName}</h3>
                        <time dateTime={review.date}>
                          {formatDate(review.date)}
                        </time>
                      </div>
                      {typeof review.rating === 'number' && (
                        <p
                          className="review-rating"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          <span aria-hidden="true">
                            {'★'.repeat(starCount)}
                            {'☆'.repeat(5 - starCount)}
                          </span>
                        </p>
                      )}
                      <p className="review-comment">{review.comment}</p>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
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
  const galleryImages = (product.images ?? []).filter(
    (image): image is string => typeof image === 'string' && image.length > 0,
  )
  const initialImage =
    (typeof product.thumbnail === 'string' && product.thumbnail) ||
    galleryImages[0] ||
    null
  const [mainImage, setMainImage] = useState<string | null>(initialImage)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set())
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const reviewCount = product.reviews?.length ?? 0
  const rating =
    typeof product.rating === 'number' ? product.rating.toFixed(1) : 'Not rated'

  const handleBrokenImage = (image: string) => {
    setBrokenImages((current) => {
      const next = new Set(current)
      next.add(image)
      return next
    })

    if (mainImage === image) {
      const fallback =
        galleryImages.find(
          (candidate) =>
            candidate !== image && !brokenImages.has(candidate),
        ) ?? null
      setMainImage(fallback)
    }
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    setCartError('')
    setCartMessage('')
    try {
      await onAddToCart(product)
      setCartMessage(`${product.title} was added to your cart.`)
    } catch {
      setCartError(
        `Unable to add ${product.title} to your cart. Please try again.`,
      )
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <article className="product-card" aria-labelledby={`product-${product.id}`}>
      <div className="product-media">
        <div className="main-image-frame">
          {mainImage && !brokenImages.has(mainImage) ? (
            <img
              src={mainImage}
              alt={product.title}
              loading="lazy"
              onError={() => handleBrokenImage(mainImage)}
            />
          ) : (
            <div
              className="image-placeholder"
              role="img"
              aria-label={`No image available for ${product.title}`}
            >
              Image unavailable
            </div>
          )}
        </div>

        {galleryImages.length > 0 && (
          <div className="thumbnail-strip" aria-label={`${product.title} images`}>
            {galleryImages.map((image, index) =>
              brokenImages.has(image) ? null : (
                <button
                  className={mainImage === image ? 'is-selected' : ''}
                  type="button"
                  key={`${image}-${index}`}
                  aria-label={`Image ${index + 1} of ${galleryImages.length} for ${product.title}`}
                  aria-pressed={mainImage === image}
                  onClick={() => setMainImage(image)}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => handleBrokenImage(image)}
                  />
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <div className="product-details">
        <h2 id={`product-${product.id}`}>{product.title}</h2>
        <p className="product-description">{product.description}</p>

        <div className="product-price-row">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {typeof product.discountPercentage === 'number' && (
            <span className="discount-badge">
              {product.discountPercentage.toFixed(0)}% OFF
            </span>
          )}
        </div>

        <button
          className="review-control"
          type="button"
          aria-label={`${rating} stars, ${reviewCount} reviews for ${product.title}`}
          onClick={(event) => onOpenReviews(product, event.currentTarget)}
        >
          <span aria-hidden="true">★</span>
          {rating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </button>

        <p className="product-brand">
          Brand: {product.brand?.trim() || 'Not available'}
        </p>
      </div>

      <div className="add-to-cart-area">
        {cartError && (
          <p className="cart-action-message is-error" role="alert">
            {cartError}
          </p>
        )}
        {cartMessage && (
          <p className="cart-action-message is-success" role="status">
            {cartMessage}
          </p>
        )}
        <button
          className="add-to-cart-button"
          type="button"
          disabled={isAddingToCart}
          onClick={() => void handleAddToCart()}
        >
          {isAddingToCart ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <CartIcon />
          )}
          {isAddingToCart ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

function ProductCatalog({
  userId,
  onAddToCart,
}: {
  userId: number
  onAddToCart: (product: Product) => Promise<void>
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [nextSkip, setNextSkip] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchController = useRef<AbortController | null>(null)
  const [openReview, setOpenReview] = useState<{
    product: Product
    returnFocus: HTMLButtonElement
  } | null>(null)

  const loadInitialProducts = async (signal?: AbortSignal) => {
    setIsInitialLoading(true)
    setError('')
    try {
      const data = await fetchProductsPage(0, signal)
      if (signal?.aborted) return
      setProducts(data.products)
      setTotal(data.total)
      setNextSkip(PAGE_SIZE)
      setHasMore(
        data.products.length > 0 && data.products.length < data.total,
      )
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        return
      }
      setError('Unable to load products. Please try again.')
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

  const loadMore = async () => {
    setIsLoadingMore(true)
    setError('')
    try {
      const data = await fetchProductsPage(nextSkip)
      setProducts((current) => [...current, ...data.products])
      setTotal(data.total)
      setNextSkip(nextSkip + PAGE_SIZE)
      setHasMore(
        data.products.length > 0 &&
          nextSkip + data.products.length < data.total,
      )
    } catch {
      setError(
        'Unable to load more products. Your loaded products are still available.',
      )
    } finally {
      setIsLoadingMore(false)
    }
  }

  const clearSearch = () => {
    searchController.current?.abort()
    searchController.current = null
    setActiveQuery('')
    setSearchResults([])
    setSearchTotal(0)
    setSearchError('')
    setIsSearching(false)
  }

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchInput.trim()
    if (!query) {
      clearSearch()
      return
    }

    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    setActiveQuery(query)
    setSearchResults([])
    setSearchTotal(0)
    setSearchError('')
    setIsSearching(true)

    try {
      const data = await searchProducts(query, controller.signal)
      if (controller.signal.aborted) return
      setSearchResults(data.products)
      setSearchTotal(data.total)
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        return
      }
      setSearchError('Unable to search products. Please try again.')
    } finally {
      if (!controller.signal.aborted) setIsSearching(false)
    }
  }

  const displayedProducts = activeQuery ? searchResults : products
  const displayedError = activeQuery ? searchError : error
  const isDisplayingLoading = activeQuery ? isSearching : isInitialLoading

  const appendComment = (productId: number, review: Review) => {
    const addReview = (items: Product[]) =>
      items.map((product) =>
        product.id === productId
          ? { ...product, reviews: [...(product.reviews ?? []), review] }
          : product,
      )

    setProducts(addReview)
    setSearchResults(addReview)
    setOpenReview((current) =>
      current && current.product.id === productId
        ? {
            ...current,
            product: {
              ...current.product,
              reviews: [...(current.product.reviews ?? []), review],
            },
          }
        : current,
    )
  }

  return (
    <section className="catalog" aria-labelledby="products-heading">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Signed in as user {userId}</p>
          <h1 id="products-heading">All Products</h1>
          <p className="showing-count" aria-live="polite">
            {activeQuery
              ? isSearching
                ? `Searching for “${activeQuery}”…`
                : `Showing ${searchResults.length} of ${searchTotal} results for “${activeQuery}”`
              : total === null
              ? isInitialLoading
                ? 'Loading product count…'
                : 'Product count unavailable'
              : `Showing ${products.length} of ${total} products`}
          </p>
        </div>

        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
              if (event.target.value === '' && activeQuery) clearSearch()
            }}
          />
          <button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      {displayedError && (
        <div className="catalog-error" role="alert">
          <span>{displayedError}</span>
          {!activeQuery && products.length === 0 && (
            <button type="button" onClick={() => void loadInitialProducts()}>
              Try again
            </button>
          )}
        </div>
      )}

      {isDisplayingLoading ? (
        <div className="catalog-status" role="status">
          <span className="spinner catalog-spinner" aria-hidden="true" />
          {activeQuery ? 'Searching products…' : 'Loading products…'}
        </div>
      ) : displayedProducts.length === 0 ? (
        displayedError ? null : (
          <p className="catalog-status">
            {activeQuery
              ? `No products match “${activeQuery}”.`
              : 'No products are available.'}
          </p>
        )
      ) : (
        <>
          <ul
            className="product-grid"
            id="product-results"
            aria-label={activeQuery ? 'Product search results' : 'Product catalog'}
          >
            {displayedProducts.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onOpenReviews={(selectedProduct, trigger) =>
                    setOpenReview({
                      product: selectedProduct,
                      returnFocus: trigger,
                    })
                  }
                />
              </li>
            ))}
          </ul>

          {!activeQuery && hasMore ? (
            <div className="load-more-row">
              <button
                className="load-more-button"
                type="button"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
              >
                {isLoadingMore && (
                  <span className="spinner" aria-hidden="true" />
                )}
                {isLoadingMore ? 'Loading more…' : 'Load more'}
              </button>
            </div>
          ) : !activeQuery ? (
            <p className="end-of-list" role="status">
              All available products are loaded.
            </p>
          ) : null}
        </>
      )}

      {openReview && (
        <ReviewModal
          product={openReview.product}
          userId={userId}
          onCommentAdded={(review) =>
            appendComment(openReview.product.id, review)
          }
          onClose={() => {
            const returnFocus = openReview.returnFocus
            setOpenReview(null)
            requestAnimationFrame(() => returnFocus.focus())
          }}
        />
      )}
    </section>
  )
}

function CartItemImage({ product }: { product: Product }) {
  const source =
    (typeof product.thumbnail === 'string' && product.thumbnail) ||
    product.images?.[0] ||
    ''
  const [hasError, setHasError] = useState(false)

  return source && !hasError ? (
    <img
      className="cart-item-image"
      src={source}
      alt={product.title}
      onError={() => setHasError(true)}
    />
  ) : (
    <div
      className="cart-item-image cart-image-placeholder"
      role="img"
      aria-label={`No image available for ${product.title}`}
    >
      No image
    </div>
  )
}

function CartPage({
  items,
  orderPlaced,
  onChangeQuantity,
  onRemove,
  onContinueShopping,
  onPlaceOrder,
}: {
  items: CartItem[]
  orderPlaced: boolean
  onChangeQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onContinueShopping: () => void
  onPlaceOrder: () => void
}) {
  const successRef = useRef<HTMLDivElement>(null)
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(value)

  useEffect(() => {
    if (orderPlaced) successRef.current?.focus()
  }, [orderPlaced])

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <div className="cart-layout">
        <div className="cart-items-column">
          <h1 id="cart-heading">Your Cart ({itemCount})</h1>

          {orderPlaced && (
            <div
              className="order-success"
              ref={successRef}
              role="status"
              tabIndex={-1}
            >
              <span aria-hidden="true">✓</span>
              <div>
                <h2>Order placed successfully</h2>
                <p>Thank you for your order.</p>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="empty-cart">
              <CartIcon />
              <h2>Your cart is empty</h2>
              <p>Add a product to see it here.</p>
            </div>
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
                      <td>
                        <div className="cart-product">
                          <CartItemImage product={product} />
                          <div>
                            <h2>{product.title}</h2>
                            <button
                              className="remove-item-button"
                              type="button"
                              onClick={() => onRemove(product.id)}
                            >
                              Remove
                              <span className="visually-hidden">
                                {' '}
                                {product.title} from cart
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        <div
                          className="quantity-stepper"
                          aria-label={`Quantity for ${product.title}`}
                        >
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${product.title}`}
                            disabled={quantity === 1}
                            onClick={() =>
                              onChangeQuantity(product.id, quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${product.title}`}
                            onClick={() =>
                              onChangeQuantity(product.id, quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="line-total">
                        {formatCurrency(product.price * quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            className="continue-shopping-button"
            type="button"
            onClick={onContinueShopping}
          >
            <span aria-hidden="true">←</span> Continue Shopping
          </button>
        </div>

        <aside className="order-summary" aria-labelledby="order-summary-heading">
          <h2 id="order-summary-heading">Order Summary</h2>
          <dl>
            <div>
              <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{formatCurrency(subtotal)}</dd>
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
    </section>
  )
}

function AppShell({
  destination,
  navigate,
  onLogout,
  userId,
}: {
  destination: Destination
  navigate: (destination: Destination) => void
  onLogout: () => void
  userId: number
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const cartCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0,
  )

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    nextDestination: Destination,
  ) => {
    event.preventDefault()
    navigate(nextDestination)
  }

  const addToCart = async (product: Product) => {
    const response = await fetch(ADD_CART_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        products: [{ id: product.id, quantity: 1 }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Cart request failed with status ${response.status}`)
    }

    setOrderPlaced(false)
    setCartItems((current) => {
      const existingItem = current.find(
        (item) => item.product.id === product.id,
      )
      return existingItem
        ? current.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { product, quantity: 1 }]
    })
  }

  const changeQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    )
  }

  const removeFromCart = (productId: number) => {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId),
    )
  }

  const placeOrder = () => {
    if (cartItems.length === 0) return
    setCartItems([])
    setOrderPlaced(true)
  }

  return (
    <div className="authenticated-app">
      <header className="app-header">
        <a
          className="compact-brand"
          href="/products"
          aria-label="MyShop products"
          onClick={(event) => handleNavigation(event, 'products')}
        >
          <BagIcon />
          <span>MyShop</span>
        </a>

        <nav aria-label="Main navigation">
          <a
            href="/products"
            aria-current={destination === 'products' ? 'page' : undefined}
            onClick={(event) => handleNavigation(event, 'products')}
          >
            Products
          </a>
          <a
            href="/cart"
            aria-current={destination === 'cart' ? 'page' : undefined}
            onClick={(event) => handleNavigation(event, 'cart')}
          >
            Cart
          </a>
        </nav>

        <div className="header-actions">
          <a
            className="cart-link"
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            aria-current={destination === 'cart' ? 'page' : undefined}
            onClick={(event) => handleNavigation(event, 'cart')}
          >
            <CartIcon />
            <span className="cart-badge" aria-hidden="true">
              {cartCount}
            </span>
          </a>
          <button className="secondary-button" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="placeholder-main">
        <div hidden={destination !== 'products'}>
          <ProductCatalog userId={userId} onAddToCart={addToCart} />
        </div>
        <div hidden={destination !== 'cart'}>
          <CartPage
            items={cartItems}
            orderPlaced={orderPlaced}
            onChangeQuantity={changeQuantity}
            onRemove={removeFromCart}
            onContinueShopping={() => navigate('products')}
            onPlaceOrder={placeOrder}
          />
        </div>
      </main>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors: FieldErrors = {}

    if (!username.trim()) errors.username = 'Enter your username.'
    if (!password) errors.password = 'Enter your password.'

    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) {
      if (errors.username) {
        usernameRef.current?.focus()
      } else {
        passwordRef.current?.focus()
      }
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!response.ok) {
        let message = ''
        try {
          const body: unknown = await response.json()
          if (
            typeof body === 'object' &&
            body !== null &&
            typeof (body as { message?: unknown }).message === 'string'
          ) {
            message = (body as { message: string }).message
          }
        } catch {
          // A useful fallback is shown below when the server has no JSON body.
        }

        if (response.status === 400 && message === 'Invalid credentials') {
          setFormError('Invalid username or password. Please try again.')
        } else {
          setFormError(message || 'We could not log you in. Please try again.')
        }
        return
      }

      const data = (await response.json()) as LoginResponse
      if (typeof data.id !== 'number' || !data.accessToken) {
        setFormError('The login response was incomplete. Please try again.')
        return
      }

      const session = { id: data.id, accessToken: data.accessToken }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      onLogin(session)
    } catch {
      setFormError(
        'Unable to connect. Check your internet connection and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="brand" aria-label="MyShop">
          <BagIcon />
          <span>MyShop</span>
        </div>

        <div className="login-intro">
          <h1 id="login-heading">Welcome Back</h1>
          <p>Please login to your account</p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          {formError && (
            <div
              className="form-alert"
              id={formErrorId}
              role="alert"
              tabIndex={-1}
            >
              {formError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="username">Username</label>
            <div
              className={`input-shell${fieldErrors.username ? ' has-error' : ''}`}
            >
              <UserIcon />
              <input
                ref={usernameRef}
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
              <p className="field-error" id={usernameErrorId}>
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div
              className={`input-shell${fieldErrors.password ? ' has-error' : ''}`}
            >
              <LockIcon />
              <input
                ref={passwordRef}
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
                className="visibility-button"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
                onClick={() => setShowPassword((visible) => !visible)}
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
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [destination, setDestination] = useState<Destination>(() =>
    window.location.pathname === '/cart' ? 'cart' : 'products',
  )

  useEffect(() => {
    const path = session ? `/${destination}` : '/'
    document.title = session
      ? `${destination === 'cart' ? 'Your Cart' : 'Products'} | MyShop`
      : 'Login | MyShop'
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path)
    }
  }, [destination, session])

  useEffect(() => {
    const handlePopState = () => {
      if (!session) return
      setDestination(window.location.pathname === '/cart' ? 'cart' : 'products')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [session])

  const handleLogin = (nextSession: Session) => {
    setDestination('products')
    setSession(nextSession)
    window.history.pushState(null, '', '/products')
  }

  const navigate = (nextDestination: Destination) => {
    if (nextDestination === destination) return
    setDestination(nextDestination)
    window.history.pushState(null, '', `/${nextDestination}`)
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    window.history.pushState(null, '', '/')
  }

  return session ? (
    <AppShell
      destination={destination}
      navigate={navigate}
      userId={session.id}
      onLogout={handleLogout}
    />
  ) : (
    <Login onLogin={handleLogin} />
  )
}
