import { useState } from 'react'
import type { Product } from '../types'

const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#999" dy=".3em">No image</text></svg>',
  )

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onOpenReviews: (product: Product) => void
  addToCartState?: 'idle' | 'loading' | 'error'
}

export default function ProductCard({ product, onAddToCart, onOpenReviews, addToCartState = 'idle' }: ProductCardProps) {
  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail]
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgError, setImgError] = useState(false)

  const mainImage = imgError ? FALLBACK_IMAGE : images[activeIndex] ?? product.thumbnail ?? FALLBACK_IMAGE
  const brand = product.brand && product.brand.trim().length > 0 ? product.brand : 'Generic'
  const discount = product.discountPercentage ?? 0
  const discountedPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price

  return (
    <li className="product-card">
      <div className="product-card__image-wrap">
        <img
          className="product-card__image"
          src={mainImage}
          alt={product.title}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
      {images.length > 1 && (
        <div className="product-card__thumbs" role="group" aria-label="Product images">
          {images.map((src, index) => (
            <button
              key={`${product.id}-thumb-${index}`}
              type="button"
              className={`product-card__thumb${index === activeIndex ? ' product-card__thumb--active' : ''}`}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => {
                setActiveIndex(index)
                setImgError(false)
              }}
            >
              <img src={src} alt="" aria-hidden="true" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__description">{product.description}</p>
      <p className="product-card__brand">Brand: {brand}</p>

      <div className="product-card__price-row">
        <span className="product-card__price">${discountedPrice.toFixed(2)}</span>
        {discount > 0 && (
          <span className="product-card__discount">-{discount.toFixed(0)}% off</span>
        )}
      </div>

      <button
        type="button"
        className="product-card__reviews-btn"
        onClick={() => onOpenReviews(product)}
        aria-haspopup="dialog"
      >
        ⭐ {product.rating?.toFixed(1) ?? 'N/A'} ({product.reviews?.length ?? 0} review
        {product.reviews?.length === 1 ? '' : 's'})
      </button>

      <button
        type="button"
        className="product-card__add-btn"
        onClick={() => onAddToCart(product)}
        disabled={addToCartState === 'loading'}
      >
        {addToCartState === 'loading' ? 'Adding…' : 'Add to Cart'}
      </button>
      {addToCartState === 'error' && (
        <p role="alert" className="product-card__error">
          Could not add item to cart. Please try again.
        </p>
      )}
    </li>
  )
}
