import { useState } from 'react'
import { CartIcon } from './icons'
import { formatMoney, originalPrice } from './format'
import { ProductImage } from './ProductImage'
import { Stars } from './Stars'
import type { Product } from './types'

type ProductCardProps = {
  product: Product
  adding: boolean
  addError: string
  onOpenReviews: () => void
  onAddToCart: () => void
}

export function ProductCard({
  product,
  adding,
  addError,
  onOpenReviews,
  onAddToCart,
}: ProductCardProps) {
  const gallery = product.images.length > 0 ? product.images : product.thumbnail ? [product.thumbnail] : []
  const [activeImage, setActiveImage] = useState(product.thumbnail || gallery[0] || '')
  const reviewCount = product.reviews.length
  const listPrice = originalPrice(product.price, product.discountPercentage)

  return (
    <article className="product-card">
      <ProductImage
        key={activeImage}
        className="product-main-image"
        src={activeImage}
        alt={product.title}
      />
      {gallery.length > 0 ? (
        <ul className="thumb-strip">
          {gallery.map((src, index) => {
            const selected = src === activeImage
            return (
              <li key={`${product.id}-${src}-${index}`}>
                <button
                  type="button"
                  className={selected ? 'thumb selected' : 'thumb'}
                  aria-label={`Image ${index + 1} of ${gallery.length}`}
                  aria-pressed={selected}
                  onClick={() => setActiveImage(src)}
                >
                  <ProductImage src={src} alt="" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
      <h2 className="product-title">{product.title}</h2>
      <p className="product-description">{product.description || 'No description available.'}</p>
      <div className="price-row">
        <span className="price">{formatMoney(product.price)}</span>
        {product.discountPercentage > 0 ? (
          <>
            <span className="price-original">{formatMoney(listPrice)}</span>
            <span className="discount-badge">{Math.round(product.discountPercentage)}% OFF</span>
          </>
        ) : null}
      </div>
      <button type="button" className="review-trigger" onClick={onOpenReviews}>
        <Stars value={product.rating} />
        <span>
          {product.rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </button>
      <p className="product-brand">Brand: {product.brand ?? 'Not available'}</p>
      <button
        type="button"
        className="button-primary button-full add-cart"
        onClick={onAddToCart}
        disabled={adding}
      >
        <CartIcon className="icon-sm" />
        {adding ? 'Adding…' : 'Add to Cart'}
      </button>
      {addError ? (
        <p className="field-error" role="alert">
          {addError}
        </p>
      ) : null}
    </article>
  )
}
