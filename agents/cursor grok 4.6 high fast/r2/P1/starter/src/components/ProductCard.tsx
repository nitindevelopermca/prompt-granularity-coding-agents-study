import { useId, useState } from 'react'
import { useAuth } from '../auth'
import { useCart } from '../cart'
import { StarIcon } from '../icons'
import type { Product } from '../types'
import { BRAND_FALLBACK, formatPrice } from '../utils'
import { SafeImage } from './SafeImage'

type ProductCardProps = {
  product: Product
  onOpenReviews: (product: Product) => void
}

export function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const { session } = useAuth()
  const { addProduct } = useCart()
  const thumbsId = useId()
  const [activeIndex, setActiveIndex] = useState(0)
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState('')

  const images = product.images.length > 0 ? product.images : product.thumbnail ? [product.thumbnail] : []
  const mainSrc = images[activeIndex] ?? product.thumbnail
  const reviewCount = product.reviews.length
  const brand = product.brand.trim() || BRAND_FALLBACK

  async function handleAddToCart() {
    if (!session) {
      return
    }
    setCartError('')
    setAdding(true)
    try {
      await addProduct(session.id, product, 1)
    } catch (error) {
      setCartError(error instanceof Error ? error.message : 'Unable to add item to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-media">
        <SafeImage className="product-main-image" src={mainSrc || ''} alt={product.title} />
        {images.length > 0 ? (
          <div className="thumb-strip" role="group" aria-labelledby={thumbsId}>
            <span id={thumbsId} className="visually-hidden">
              Product images for {product.title}
            </span>
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                className={index === activeIndex ? 'thumb-button active' : 'thumb-button'}
                onClick={() => setActiveIndex(index)}
                aria-label={`Image ${index + 1} of ${images.length}`}
                aria-pressed={index === activeIndex}
              >
                <SafeImage src={src} alt="" className="thumb-image" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-body">
        <h2 className="product-title">{product.title}</h2>
        <p className="product-description">{product.description || 'No description available.'}</p>

        <div className="product-price-row">
          <p className="product-price">{formatPrice(product.price)}</p>
          {product.discountPercentage > 0 ? (
            <p className="product-discount">{product.discountPercentage.toFixed(2)}% off</p>
          ) : null}
        </div>

        <button
          type="button"
          className="rating-button"
          onClick={() => onOpenReviews(product)}
          aria-haspopup="dialog"
          aria-label={`Reviews for ${product.title}, rated ${product.rating.toFixed(2)} out of 5 from ${reviewCount} reviews`}
        >
          <span className="review-stars" aria-hidden="true">
            {Array.from({ length: 5 }, (_, star) => (
              <StarIcon key={star} className="star-icon" filled={star < Math.round(product.rating)} />
            ))}
          </span>
          <span>
            {product.rating.toFixed(2)} · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </button>

        <p className="product-brand">
          <span className="muted">Brand</span> {brand}
        </p>

        {cartError ? (
          <p className="field-error" role="alert">
            {cartError}
          </p>
        ) : null}

        <button
          type="button"
          className="primary-button full-width"
          onClick={handleAddToCart}
          disabled={adding}
        >
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}
