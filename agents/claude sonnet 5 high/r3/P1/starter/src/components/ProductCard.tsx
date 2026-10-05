import { useEffect, useState } from 'react'
import { ApiError, addToCartRequest } from '../api.ts'
import { useAuth } from '../context/AuthContext.tsx'
import { useCart } from '../context/CartContext.tsx'
import type { Product } from '../types.ts'
import { StarRating } from './StarRating.tsx'

interface ProductCardProps {
  product: Product
  onOpenReviews: (product: Product) => void
}

export function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const { user } = useAuth()
  const { addItem } = useCart()

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.thumbnail
        ? [product.thumbnail]
        : []

  const [activeIndex, setActiveIndex] = useState(0)
  const [mainImageError, setMainImageError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    setMainImageError(false)
  }, [activeIndex])

  const mainImageSrc = images[activeIndex]
  const showMainImage = Boolean(mainImageSrc) && !mainImageError

  const hasDiscount = product.discountPercentage > 0
  const originalPrice = hasDiscount
    ? product.price / (1 - product.discountPercentage / 100)
    : product.price

  const brandLabel = product.brand && product.brand.trim().length > 0 ? product.brand : 'Unbranded'

  async function handleAddToCart() {
    if (!user || isAdding) return
    setIsAdding(true)
    setAddError(null)
    try {
      await addToCartRequest(user.id, product.id, 1)
      addItem(product, 1)
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 2500)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to add to cart. Please try again.'
      setAddError(message)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <li className="product-card">
      <div className="product-card__image-wrap">
        {showMainImage ? (
          <img
            className="product-card__image"
            src={mainImageSrc}
            alt={product.title}
            loading="lazy"
            onError={() => setMainImageError(true)}
          />
        ) : (
          <div className="product-card__image-fallback" role="img" aria-label={`${product.title}: image unavailable`}>
            Image unavailable
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="product-card__thumbs" role="group" aria-label={`${product.title} thumbnail images`}>
          {images.map((image, index) => (
            <button
              key={`${product.id}-thumb-${index}`}
              type="button"
              className={index === activeIndex ? 'product-card__thumb is-active' : 'product-card__thumb'}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img
                src={image}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden'
                }}
              />
            </button>
          ))}
        </div>
      )}

      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__description">{product.description}</p>

      <div className="product-card__price-row">
        <span className="product-card__price">${product.price.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="product-card__original-price">${originalPrice.toFixed(2)}</span>
            <span className="product-card__discount-badge">
              {Math.round(product.discountPercentage)}% off
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        className="product-card__rating"
        onClick={() => onOpenReviews(product)}
        aria-haspopup="dialog"
      >
        <StarRating rating={product.rating} />
        <span>
          {product.rating.toFixed(1)} ({product.reviews.length} review
          {product.reviews.length === 1 ? '' : 's'})
        </span>
      </button>

      <p className="product-card__brand">Brand: {brandLabel}</p>

      <div aria-live="polite">
        {addError && <p role="alert" className="form-error">{addError}</p>}
        {justAdded && !addError && <p className="product-card__success">Added to cart</p>}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-full"
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
    </li>
  )
}
