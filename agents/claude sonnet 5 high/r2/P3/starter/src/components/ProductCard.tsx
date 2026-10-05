import { useMemo, useState } from 'react'
import type { Product, Review } from '../types'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { StarRating } from './StarRating'
import { ReviewModal } from './ReviewModal'
import { CartIcon, ImageOffIcon } from './icons'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  onReviewAdded: (productId: number, review: Review) => void
}

export function ProductCard({ product, onReviewAdded }: ProductCardProps) {
  const { user } = useAuth()
  const { addItem, pendingProductId } = useCart()

  const images = useMemo(
    () => (product.images && product.images.length > 0 ? product.images : [product.thumbnail]).filter(Boolean),
    [product.images, product.thumbnail],
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const [mainImageFailed, setMainImageFailed] = useState(false)
  const [brokenThumbs, setBrokenThumbs] = useState<Record<number, boolean>>({})
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [addedFlash, setAddedFlash] = useState(false)

  const activeImageSrc = images[activeIndex]
  const isAdding = pendingProductId === product.id

  const hasDiscount = product.discountPercentage > 0
  const discountedPrice = hasDiscount ? product.price * (1 - product.discountPercentage / 100) : product.price

  async function handleAddToCart() {
    if (!user) return
    await addItem(product, user.id, 1)
    setAddedFlash(true)
    window.setTimeout(() => setAddedFlash(false), 1500)
  }

  function handleReviewAdded(review: Review) {
    onReviewAdded(product.id, review)
  }

  return (
    <li className="product-card">
      <div className="product-card__image-wrap">
        {!mainImageFailed && activeImageSrc ? (
          <img
            className="product-card__image"
            src={activeImageSrc}
            alt={product.title}
            loading="lazy"
            onError={() => setMainImageFailed(true)}
          />
        ) : (
          <div className="product-card__image-fallback" role="img" aria-label={`${product.title} image unavailable`}>
            <ImageOffIcon />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="product-card__thumbs" role="group" aria-label={`${product.title} image gallery`}>
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className={
                index === activeIndex ? 'product-card__thumb product-card__thumb--active' : 'product-card__thumb'
              }
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              onClick={() => {
                setActiveIndex(index)
                setMainImageFailed(false)
              }}
            >
              {brokenThumbs[index] ? (
                <span className="product-card__thumb-fallback" aria-hidden="true">
                  <ImageOffIcon />
                </span>
              ) : (
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  onError={() => setBrokenThumbs((prev) => ({ ...prev, [index]: true }))}
                />
              )}
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
        className="product-card__reviews-btn"
        onClick={() => setIsReviewOpen(true)}
        aria-haspopup="dialog"
      >
        <StarRating rating={product.rating} />
        <span className="product-card__reviews-text">
          {product.rating.toFixed(1)} ({product.reviews.length} review{product.reviews.length === 1 ? '' : 's'})
        </span>
      </button>

      <p className="product-card__brand">Brand: {product.brand?.trim() ? product.brand : 'Generic'}</p>

      <button
        type="button"
        className="product-card__add-btn"
        onClick={handleAddToCart}
        disabled={isAdding || !user}
      >
        <CartIcon />
        {isAdding ? 'Adding…' : addedFlash ? 'Added to Cart' : 'Add to Cart'}
      </button>

      {isReviewOpen && user && (
        <ReviewModal
          product={product}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          userId={user.id}
          onReviewAdded={handleReviewAdded}
        />
      )}
    </li>
  )
}
