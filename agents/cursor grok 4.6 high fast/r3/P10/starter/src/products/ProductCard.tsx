import { useId, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import { CartRequestError } from '../cart/cartsApi'
import ReviewModal from './ReviewModal'
import type { CatalogProduct, ProductReview } from './types'
import './ProductCard.css'

type ProductCardProps = {
  product: CatalogProduct
  onReviewAdded: (productId: number, review: ProductReview) => void
}

function gallerySources(product: CatalogProduct): string[] {
  if (product.images.length > 0) {
    return product.images
  }
  return product.thumbnail ? [product.thumbnail] : []
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)))
  return (
    <span className="product-card-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < filled ? 'is-filled' : undefined}>
          ★
        </span>
      ))}
    </span>
  )
}

function ProductPhoto({ src, alt, decorative = false }: { src: string; alt: string; decorative?: boolean }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    if (decorative) {
      return <span className="product-card-fallback product-card-fallback-thumb" aria-hidden="true" />
    }
    return (
      <div className="product-card-fallback" role="img" aria-label={alt}>
        No image available
      </div>
    )
  }

  return (
    <img
      className={decorative ? 'product-card-thumb-photo' : 'product-card-photo'}
      src={src}
      alt={decorative ? '' : alt}
      onError={() => setFailed(true)}
    />
  )
}

export default function ProductCard({ product, onReviewAdded }: ProductCardProps) {
  const { session } = useAuth()
  const { addProduct } = useCart()
  const cartErrorId = useId()
  const thumbs = gallerySources(product)
  const initialMain = product.thumbnail || thumbs[0] || ''
  const [mainSrc, setMainSrc] = useState(initialMain)
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const match = thumbs.indexOf(initialMain)
    return match === -1 ? 0 : match
  })
  const [mainKey, setMainKey] = useState(0)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)

  const brandLabel = product.brand ?? 'Brand unavailable'
  const reviewCount = product.reviews.length
  const reviewLabel =
    reviewCount === 0
      ? `Rated ${product.rating.toFixed(1)} out of 5. No reviews`
      : `Rated ${product.rating.toFixed(1)} out of 5. ${reviewCount} reviews`

  function selectImage(index: number) {
    const next = thumbs[index]
    if (!next) {
      return
    }
    setSelectedIndex(index)
    setMainSrc(next)
    setMainKey((current) => current + 1)
  }

  return (
    <article className="product-card">
      <div className="product-card-media">
        <ProductPhoto key={`${product.id}-${mainKey}`} src={mainSrc} alt={product.title} />

        {thumbs.length > 0 ? (
          <ul className="product-card-thumbs">
            {thumbs.map((src, index) => (
              <li key={`${product.id}-thumb-${index}`}>
                <button
                  type="button"
                  className="product-card-thumb"
                  aria-label={`Image ${index + 1} of ${thumbs.length}`}
                  aria-pressed={selectedIndex === index}
                  onClick={() => selectImage(index)}
                >
                  <ProductPhoto src={src} alt="" decorative />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="product-card-body">
        <h2 className="product-card-title">{product.title}</h2>
        <p className="product-card-description">{product.description || 'No description available.'}</p>

        <div className="product-card-pricing">
          <p className="product-card-price">${product.price.toFixed(2)}</p>
          {product.discountPercentage > 0 ? (
            <p className="product-card-discount">{product.discountPercentage.toFixed(2)}% off</p>
          ) : null}
        </div>

        <button
          type="button"
          className="product-card-reviews"
          aria-label={reviewLabel}
          aria-haspopup="dialog"
          aria-expanded={reviewsOpen}
          onClick={() => setReviewsOpen(true)}
        >
          <StarRow rating={product.rating} />
          <span>{product.rating.toFixed(1)}</span>
          <span className="product-card-reviews-count">
            {reviewCount === 0 ? 'Reviews' : `${reviewCount} reviews`}
          </span>
        </button>

        <p className="product-card-brand">{brandLabel}</p>

        {cartError ? (
          <p id={cartErrorId} className="product-card-cart-error" role="alert">
            {cartError}
          </p>
        ) : null}

        <button
          type="button"
          className="product-card-cart"
          disabled={isAdding}
          aria-busy={isAdding}
          aria-describedby={cartError ? cartErrorId : undefined}
          onClick={() => {
            void (async () => {
              setIsAdding(true)
              setCartError(null)
              try {
                await addProduct(product, 1)
              } catch (cause) {
                setCartError(
                  cause instanceof CartRequestError
                    ? cause.message
                    : 'Unable to add this item to your cart. Please try again.',
                )
              } finally {
                setIsAdding(false)
              }
            })()
          }}
        >
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>

      {reviewsOpen && session ? (
        <ReviewModal
          productId={product.id}
          productTitle={product.title}
          userId={session.id}
          reviews={product.reviews}
          onClose={() => setReviewsOpen(false)}
          onReviewAdded={(review) => onReviewAdded(product.id, review)}
        />
      ) : null}
    </article>
  )
}
