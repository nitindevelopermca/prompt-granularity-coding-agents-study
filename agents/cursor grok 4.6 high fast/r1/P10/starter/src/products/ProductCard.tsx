import { useId, useMemo, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { CartRequestError } from '../cart/cartsApi'
import ReviewModal from './ReviewModal'
import type { CatalogProduct, ProductReview } from './types'

type ProductCardProps = {
  product: CatalogProduct
  onReviewAdded: (productId: number, review: ProductReview) => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

function originalPrice(price: number, discountPercentage: number): number | null {
  if (discountPercentage <= 0 || discountPercentage >= 100) {
    return null
  }
  return price / (1 - discountPercentage / 100)
}

function CartGlyph() {
  return (
    <svg className="product-cart-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 7h15l-1.4 9.2A2 2 0 0 1 17.63 18H8.5a2 2 0 0 1-1.97-1.64L5 4H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20.2" r="1.2" fill="currentColor" />
      <circle cx="17" cy="20.2" r="1.2" fill="currentColor" />
    </svg>
  )
}

export default function ProductCard({ product, onReviewAdded }: ProductCardProps) {
  const thumbs = product.images
  const initialMain = product.thumbnail ?? thumbs[0] ?? null
  const [selectedSrc, setSelectedSrc] = useState<string | null>(initialMain)
  const [failedSrcs, setFailedSrcs] = useState<string[]>([])
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const cartErrorId = useId()
  const { addToCart } = useCart()

  const visibleThumbs = useMemo(
    () => thumbs.filter((src) => !failedSrcs.includes(src)),
    [thumbs, failedSrcs],
  )

  const mainSrc =
    selectedSrc && !failedSrcs.includes(selectedSrc)
      ? selectedSrc
      : (visibleThumbs[0] ?? (initialMain && !failedSrcs.includes(initialMain) ? initialMain : null))

  const reviewCount = product.reviews.length
  const reviewLabel = `${product.rating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`
  const priorPrice = originalPrice(product.price, product.discountPercentage)
  const roundedRating = Math.round(product.rating)

  function markFailed(src: string) {
    setFailedSrcs((current) => (current.includes(src) ? current : [...current, src]))
  }

  return (
    <article className="products-card">
      <div className="product-gallery">
        {mainSrc ? (
          <img
            className="product-main-image"
            src={mainSrc}
            alt={product.title}
            onError={() => markFailed(mainSrc)}
          />
        ) : (
          <div className="product-image-fallback" role="img" aria-label={`${product.title}, image unavailable`}>
            Image unavailable
          </div>
        )}

        {visibleThumbs.length > 0 ? (
          <ul className="product-thumbs">
            {visibleThumbs.map((src, index) => {
              const selected = src === mainSrc
              return (
                <li key={`${src}-${index}`}>
                  <button
                    type="button"
                    className={selected ? 'is-selected' : undefined}
                    aria-label={`Image ${index + 1} of ${visibleThumbs.length}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedSrc(src)}
                  >
                    <img
                      src={src}
                      alt=""
                      onError={() => markFailed(src)}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <h2>{product.title}</h2>
      {product.description ? <p className="product-description">{product.description}</p> : null}

      <div className="product-price-row">
        <p className="products-card-price">{formatPrice(product.price)}</p>
        {priorPrice ? (
          <p className="product-price-original">
            <s>{formatPrice(priorPrice)}</s>
          </p>
        ) : null}
        {product.discountPercentage > 0 ? (
          <p className="product-discount">{Math.round(product.discountPercentage)}% OFF</p>
        ) : null}
      </div>

      <button
        type="button"
        className="product-reviews-control"
        aria-label={reviewLabel}
        aria-haspopup="dialog"
        aria-expanded={reviewsOpen}
        onClick={() => setReviewsOpen(true)}
      >
        <span className="product-stars" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < roundedRating ? 'is-filled' : undefined}>
              ★
            </span>
          ))}
        </span>
        <span>{reviewLabel}</span>
      </button>

      <p className="product-brand">
        <strong>Brand:</strong> {product.brand ?? 'Unknown'}
      </p>

      <button
        type="button"
        className="product-add-to-cart"
        onClick={() => {
          void (async () => {
            setIsAdding(true)
            setCartError(null)
            try {
              await addToCart(product, 1)
            } catch (cause) {
              const message =
                cause instanceof CartRequestError
                  ? cause.message
                  : 'Unable to add this item to your cart. Please try again.'
              setCartError(message)
            } finally {
              setIsAdding(false)
            }
          })()
        }}
        disabled={isAdding}
        aria-busy={isAdding}
        aria-describedby={cartError ? cartErrorId : undefined}
      >
        <CartGlyph />
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
      {cartError ? (
        <p id={cartErrorId} className="product-cart-error" role="alert">
          {cartError}
        </p>
      ) : null}

      <ReviewModal
        product={product}
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        onReviewAdded={(review) => onReviewAdded(product.id, review)}
      />
    </article>
  )
}
