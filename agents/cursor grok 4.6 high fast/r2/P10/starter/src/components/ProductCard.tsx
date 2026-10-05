import { useEffect, useId, useMemo, useState } from 'react'
import { CartError } from '../api/cart'
import type { CatalogProduct, ProductReview } from '../api/products'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import ReviewModal from './ReviewModal'

type ProductCardProps = {
  product: CatalogProduct
  onReviewsChange: (reviews: ProductReview[]) => void
}

function gallerySources(product: CatalogProduct): string[] {
  const images = product.images.filter((url) => url.length > 0)
  if (images.length > 0) {
    return images
  }
  return product.thumbnail ? [product.thumbnail] : []
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function originalPrice(price: number, discountPercentage: number): number | null {
  if (discountPercentage <= 0 || discountPercentage >= 100) {
    return null
  }
  return price / (1 - discountPercentage / 100)
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="product-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'is-filled' : undefined}>
          ★
        </span>
      ))}
    </span>
  )
}

function ImageFallback({ label }: { label: string }) {
  return (
    <div className="product-image-fallback" role="img" aria-label={label}>
      Image unavailable
    </div>
  )
}

export default function ProductCard({ product, onReviewsChange }: ProductCardProps) {
  const { session } = useAuth()
  const { addProductToCart } = useCart()
  const addErrorId = useId()
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const gallery = useMemo(() => gallerySources(product), [product])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mainFailed, setMainFailed] = useState(false)
  const [failedThumbs, setFailedThumbs] = useState<Record<number, true>>({})
  const [reviewsOpen, setReviewsOpen] = useState(false)

  useEffect(() => {
    setSelectedIndex(0)
    setMainFailed(false)
    setFailedThumbs({})
  }, [product.id])

  const mainSrc = gallery[selectedIndex] ?? product.thumbnail
  const compareAt = originalPrice(product.price, product.discountPercentage)
  const reviewCount = product.reviews.length
  const reviewLabel = `${product.rating.toFixed(1)} rating, ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
  const brandLabel = product.brand ?? 'Unknown brand'

  return (
    <article className="product-card">
      <div className="product-media">
        {mainSrc && !mainFailed ? (
          <img
            className="product-main-image"
            src={mainSrc}
            alt={product.title}
            onError={() => setMainFailed(true)}
          />
        ) : (
          <ImageFallback label={`${product.title} image unavailable`} />
        )}

        {gallery.length > 0 ? (
          <ul className="product-thumbs">
            {gallery.map((src, index) => (
              <li key={`${product.id}-${src}-${index}`}>
                <button
                  type="button"
                  className="product-thumb"
                  aria-label={`Image ${index + 1} of ${gallery.length}`}
                  aria-pressed={selectedIndex === index}
                  onClick={() => {
                    setSelectedIndex(index)
                    setMainFailed(false)
                  }}
                >
                  {failedThumbs[index] ? (
                    <span className="product-thumb-fallback" aria-hidden="true" />
                  ) : (
                    <img
                      src={src}
                      alt=""
                      onError={() => {
                        setFailedThumbs((current) => ({ ...current, [index]: true }))
                      }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <h2 className="product-title">{product.title}</h2>
      {product.description ? <p className="product-description">{product.description}</p> : null}

      <div className="product-pricing">
        <span className="product-price">{formatMoney(product.price)}</span>
        {compareAt ? (
          <span className="product-price-original">{formatMoney(compareAt)}</span>
        ) : null}
        {product.discountPercentage > 0 ? (
          <span className="product-discount">{`${Math.round(product.discountPercentage)}% OFF`}</span>
        ) : null}
      </div>

      <button
        type="button"
        className="product-reviews"
        aria-label={reviewLabel}
        aria-haspopup="dialog"
        aria-expanded={reviewsOpen}
        onClick={() => setReviewsOpen(true)}
      >
        <StarRow rating={product.rating} />
        <span>
          {product.rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </button>

      <ReviewModal
        open={reviewsOpen}
        productId={product.id}
        productTitle={product.title}
        userId={session?.id ?? null}
        reviews={product.reviews}
        onClose={() => setReviewsOpen(false)}
        onReviewsChange={onReviewsChange}
      />

      <p className="product-brand">Brand: {brandLabel}</p>

      <button
        type="button"
        className="product-add-cart"
        disabled={isAdding}
        aria-describedby={addError ? addErrorId : undefined}
        onClick={() => {
          void (async () => {
            setIsAdding(true)
            setAddError('')
            try {
              await addProductToCart(
                {
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  thumbnail: product.thumbnail,
                },
                1,
              )
            } catch (error) {
              setAddError(error instanceof CartError ? error.message : 'Unable to add to cart. Please try again.')
            } finally {
              setIsAdding(false)
            }
          })()
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6.2 7.2h13.1l-1.2 8.4H8L6.2 7.2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M6.2 7.2 5.2 4H3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="9.2" cy="19.2" r="1.2" fill="currentColor" />
          <circle cx="16.8" cy="19.2" r="1.2" fill="currentColor" />
        </svg>
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
      {addError ? (
        <p id={addErrorId} className="product-add-error" role="alert">
          {addError}
        </p>
      ) : null}
    </article>
  )
}
