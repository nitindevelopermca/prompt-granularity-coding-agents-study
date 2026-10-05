import { useState } from 'react'
import { ProductImage } from './ProductImage'
import type { Product } from './types'

type ProductCardProps = {
  product: Product
  onOpenReviews: (product: Product) => void
  onAddToCart: (product: Product) => void
  adding: boolean
  addError: string
}

export function ProductCard({ product, onOpenReviews, onAddToCart, adding, addError }: ProductCardProps) {
  const thumbs = product.images
  const initialMain = product.thumbnail ?? thumbs[0]
  const [mainSrc, setMainSrc] = useState(initialMain)
  const brand = product.brand ?? 'Unknown brand'
  const reviewCount = product.reviews.length
  const reviewLabel = `${product.title}, rated ${product.rating.toFixed(1)} out of 5, ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`

  return (
    <article className="product-card">
      <div className="product-card-media">
        <ProductImage className="product-card-main-image" src={mainSrc} alt={product.title} />
        {thumbs.length > 0 ? (
          <ul className="product-thumbs">
            {thumbs.map((src, index) => {
              const selected = src === mainSrc
              return (
                <li key={`${product.id}-thumb-${index}`}>
                  <button
                    type="button"
                    className={selected ? 'product-thumb is-selected' : 'product-thumb'}
                    aria-label={`Image ${index + 1} of ${thumbs.length}`}
                    aria-pressed={selected}
                    onClick={() => setMainSrc(src)}
                  >
                    <ProductImage src={src} alt="" decorative />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <div className="product-card-body">
        <h2 className="product-card-title">{product.title}</h2>
        <p className="product-card-description">{product.description || 'No description available.'}</p>
        <p className="product-card-brand">{brand}</p>
        <p className="product-card-pricing">
          <span className="product-card-price">${product.price.toFixed(2)}</span>
          <span className="product-card-discount">{product.discountPercentage.toFixed(2)}% off</span>
        </p>
        <button
          type="button"
          className="product-card-reviews"
          aria-haspopup="dialog"
          aria-label={reviewLabel}
          onClick={() => onOpenReviews(product)}
        >
          <span aria-hidden="true">★ {product.rating.toFixed(1)}</span>
          <span>
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </button>
        {addError ? (
          <p className="field-error" role="alert">
            {addError}
          </p>
        ) : null}
        <button
          type="button"
          className="product-card-cart"
          disabled={adding}
          aria-busy={adding}
          onClick={() => onAddToCart(product)}
        >
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}
