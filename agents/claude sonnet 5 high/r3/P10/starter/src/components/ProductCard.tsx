import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { addToCartApi, CartApiError } from '../lib/cartApi'
import type { Product } from '../types/product'

interface ProductCardProps {
  product: Product
  onOpenReviews: (product: Product) => void
}

export default function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const images = product.images && product.images.length > 0 ? product.images : product.thumbnail ? [product.thumbnail] : []

  const { user } = useAuth()
  const { addItem } = useCart()

  const [activeIndex, setActiveIndex] = useState(0)
  const [mainImageFailed, setMainImageFailed] = useState(false)
  const [failedThumbs, setFailedThumbs] = useState<Record<number, boolean>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)

  const mainImage = images[activeIndex]
  const reviewCount = product.reviews?.length ?? 0
  const rating = typeof product.rating === 'number' ? product.rating : null

  const hasDiscount = typeof product.discountPercentage === 'number' && product.discountPercentage > 0
  const originalPrice = hasDiscount ? product.price / (1 - (product.discountPercentage as number) / 100) : null

  async function handleAddToCart() {
    if (!user) {
      setAddError('Please log in to add items to your cart.')
      return
    }
    setIsAdding(true)
    setAddError(null)
    try {
      await addToCartApi(user.id, product.id, 1)
      addItem(
        { productId: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail },
        1,
      )
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 1500)
    } catch (err) {
      // Keep existing cart state on failure; just surface the error.
      setAddError(err instanceof CartApiError ? err.message : 'Failed to add to cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {mainImage && !mainImageFailed ? (
          <img
            src={mainImage}
            alt={product.title}
            onError={() => setMainImageFailed(true)}
          />
        ) : (
          <div className="product-image-fallback">Image not available</div>
        )}
      </div>

      {images.length > 0 && (
        <div className="thumbnail-strip" role="group" aria-label={`${product.title} images`}>
          {images.map((src, index) => (
            <button
              key={`${product.id}-${index}`}
              type="button"
              className={`thumbnail-button${index === activeIndex ? ' is-active' : ''}`}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => {
                setActiveIndex(index)
                setMainImageFailed(false)
              }}
            >
              {!failedThumbs[index] ? (
                <img
                  src={src}
                  alt=""
                  onError={() => setFailedThumbs((prev) => ({ ...prev, [index]: true }))}
                />
              ) : (
                <span className="thumbnail-fallback" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}

      <h3 className="product-title">{product.title}</h3>
      <p className="product-description">{product.description}</p>

      <div className="product-price-row">
        <span className="product-price">${product.price.toFixed(2)}</span>
        {hasDiscount && originalPrice && (
          <>
            <span className="product-price-original">${originalPrice.toFixed(2)}</span>
            <span className="product-discount-badge">{Math.round(product.discountPercentage as number)}% Off</span>
          </>
        )}
      </div>

      <button type="button" className="product-rating-button" onClick={() => onOpenReviews(product)}>
        <span aria-hidden="true">★</span>
        <span>
          {rating !== null ? rating.toFixed(1) : 'No rating'} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      </button>

      <p className="product-brand">Brand: {product.brand?.trim() ? product.brand : 'Unknown'}</p>

      <button type="button" className="add-to-cart-button" onClick={handleAddToCart} disabled={isAdding}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"
          />
        </svg>
        {isAdding ? 'Adding…' : justAdded ? 'Added to Cart' : 'Add to Cart'}
      </button>
      {addError && (
        <p className="field-error" role="alert">
          {addError}
        </p>
      )}
    </article>
  )
}
