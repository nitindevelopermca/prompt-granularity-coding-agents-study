import { useId, useMemo, useState } from 'react'
import { CartRequestError } from '../api/cart'
import { useCart } from '../cart/CartContext'
import type { Product } from '../types/product'
import { CartIcon } from './Icons'
import { StarRating } from './StarRating'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  reviewsOpen?: boolean
  onOpenReviews: () => void
}

function uniqueImages(urls: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const next: string[] = []
  for (const url of urls) {
    if (!url || seen.has(url)) {
      continue
    }
    seen.add(url)
    next.push(url)
  }
  return next
}

function originalPrice(price: number, discountPercentage: number): number | undefined {
  if (!(discountPercentage > 0) || discountPercentage >= 100) {
    return undefined
  }
  return price / (1 - discountPercentage / 100)
}

export function ProductCard({ product, reviewsOpen = false, onOpenReviews }: ProductCardProps) {
  const { addProduct } = useCart()
  const addErrorId = useId()
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const strip = useMemo(() => {
    const images = uniqueImages(product.images ?? [])
    if (images.length > 0) {
      return images
    }
    return uniqueImages([product.thumbnail])
  }, [product.images, product.thumbnail])

  const initialMain = product.thumbnail || strip[0]
  const [mainSrc, setMainSrc] = useState(initialMain)
  const [failed, setFailed] = useState<Record<string, true>>({})

  const usableMain = mainSrc && !failed[mainSrc] ? mainSrc : strip.find((src) => !failed[src])
  const usableStrip = strip.filter((src) => !failed[src])
  const price = typeof product.price === 'number' ? product.price : 0
  const discount = typeof product.discountPercentage === 'number' ? product.discountPercentage : 0
  const rating = typeof product.rating === 'number' ? product.rating : 0
  const reviewCount = product.reviews?.length ?? 0
  const brand = product.brand?.trim() || 'Not specified'
  const was = originalPrice(price, discount)

  async function handleAddToCart() {
    if (isAdding) {
      return
    }

    setIsAdding(true)
    setAddError(null)

    try {
      await addProduct(
        {
          id: product.id,
          title: product.title,
          price,
          thumbnail: product.thumbnail || product.images?.[0],
        },
        1,
      )
    } catch (error) {
      setAddError(
        error instanceof CartRequestError
          ? error.message
          : 'Unable to add this item to your cart. Your cart is unchanged.',
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-card-media">
        {usableMain ? (
          <img
            className="product-card-photo"
            src={usableMain}
            alt={product.title}
            onError={() => {
              setFailed((current) => (usableMain ? { ...current, [usableMain]: true } : current))
            }}
          />
        ) : (
          <div className="product-card-photo-fallback">No image available</div>
        )}

        {usableStrip.length > 0 ? (
          <ul className="product-thumbs">
            {usableStrip.map((src, index) => {
              const selected = src === usableMain
              return (
                <li key={src}>
                  <button
                    type="button"
                    className={selected ? 'is-selected' : undefined}
                    aria-label={`Image ${index + 1} of ${usableStrip.length}`}
                    aria-pressed={selected}
                    onClick={() => setMainSrc(src)}
                  >
                    <img
                      src={src}
                      alt=""
                      onError={() => {
                        setFailed((current) => ({ ...current, [src]: true }))
                      }}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <div className="product-card-body">
        <h2>{product.title}</h2>
        {product.description ? <p className="product-card-copy">{product.description}</p> : null}

        <div className="product-card-price">
          <span className="product-card-now">${price.toFixed(2)}</span>
          {was ? <s className="product-card-was">${was.toFixed(2)}</s> : null}
          {discount > 0 ? (
            <span className="product-card-off">{Math.round(discount)}% OFF</span>
          ) : null}
        </div>

        <button
          type="button"
          className="product-card-reviews"
          aria-haspopup="dialog"
          aria-expanded={reviewsOpen}
          aria-label={`${rating.toFixed(1)} out of 5, ${reviewCount} reviews`}
          onClick={onOpenReviews}
        >
          <StarRating value={rating} />
          <span>
            {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </button>

        <p className="product-card-brand">Brand: {brand}</p>

        {addError ? (
          <p id={addErrorId} className="product-card-add-error" role="alert">
            {addError}
          </p>
        ) : null}

        <button
          type="button"
          className="product-card-add"
          disabled={isAdding}
          aria-busy={isAdding}
          aria-describedby={addError ? addErrorId : undefined}
          onClick={() => {
            void handleAddToCart()
          }}
        >
          <CartIcon />
          {isAdding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}
