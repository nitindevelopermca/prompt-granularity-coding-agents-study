import { useMemo, useState } from 'react'
import { addProductToCart, CartRequestError } from '../api/cart'
import type { CatalogProduct } from '../api/products'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import './ProductCard.css'

type ProductCardProps = {
  product: CatalogProduct
  onOpenReviews: (product: CatalogProduct, trigger: HTMLButtonElement) => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function gallerySources(product: CatalogProduct): string[] {
  if (product.images.length > 0) return product.images
  if (product.thumbnail !== '') return [product.thumbnail]
  return []
}

function initialMainSrc(product: CatalogProduct): string {
  if (product.thumbnail !== '') return product.thumbnail
  if (product.images[0]) return product.images[0]
  return ''
}

function StarRating({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)))
  return <span className="product-card-stars" aria-hidden="true">{`${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`}</span>
}

export function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const { session } = useAuth()
  const { addItem } = useCart()
  const sources = useMemo(() => gallerySources(product), [product])
  const [mainSrc, setMainSrc] = useState(() => initialMainSrc(product))
  const [failedSrcs, setFailedSrcs] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState('')

  const mainFailed = mainSrc === '' || failedSrcs.includes(mainSrc)
  const brandLabel = product.brand ?? 'Unknown brand'
  const reviewCount = product.reviews.length
  const reviewLabel =
    reviewCount === 1
      ? `Reviews for ${product.title}, rated ${product.rating} out of 5, 1 review`
      : `Reviews for ${product.title}, rated ${product.rating} out of 5, ${reviewCount} reviews`

  function handleMainError() {
    if (mainSrc === '') return

    setFailedSrcs((current) => (current.includes(mainSrc) ? current : [...current, mainSrc]))
    const next = sources.find((src) => src !== mainSrc && !failedSrcs.includes(src))
    if (next) {
      setMainSrc(next)
    }
  }

  function handleThumbError(src: string) {
    setFailedSrcs((current) => (current.includes(src) ? current : [...current, src]))
  }

  async function handleAddToCart() {
    if (!session) {
      setCartError('You must be signed in to add items to your cart.')
      return
    }

    setAdding(true)
    setCartError('')

    try {
      await addProductToCart(session.id, product.id, 1)
      addItem(product, 1)
    } catch (caught) {
      setCartError(
        caught instanceof CartRequestError
          ? caught.message
          : 'Unable to add this item to your cart. Please try again.',
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-card-media">
        <div className="product-card-main">
          {mainFailed ? (
            <div className="product-card-fallback" role="img" aria-label={`No image available for ${product.title}`}>
              No image available
            </div>
          ) : (
            <img src={mainSrc} alt={product.title} onError={handleMainError} />
          )}
        </div>

        {sources.length > 0 ? (
          <ul className="product-card-thumbs">
            {sources.map((src, index) => {
              const thumbFailed = failedSrcs.includes(src)
              const selected = src === mainSrc && !mainFailed

              return (
                <li key={`${product.id}-${src}-${index}`}>
                  <button
                    type="button"
                    aria-label={`Image ${index + 1} of ${sources.length}`}
                    aria-pressed={selected}
                    onClick={() => {
                      setFailedSrcs((current) => current.filter((item) => item !== src))
                      setMainSrc(src)
                    }}
                  >
                    {thumbFailed ? (
                      <span className="product-card-thumb-fallback" aria-hidden="true" />
                    ) : (
                      <img src={src} alt="" onError={() => handleThumbError(src)} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <h2>{product.title}</h2>
      {product.description ? <p className="product-card-description">{product.description}</p> : null}

      <div className="product-card-price-row">
        <p className="product-card-price">{formatPrice(product.price)}</p>
        {product.discountPercentage > 0 ? (
          <p className="product-card-discount">{product.discountPercentage.toFixed(1)}% off</p>
        ) : null}
      </div>

      <button
        type="button"
        className="product-card-reviews"
        aria-label={reviewLabel}
        aria-haspopup="dialog"
        onClick={(event) => onOpenReviews(product, event.currentTarget)}
      >
        <StarRating value={product.rating} />
        <span>
          {product.rating.toFixed(1)}
          {reviewCount > 0 ? ` (${reviewCount})` : ''}
        </span>
      </button>

      <p className="product-card-brand">{brandLabel}</p>

      {cartError ? (
        <p id={`cart-error-${product.id}`} className="product-card-cart-error" role="alert">
          {cartError}
        </p>
      ) : null}

      <button
        type="button"
        className="product-card-cart"
        aria-label={`Add ${product.title} to cart`}
        aria-busy={adding}
        aria-describedby={cartError ? `cart-error-${product.id}` : undefined}
        disabled={adding}
        onClick={() => void handleAddToCart()}
      >
        {adding ? 'Adding…' : 'Add to Cart'}
      </button>
    </article>
  )
}
