import { useState } from 'react'
import type { Product } from '../types'
import { StarRatingDisplay } from './StarRating'
import { CartIcon } from './icons'
import { IMAGE_PLACEHOLDER } from '../lib/imagePlaceholder'

interface ProductCardProps {
  product: Product
  onOpenReviews: (product: Product) => void
  onAddToCart: (product: Product) => Promise<void>
}

export function ProductCard({ product, onOpenReviews, onAddToCart }: ProductCardProps) {
  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail]
  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)

  const mainSrc = brokenImages[activeIndex] ? IMAGE_PLACEHOLDER : images[activeIndex] || IMAGE_PLACEHOLDER

  const discountedPrice = product.price - (product.price * product.discountPercentage) / 100
  const hasDiscount = product.discountPercentage > 0
  const reviewCount = product.reviews?.length ?? 0

  async function handleAddToCart() {
    setIsAdding(true)
    setAddError(null)
    setJustAdded(false)
    try {
      await onAddToCart(product)
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 2000)
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : 'Could not add this item to the cart. Please try again.',
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <img
          src={mainSrc}
          alt={product.title}
          className="product-card__image"
          loading="lazy"
          onError={() => setBrokenImages((prev) => ({ ...prev, [activeIndex]: true }))}
        />
      </div>

      {images.length > 1 && (
        <div className="product-card__thumbs" role="group" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={`${product.id}-thumb-${index}`}
              type="button"
              className={`product-card__thumb${index === activeIndex ? ' is-active' : ''}`}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img
                src={brokenImages[index] ? IMAGE_PLACEHOLDER : image}
                alt=""
                onError={() => setBrokenImages((prev) => ({ ...prev, [index]: true }))}
              />
            </button>
          ))}
        </div>
      )}

      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__description">{product.description}</p>

      <div className="product-card__price-row">
        <span className="product-card__price">${discountedPrice.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="product-card__price-original">${product.price.toFixed(2)}</span>
            <span className="product-card__discount-badge">{Math.round(product.discountPercentage)}% OFF</span>
          </>
        )}
      </div>

      <button
        type="button"
        className="product-card__rating"
        onClick={() => onOpenReviews(product)}
        aria-label={`${product.rating.toFixed(1)} out of 5 stars, ${reviewCount} review${reviewCount === 1 ? '' : 's'}. Open reviews.`}
      >
        <StarRatingDisplay rating={product.rating} />
        <span className="product-card__rating-text">
          {product.rating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      </button>

      <p className="product-card__brand">Brand: {product.brand || 'Generic'}</p>

      {addError && (
        <p className="field-error" role="alert">
          {addError}
        </p>
      )}
      {justAdded && (
        <p className="product-card__success" role="status">
          Added to cart
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary btn-full"
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        <CartIcon />
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
    </article>
  )
}
