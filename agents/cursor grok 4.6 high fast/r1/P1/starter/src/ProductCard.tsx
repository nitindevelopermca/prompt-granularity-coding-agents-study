import { useMemo, useState } from 'react'
import { addToCartRequest, isNetworkError } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { brandLabel, formatMoney, galleryImages, originalPrice } from './format'
import { CartIcon } from './icons'
import { ProductImage } from './ProductImage'
import { Stars } from './Stars'
import type { Product } from './types'

type ProductCardProps = {
  product: Product
  onOpenReviews: (product: Product) => void
}

export function ProductCard({ product, onOpenReviews }: ProductCardProps) {
  const { session } = useAuth()
  const { addItem } = useCart()
  const images = useMemo(() => galleryImages(product), [product])
  const [activeImage, setActiveImage] = useState(product.thumbnail || images[0] || '')
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState('')

  const reviewCount = product.reviews?.length ?? 0
  const listPrice = originalPrice(product.price, product.discountPercentage)
  const discount = Math.round(product.discountPercentage)

  async function handleAddToCart() {
    if (!session) {
      return
    }
    setAdding(true)
    setCartError('')
    try {
      await addToCartRequest(session.id, product.id, 1)
      addItem(product, 1)
    } catch (error) {
      setCartError(
        isNetworkError(error)
          ? 'Network error. The cart was not changed.'
          : error instanceof Error
            ? error.message
            : 'Unable to add item to cart',
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card">
      <div className="product-media">
        <ProductImage
          className="product-main-image"
          src={activeImage}
          alt={product.title}
        />
        {images.length > 0 ? (
          <ul className="thumb-strip">
            {images.map((src, index) => {
              const selected = src === activeImage
              return (
                <li key={`${product.id}-${src}-${index}`}>
                  <button
                    type="button"
                    className={selected ? 'thumb is-selected' : 'thumb'}
                    onClick={() => setActiveImage(src)}
                    aria-label={`Image ${index + 1} of ${images.length}`}
                    aria-pressed={selected}
                  >
                    <ProductImage src={src} alt="" className="thumb-image" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <h2 className="product-title">{product.title}</h2>
      <p className="product-desc">{product.description}</p>

      <div className="product-pricing">
        <span className="price-current">{formatMoney(product.price)}</span>
        {listPrice ? <span className="price-original">{formatMoney(listPrice)}</span> : null}
        {discount > 0 ? <span className="discount-badge">{discount}% OFF</span> : null}
      </div>

      <button
        type="button"
        className="review-trigger"
        onClick={() => onOpenReviews(product)}
        aria-haspopup="dialog"
      >
        <Stars value={product.rating} />
        <span>
          {product.rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </button>

      <p className="product-brand">{brandLabel(product)}</p>

      {cartError ? (
        <p className="field-error" role="alert">
          {cartError}
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleAddToCart}
        disabled={adding}
      >
        <CartIcon className="btn-icon" />
        {adding ? 'Adding…' : 'Add to Cart'}
      </button>
    </article>
  )
}
