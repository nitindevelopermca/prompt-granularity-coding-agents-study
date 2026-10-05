import { useEffect, useId, useState } from 'react'
import { CartRequestError } from '../api/cart'
import { useCart } from '../cart/CartContext'
import type { Product } from '../types/product'
import { StarIcon } from './Icons'
import { brandLabel, formatDiscount, formatPrice, mainImageSrc, reviewCountLabel } from './productDisplay'
import './ProductCard.css'

type ProductCardProps = {
  product: Product
  onOpenReviews: (product: Product) => void
}

type SafeImageProps = {
  src: string
  alt: string
  className: string
}

function SafeImage({ src, alt, className }: SafeImageProps) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src])

  if (!src || broken) {
    return (
      <div className={`${className} product-image-fallback`} role="img" aria-label={alt}>
        No image
      </div>
    )
  }

  return <img className={className} src={src} alt={alt} onError={() => setBroken(true)} />
}

function StarRating({ value }: { value: number }) {
  const filled = Math.round(value)
  return (
    <span className="star-rating" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} className="star-rating-icon" filled={index < filled} />
      ))}
    </span>
  )
}

export function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const { addProduct } = useCart()
  const addErrorId = useId()
  const [selectedSrc, setSelectedSrc] = useState(() => mainImageSrc(product))
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const images = product.images
  const reviewLabel = reviewCountLabel(product.reviews.length)

  async function handleAddToCart() {
    if (isAdding) {
      return
    }
    setIsAdding(true)
    setAddError(null)
    try {
      await addProduct(product)
    } catch (error) {
      setAddError(
        error instanceof CartRequestError
          ? error.message
          : 'Unable to add this item to your cart. Please try again.',
      )
    } finally {
      setIsAdding(false)
    }
  }

  useEffect(() => {
    setSelectedSrc(mainImageSrc(product))
  }, [product.id])

  return (
    <article className="product-card">
      <div className="product-card-media">
        <SafeImage className="product-card-main-image" src={selectedSrc} alt={product.title} />
        {images.length > 0 ? (
          <ul className="product-card-thumbs">
            {images.map((src, index) => {
              const label = `Image ${index + 1} of ${images.length}`
              const selected = src === selectedSrc
              return (
                <li key={`${product.id}-thumb-${index}`}>
                  <button
                    type="button"
                    className={selected ? 'product-thumb is-selected' : 'product-thumb'}
                    aria-label={label}
                    aria-pressed={selected}
                    onClick={() => setSelectedSrc(src)}
                  >
                    <SafeImage className="product-thumb-image" src={src} alt="" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <div className="product-card-body">
        <h2 className="product-card-title">{product.title}</h2>
        {product.description ? <p className="product-card-description">{product.description}</p> : null}

        <p className="product-card-price">
          <span className="product-card-amount">{formatPrice(product.price)}</span>
          <span className="product-card-discount">{formatDiscount(product.discountPercentage)}</span>
        </p>

        <button
          type="button"
          className="product-card-reviews"
          aria-haspopup="dialog"
          aria-label={`${product.rating.toFixed(1)} out of 5 stars, ${reviewLabel}`}
          onClick={() => onOpenReviews(product)}
        >
          <StarRating value={product.rating} />
          <span>{reviewLabel}</span>
        </button>

        <p className="product-card-brand">{brandLabel(product.brand)}</p>

        <button
          type="button"
          className="product-card-add"
          onClick={() => void handleAddToCart()}
          disabled={isAdding}
          aria-describedby={addError ? addErrorId : undefined}
        >
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
        {addError ? (
          <p id={addErrorId} className="product-card-add-error" role="alert">
            {addError}
          </p>
        ) : null}
      </div>
    </article>
  )
}
