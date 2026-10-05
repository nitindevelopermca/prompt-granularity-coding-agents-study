// Product card: main image + thumbnail strip gallery, title, description,
// price/discount, rating/review control, brand, and Add to Cart.
// UX: spec/ux/ux-design-of-product-listing.png (card layout, thumbnail
// strip, price/discount styling).
// Fields: spec/apis_contract/02_Products_Reviews_API_Contract.docx.
//
// Add to Cart: spec/apis_contract/03_Add_To_Cart_API_Contract.docx
//   POST https://dummyjson.com/carts/add — on failure, keep existing valid
//   cart state and show an error (handled in CartContext + here).

import { useRef, useState } from 'react';
import type { Product, ProductReview } from '../types/product';
import { CartError } from '../api/cart';
import { useCart } from '../context/CartContext';
import { CartIcon, ImageOffIcon, StarIcon } from './icons';
import ReviewModal from './ReviewModal';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onCommentAdded: (productId: number, review: ProductReview) => void;
}

function galleryImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  return product.thumbnail ? [product.thumbnail] : [];
}

export default function ProductCard({ product, onCommentAdded }: ProductCardProps) {
  const { addToCart } = useCart();

  const images = galleryImages(product);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const ratingButtonRef = useRef<HTMLButtonElement>(null);

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const activeIndex = images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0;
  const activeImage = images[activeIndex];
  const activeImageBroken = Boolean(brokenImages[activeIndex]);

  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;
  const reviewCount = product.reviews?.length ?? 0;

  function markBroken(index: number) {
    setBrokenImages((previous) => ({ ...previous, [index]: true }));
  }

  function closeReviews() {
    setIsReviewsOpen(false);
    // Return focus to the control that opened the dialog.
    ratingButtonRef.current?.focus();
  }

  async function handleAddToCart() {
    setIsAddingToCart(true);
    setAddToCartError(null);
    try {
      await addToCart(product, 1);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      // Existing cart state is untouched by CartContext on failure; just
      // surface the error here.
      setAddToCartError(
        error instanceof CartError ? error.message : 'Failed to add item to cart. Please try again.',
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <li className={styles.card}>
      <div className={styles.mainImageWrapper}>
        {activeImage && !activeImageBroken ? (
          <img
            src={activeImage}
            alt={product.title}
            className={styles.mainImage}
            loading="lazy"
            onError={() => markBroken(activeIndex)}
          />
        ) : (
          <div className={styles.imageFallback}>
            <ImageOffIcon />
            <span>Image unavailable</span>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className={styles.thumbStrip} role="group" aria-label={`${product.title} images`}>
          {images.map((image, index) => (
            <button
              key={`${product.id}-${index}`}
              type="button"
              className={`${styles.thumbButton} ${index === activeIndex ? styles.thumbActive : ''}`}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setSelectedIndex(index)}
            >
              {brokenImages[index] ? (
                <ImageOffIcon width={18} height={18} />
              ) : (
                <img
                  src={image}
                  alt=""
                  className={styles.thumbImage}
                  loading="lazy"
                  onError={() => markBroken(index)}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}

      <h2 className={styles.title}>{product.title}</h2>
      <p className={styles.description}>{product.description}</p>

      <div className={styles.priceRow}>
        <span className={styles.price}>${discountedPrice.toFixed(2)}</span>
        {hasDiscount ? (
          <>
            <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
            <span className={styles.discountBadge}>{Math.round(product.discountPercentage)}% OFF</span>
          </>
        ) : null}
      </div>

      <button
        type="button"
        className={styles.ratingButton}
        aria-label={`${product.rating.toFixed(1)} out of 5 stars, ${reviewCount} review${
          reviewCount === 1 ? '' : 's'
        }. Open reviews.`}
        onClick={() => setIsReviewsOpen(true)}
        ref={ratingButtonRef}
      >
        <StarIcon />
        <span aria-hidden="true">{product.rating.toFixed(1)}</span>
        <span className={styles.reviewCount} aria-hidden="true">
          ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      </button>

      <p className={styles.brand}>Brand: {product.brand ?? 'Not specified'}</p>

      <button
        type="button"
        className={styles.addToCart}
        onClick={handleAddToCart}
        disabled={isAddingToCart}
        aria-busy={isAddingToCart}
      >
        <CartIcon width={18} height={18} />
        {isAddingToCart ? 'Adding…' : justAdded ? 'Added to Cart' : 'Add to Cart'}
      </button>
      {addToCartError ? (
        <p className={styles.addToCartError} role="alert">
          {addToCartError}
        </p>
      ) : null}

      {isReviewsOpen ? (
        <ReviewModal product={product} onClose={closeReviews} onCommentAdded={onCommentAdded} />
      ) : null}
    </li>
  );
}
