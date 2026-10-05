// Product card: main image + thumbnail strip, title/description/price,
// discount, rating/review control, brand (with fallback), and a full-width
// Add to Cart button. Fields per spec/apis_contract/ and spec/SPEC_FREEZE.md.

import { useState } from 'react';
import type { Product, Review } from '../api/types';
import { useCart } from '../context/CartContext';
import ReviewModal from './ReviewModal';
import { CartIcon, StarIcon } from './Icons';

type ProductCardProps = {
  product: Product;
  onCommentAdded: (productId: number, review: Review) => void;
};

export default function ProductCard({ product, onCommentAdded }: ProductCardProps) {
  const { addItem } = useCart();

  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail].filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState('');
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const mainImage = images[selectedIndex] ?? product.thumbnail;
  const hasDiscount = product.discountPercentage > 0;
  const originalPrice = hasDiscount ? product.price / (1 - product.discountPercentage / 100) : product.price;
  const reviewCount = product.reviews?.length ?? 0;
  const brand = product.brand && product.brand.trim() ? product.brand : 'Unbranded';

  const handleThumbClick = (index: number) => {
    setSelectedIndex(index);
    setImageFailed(false);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    setAddError(null);
    setAddedMessage('');
    try {
      await addItem(product, 1);
      setAddedMessage(`${product.title} added to cart.`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add this item to the cart.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        {!imageFailed && mainImage ? (
          <img
            src={mainImage}
            alt={product.title}
            className="product-card__image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="product-card__image-fallback">Image unavailable</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="product-card__thumbs" role="group" aria-label={`${product.title} photos`}>
          {images.map((src, index) => (
            <button
              key={`${product.id}-thumb-${index}`}
              type="button"
              className={`product-card__thumb${index === selectedIndex ? ' is-selected' : ''}`}
              aria-label={`Image ${index + 1} of ${images.length}`}
              aria-pressed={index === selectedIndex}
              onClick={() => handleThumbClick(index)}
            >
              <img
                src={src}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden';
                }}
              />
            </button>
          ))}
        </div>
      )}

      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__description">{product.description}</p>

      <div className="product-card__price-row">
        <span className="product-card__price">${product.price.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="product-card__price-original">${originalPrice.toFixed(2)}</span>
            <span className="product-card__discount-badge">{Math.round(product.discountPercentage)}% off</span>
          </>
        )}
      </div>

      <button type="button" className="product-card__rating" onClick={() => setReviewsOpen(true)}>
        <StarIcon filled aria-hidden="true" />
        <span>
          {product.rating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      </button>

      <p className="product-card__brand">Brand: {brand}</p>

      <button type="button" className="btn btn-primary btn-block" onClick={handleAddToCart} disabled={isAdding}>
        <CartIcon aria-hidden="true" />
        {isAdding ? 'Adding…' : 'Add to Cart'}
      </button>

      <p className="sr-only" role="status">
        {addedMessage}
      </p>
      {addError && (
        <p role="alert" className="field-error">
          {addError}
        </p>
      )}

      {reviewsOpen && (
        <ReviewModal
          product={product}
          onClose={() => setReviewsOpen(false)}
          onCommentAdded={(review) => onCommentAdded(product.id, review)}
        />
      )}
    </article>
  );
}
