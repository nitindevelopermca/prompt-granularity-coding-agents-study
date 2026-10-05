// Product card for the catalog grid.
// Renders the full card per spec/ux/ux-design-of-product-listing.png:
// main image + thumbnail strip, title, description, price/discount,
// a rating/review control that opens the review modal, brand (with
// fallback), and a visible Add to Cart button.
//
import { useRef, useState } from 'react';
import { CartError } from '../api/cartApi';
import { useCart } from '../context/useCart';
import type { Product, ProductReview } from '../types/product';
import { CartIcon } from './icons';
import ReviewModal from './ReviewModal';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onReviewAdded: (productId: number, review: ProductReview) => void;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Gallery of image URLs to show, falling back to `thumbnail` if `images` is empty. */
function buildGallery(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  return product.thumbnail ? [product.thumbnail] : [];
}

const GENERIC_CART_ERROR = 'Unable to add this item to your cart right now. Please try again.';

export default function ProductCard({ product, onReviewAdded }: ProductCardProps) {
  const { addProduct } = useCart();
  const gallery = buildGallery(product);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(() => new Set());
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const cartErrorRef = useRef<HTMLParagraphElement>(null);

  const hasDiscount = product.discountPercentage > 0;
  const originalPrice = hasDiscount ? product.price / (1 - product.discountPercentage / 100) : null;
  const reviewCount = product.reviews?.length ?? 0;
  const brand = product.brand?.trim() ? product.brand : 'Brand not available';

  const currentUrl = gallery[selectedIndex];
  const mainImageAvailable = Boolean(currentUrl) && !brokenImages.has(selectedIndex);

  function markBroken(index: number) {
    setBrokenImages((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        {mainImageAvailable ? (
          <img
            src={currentUrl}
            alt={product.title}
            className="product-card-image"
            loading="lazy"
            onError={() => markBroken(selectedIndex)}
          />
        ) : (
          <div className="product-card-image-fallback">Image not available</div>
        )}
      </div>

      {gallery.length > 0 && (
        <div className="product-card-thumbnails" role="group" aria-label={`${product.title} photos`}>
          {gallery.map((url, index) => {
            const isActive = index === selectedIndex;
            const isBroken = brokenImages.has(index);
            return (
              <button
                key={`${product.id}-${index}`}
                type="button"
                className={`product-card-thumb${isActive ? ' product-card-thumb-active' : ''}`}
                aria-label={`Image ${index + 1} of ${gallery.length}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setSelectedIndex(index)}
              >
                {isBroken ? (
                  <span className="product-card-thumb-fallback" aria-hidden="true">
                    ⚠
                  </span>
                ) : (
                  <img
                    src={url}
                    alt=""
                    className="product-card-thumb-image"
                    loading="lazy"
                    onError={() => markBroken(index)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <h2 className="product-card-title">{product.title}</h2>
      <p className="product-card-description">{product.description}</p>

      <p className="product-card-price-row">
        <span className="product-card-price">{formatPrice(product.price)}</span>
        {hasDiscount && originalPrice !== null && (
          <>
            <span className="product-card-price-original">{formatPrice(originalPrice)}</span>
            <span className="product-card-discount">{Math.round(product.discountPercentage)}% off</span>
          </>
        )}
      </p>

      <button
        type="button"
        className="product-card-rating"
        aria-haspopup="dialog"
        aria-expanded={isReviewsOpen}
        onClick={() => setIsReviewsOpen(true)}
      >
        <span aria-hidden="true">★</span>
        <span className="visually-hidden">Rating: </span>
        {product.rating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
      </button>

      <p className="product-card-brand">Brand: {brand}</p>

      {cartError && (
        <p className="product-card-cart-error" role="alert" tabIndex={-1} ref={cartErrorRef}>
          {cartError}
        </p>
      )}

      <button
        type="button"
        className="product-card-add-to-cart"
        aria-label={`Add to Cart, ${product.title}`}
        disabled={isAddingToCart}
        aria-busy={isAddingToCart}
        onClick={() => {
          void (async () => {
            setIsAddingToCart(true);
            setCartError(null);
            try {
              await addProduct(product, 1);
            } catch (error) {
              setCartError(error instanceof CartError ? error.message : GENERIC_CART_ERROR);
              requestAnimationFrame(() => cartErrorRef.current?.focus());
            } finally {
              setIsAddingToCart(false);
            }
          })();
        }}
      >
        <CartIcon className="product-card-add-to-cart-icon" />
        {isAddingToCart ? 'Adding…' : 'Add to Cart'}
      </button>

      {isReviewsOpen && (
        <ReviewModal product={product} onClose={() => setIsReviewsOpen(false)} onReviewAdded={onReviewAdded} />
      )}
    </article>
  );
}
