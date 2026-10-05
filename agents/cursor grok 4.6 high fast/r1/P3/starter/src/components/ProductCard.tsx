import { useId, useState } from 'react'
import { CartRequestError } from '../api/cart'
import { useCart } from '../cart/CartContext'
import type { Product } from '../types/product'
import { CartIcon } from './Icons'
import { StarRating, formatPrice, originalPrice } from './productDisplay'
import './ProductCard.css'

type ProductCardProps = {
  product: Product
  onOpenReviews: () => void
}

function galleryFor(product: Product): string[] {
  if (product.images.length > 0) {
    return product.images
  }
  return product.thumbnail ? [product.thumbnail] : []
}

export function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const { addProduct } = useCart()
  const gallery = galleryFor(product)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [failedUrls, setFailedUrls] = useState<Record<string, true>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const addErrorId = useId()

  const usableGallery = gallery.filter((url) => !failedUrls[url])
  const selectedUrl = gallery[selectedIndex]
  const mainCandidate =
    selectedUrl && !failedUrls[selectedUrl]
      ? selectedUrl
      : (usableGallery[0] ??
        (product.thumbnail && !failedUrls[product.thumbnail] ? product.thumbnail : null))

  const reviewCount = product.reviews.length
  const reviewLabel =
    reviewCount === 1
      ? `${product.rating.toFixed(1)} out of 5, 1 review. Open reviews.`
      : `${product.rating.toFixed(1)} out of 5, ${reviewCount} reviews. Open reviews.`

  const prior = originalPrice(product.price, product.discountPercentage)
  const brandLabel = product.brand ?? 'Unknown'

  function markFailed(url: string) {
    setFailedUrls((current) => (current[url] ? current : { ...current, [url]: true }))
  }

  async function handleAddToCart() {
    if (isAdding) {
      return
    }
    setIsAdding(true)
    setAddError(null)
    try {
      await addProduct(product)
    } catch (error) {
      if (error instanceof CartRequestError) {
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
      <div className="product-card-media">
        {mainCandidate ? (
          <img
            className="product-card-main-image"
            src={mainCandidate}
            alt={product.title}
            onError={() => markFailed(mainCandidate)}
          />
        ) : (
          <div className="product-card-image-fallback" role="img" aria-label={`${product.title}, image unavailable`}>
            Image unavailable
          </div>
        )}

        {usableGallery.length > 0 ? (
          <ul className="product-card-thumbs">
            {usableGallery.map((url, index) => {
              const selected = url === mainCandidate
              return (
                <li key={url}>
                  <button
                    type="button"
                    className={selected ? 'is-selected' : undefined}
                    aria-label={`Image ${index + 1} of ${usableGallery.length}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedIndex(gallery.indexOf(url))}
                  >
                    <img src={url} alt="" onError={() => markFailed(url)} />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <h2 className="product-card-title">{product.title}</h2>
      <p className="product-card-description">{product.description}</p>

      <p className="product-card-price">
        <span className="product-card-sale">{formatPrice(product.price)}</span>
        {prior ? <span className="product-card-original">{formatPrice(prior)}</span> : null}
        {product.discountPercentage > 0 ? (
          <span className="product-card-discount">{Math.round(product.discountPercentage)}% OFF</span>
        ) : null}
      </p>

      <button
        type="button"
        className="product-card-reviews"
        onClick={onOpenReviews}
        aria-haspopup="dialog"
        aria-label={reviewLabel}
      >
        <StarRating value={product.rating} />
        <span>
          {product.rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </button>

      <p className="product-card-brand">Brand: {brandLabel}</p>

      <button
        type="button"
        className="product-card-add"
        onClick={() => void handleAddToCart()}
        disabled={isAdding}
        aria-describedby={addError ? addErrorId : undefined}
      >
        <CartIcon className="product-card-add-icon" />
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>
      {addError ? (
        <p id={addErrorId} className="product-card-add-error" role="alert">
          {addError}
        </p>
      ) : null}
    </article>
  )
}
