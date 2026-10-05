import { useMemo, useState } from 'react'
import type { Product } from '../types'
import { ImageOffIcon, StarIcon } from './icons'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: Product
  isAdding: boolean
  addError?: string | null
  onAddToCart: (product: Product) => void
  onOpenReviews: (product: Product) => void
}

export default function ProductCard({ product, isAdding, addError, onAddToCart, onOpenReviews }: ProductCardProps) {
  const images = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images
    if (product.thumbnail) return [product.thumbnail]
    return []
  }, [product.images, product.thumbnail])

  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set())

  const activeUrl = images[activeIndex]
  const mainImageBroken = !activeUrl || brokenUrls.has(activeUrl)

  const discount = product.discountPercentage > 0 ? product.discountPercentage : 0
  const finalPrice = Math.round(product.price * (1 - discount / 100) * 100) / 100
  const brand = product.brand?.trim() || 'Generic'
  const reviewCount = product.reviews?.length ?? 0

  function markBroken(url: string) {
    setBrokenUrls((prev) => new Set(prev).add(url))
  }

  return (
    <li className={styles.card}>
      <div className={styles.mainImageWrap}>
        {discount > 0 && <span className={styles.discountBadge}>-{Math.round(discount)}%</span>}
        {mainImageBroken ? (
          <div className={styles.imageFallback}>
            <ImageOffIcon width={32} height={32} />
            <span>Image unavailable</span>
          </div>
        ) : (
          <img
            src={activeUrl}
            alt={product.title}
            className={styles.mainImage}
            loading="lazy"
            onError={() => markBroken(activeUrl)}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbStrip} role="group" aria-label={`${product.title} thumbnails`}>
          {images.map((url, index) => (
            <button
              key={url + index}
              type="button"
              className={`${styles.thumbButton} ${index === activeIndex ? styles.thumbButtonActive : ''}`}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              {brokenUrls.has(url) ? (
                <ImageOffIcon width={16} height={16} />
              ) : (
                <img
                  src={url}
                  alt=""
                  className={styles.thumbImage}
                  loading="lazy"
                  onError={() => markBroken(url)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className={styles.body}>
        <span className={styles.brand}>{brand}</span>
        <h3 className={styles.title}>{product.title}</h3>
        <p className={styles.description}>{product.description}</p>

        <div className={styles.priceRow}>
          <span className={styles.price}>${finalPrice.toFixed(2)}</span>
          {discount > 0 && <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>}
        </div>

        <button
          type="button"
          className={styles.ratingButton}
          onClick={() => onOpenReviews(product)}
          aria-label={`View ${reviewCount} review${reviewCount === 1 ? '' : 's'} for ${product.title}, rated ${product.rating.toFixed(1)} out of 5`}
        >
          <StarIcon filled className={styles.star} width={16} height={16} />
          <span>{product.rating.toFixed(1)}</span>
          <span className={styles.reviewCount}>({reviewCount})</span>
        </button>

        <span className={styles.spacer} />

        {addError && <p className={styles.addToCartError} role="alert">{addError}</p>}

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onAddToCart(product)}
          disabled={isAdding}
          aria-label={`Add ${product.title} to cart`}
        >
          {isAdding && <span className="spinner" aria-hidden="true" />}
          <span>{isAdding ? 'Adding\u2026' : 'Add to Cart'}</span>
        </button>
      </div>
    </li>
  )
}
