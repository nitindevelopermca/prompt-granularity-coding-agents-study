import { useMemo, useState } from 'react'
import type { Product } from '../types'
import { formatCurrency, formatRating } from '../utils/format'
import { StarRatingDisplay } from './StarRating'
import { AlertIcon, ImageOffIcon } from './Icons'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  onOpenReviews: (productId: number) => void
  onAddToCart: (product: Product) => Promise<void>
}

export default function ProductCard({ product, onOpenReviews, onAddToCart }: ProductCardProps) {
  const gallery = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images
    if (product.thumbnail) return [product.thumbnail]
    return []
  }, [product.images, product.thumbnail])

  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({})
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)

  const safeActiveIndex = activeIndex < gallery.length ? activeIndex : 0
  const mainImageSrc = gallery[safeActiveIndex]
  const mainImageBroken = mainImageSrc ? brokenImages[safeActiveIndex] : true

  const discount = product.discountPercentage > 0 ? product.discountPercentage : 0
  const originalPrice = discount > 0 ? product.price / (1 - discount / 100) : null

  const handleAddToCart = async () => {
    setAdding(true)
    setAddError(null)
    setAddSuccess(false)
    try {
      await onAddToCart(product)
      setAddSuccess(true)
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Could not add item to cart. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-card__image-wrapper">
        {mainImageSrc && !mainImageBroken ? (
          <img
            src={mainImageSrc}
            alt={product.title}
            className="product-card__image"
            onError={() => setBrokenImages((prev) => ({ ...prev, [safeActiveIndex]: true }))}
          />
        ) : (
          <div className="product-card__image-fallback" role="img" aria-label={`No image available for ${product.title}`}>
            <ImageOffIcon width={32} height={32} />
            <span>No image available</span>
          </div>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="product-card__thumbs" role="group" aria-label={`${product.title} image thumbnails`}>
          {gallery.map((src, index) => {
            const isBroken = brokenImages[index]
            return (
              <button
                key={`${product.id}-thumb-${index}`}
                type="button"
                className={`product-card__thumb ${index === safeActiveIndex ? 'product-card__thumb--active' : ''}`}
                aria-label={`Image ${index + 1} of ${gallery.length}`}
                aria-pressed={index === safeActiveIndex}
                onClick={() => setActiveIndex(index)}
              >
                {isBroken ? (
                  <ImageOffIcon width={16} height={16} />
                ) : (
                  <img
                    src={src}
                    alt=""
                    onError={() => setBrokenImages((prev) => ({ ...prev, [index]: true }))}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__description">{product.description}</p>

      <div className="product-card__price-row">
        <span className="product-card__price">{formatCurrency(product.price)}</span>
        {originalPrice !== null && (
          <span className="product-card__original-price">{formatCurrency(originalPrice)}</span>
        )}
        {discount > 0 && <span className="product-card__discount-badge">{Math.round(discount)}% Off</span>}
      </div>

      <button
        type="button"
        className="product-card__rating-button"
        onClick={() => onOpenReviews(product.id)}
        aria-label={`Rated ${formatRating(product.rating)} out of 5, ${product.reviews.length} review${
          product.reviews.length === 1 ? '' : 's'
        }. View reviews.`}
      >
        <StarRatingDisplay rating={product.rating} size={14} />
        <span className="product-card__rating-text">
          {formatRating(product.rating)} ({product.reviews.length} review{product.reviews.length === 1 ? '' : 's'})
        </span>
      </button>

      <p className="product-card__brand">Brand: {product.brand && product.brand.trim() !== '' ? product.brand : 'Generic'}</p>

      <button
        type="button"
        className="primary-button product-card__add-button"
        onClick={handleAddToCart}
        disabled={adding}
        aria-busy={adding}
      >
        {adding && <span className="spinner" aria-hidden="true" />}
        {adding ? 'Adding…' : 'Add to Cart'}
      </button>

      <div aria-live="polite" className="product-card__status">
        {addError && (
          <p className="inline-alert product-card__error">
            <AlertIcon width={16} height={16} />
            <span>{addError}</span>
          </p>
        )}
        {addSuccess && !addError && <p className="status-message status-message--success">Added to cart.</p>}
      </div>
    </article>
  )
}
