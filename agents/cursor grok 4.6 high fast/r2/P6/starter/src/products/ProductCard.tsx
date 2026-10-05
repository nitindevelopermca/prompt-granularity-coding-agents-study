import { useMemo, useState } from 'react'
import { useCart } from '../cart/CartContext'
import { CartNetworkError, CartRequestError } from '../cart/types'
import type { Product } from './types'
import './ProductCard.css'

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function gallerySources(product: Product): string[] {
  if (product.images.length > 0) {
    return product.images
  }

  return product.thumbnail ? [product.thumbnail] : []
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg className={`product-star${filled ? ' is-filled' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.8 12.4 7l5.6.8-4 3.9.9 5.6L10 14.8 4.9 17.3l.9-5.6-4-3.9L7.6 7 10 1.8Z" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      <path
        d="M4.5 5h1.7l1.2 10.2a1.6 1.6 0 0 0 1.6 1.4h8.3a1.6 1.6 0 0 0 1.58-1.28L20 8.2H7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ProductCard({
  product,
  onOpenReviews,
}: {
  product: Product
  onOpenReviews: (product: Product) => void
}) {
  const strip = useMemo(() => gallerySources(product), [product])
  const initialMain = product.thumbnail || strip[0] || ''
  const [mainSrc, setMainSrc] = useState(initialMain)
  const [broken, setBroken] = useState<Record<string, true>>({})

  const usableStrip = strip.filter((src) => !broken[src])
  const displayMain = !mainSrc || broken[mainSrc] ? usableStrip[0] ?? '' : mainSrc
  const selectedThumb = usableStrip.includes(mainSrc) ? mainSrc : displayMain
  const reviewCount = product.reviews.length
  const roundedStars = Math.max(0, Math.min(5, Math.round(product.rating)))
  const salePrice = product.price
  const hasDiscount = product.discountPercentage > 0 && product.discountPercentage < 100
  const originalPrice = hasDiscount
    ? salePrice / (1 - product.discountPercentage / 100)
    : salePrice
  const brand = product.brand ?? 'Unknown brand'
  const { addProduct } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addNotice, setAddNotice] = useState('')

  function markBroken(src: string) {
    setBroken((current) => (current[src] ? current : { ...current, [src]: true }))
  }

  async function handleAddToCart() {
    setAddError('')
    setAddNotice('')
    setIsAdding(true)

    try {
      await addProduct(product, 1)
      setAddNotice(`${product.title} added to cart.`)
    } catch (error) {
      if (error instanceof CartNetworkError || error instanceof CartRequestError) {
        setAddError(error.message)
      } else {
        setAddError('Unable to add this item to your cart. Please try again.')
      }
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {displayMain ? (
          <img
            src={displayMain}
            alt={product.title}
            onError={() => markBroken(displayMain)}
          />
        ) : (
          <div className="product-image-fallback">No image available</div>
        )}
      </div>

      {strip.length > 0 ? (
        <ul className="product-thumbs" aria-label={`Images for ${product.title}`}>
          {strip.map((src, index) => {
            const isBroken = Boolean(broken[src])
            const isSelected = src === selectedThumb && !isBroken

            return (
              <li key={`${src}-${index}`}>
                <button
                  type="button"
                  className={`product-thumb${isSelected ? ' is-selected' : ''}${isBroken ? ' is-broken' : ''}`}
                  aria-label={`Image ${index + 1} of ${strip.length}`}
                  aria-pressed={isSelected}
                  disabled={isBroken}
                  onClick={() => {
                    setMainSrc(src)
                  }}
                >
                  {isBroken ? (
                    <span className="product-thumb-fallback" aria-hidden="true">
                      —
                    </span>
                  ) : (
                    <img
                      src={src}
                      alt=""
                      onError={() => markBroken(src)}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      <h2>{product.title}</h2>
      {product.description ? <p className="product-description">{product.description}</p> : null}

      <div className="product-pricing">
        <p className="product-price">{formatPrice(salePrice)}</p>
        {hasDiscount ? (
          <>
            <p className="product-price-original">{formatPrice(originalPrice)}</p>
            <p className="product-discount">{product.discountPercentage.toFixed(0)}% OFF</p>
          </>
        ) : null}
      </div>

      <button
        type="button"
        className="product-reviews"
        aria-haspopup="dialog"
        aria-label={`${product.title} rating ${product.rating.toFixed(1)} out of 5 from ${reviewCount} reviews`}
        onClick={() => onOpenReviews(product)}
      >
        <span className="product-stars" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} filled={index < roundedStars} />
          ))}
        </span>
        <span>
          {product.rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </button>

      <p className="product-brand">Brand: {brand}</p>

      <button
        type="button"
        className="product-add-to-cart"
        onClick={() => void handleAddToCart()}
        disabled={isAdding}
        aria-busy={isAdding}
      >
        <CartIcon />
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
      {addError ? (
        <p className="product-cart-error" role="alert">
          {addError}
        </p>
      ) : null}
      {addNotice ? (
        <p className="product-cart-notice" role="status">
          {addNotice}
        </p>
      ) : null}
    </article>
  )
}
