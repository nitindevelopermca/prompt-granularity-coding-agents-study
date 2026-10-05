// Review modal: opened from a product's rating/review control.
// UX: spec/ux/ux-design-of-review-popup.png
// Reviews come only from the already-loaded product.reviews[] (reviewerName,
// rating, comment, date) — never from GET /comments, never invented.
// Add-comment: spec/apis_contract/05_Add_Comment.md, spec/SPEC_FREEZE.md
//   POST https://dummyjson.com/comments/add
//   Body: { body, postId, userId }. Not persisted server-side — on success
//   we append the comment to the product's review list in frontend state.

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Product, ProductReview } from '../types/product';
import { addComment, CommentError } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, StarIcon } from './icons';
import styles from './ReviewModal.module.css';

interface ReviewModalProps {
  product: Product;
  onClose: () => void;
  onCommentAdded: (productId: number, review: ProductReview) => void;
}

const RATING_VALUES = [1, 2, 3, 4, 5];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ReviewModal({ product, onClose, onCommentAdded }: ReviewModalProps) {
  const { user } = useAuth();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [commentText, setCommentText] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [commentTextError, setCommentTextError] = useState<string | null>(null);

  const titleId = `review-modal-title-${product.id}`;
  const commentFieldId = `review-comment-${product.id}`;
  const commentErrorId = `${commentFieldId}-error`;

  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0 ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;

  // Move focus into the dialog on open; hide the rest of the document from
  // assistive tech and lock background scroll while it's open.
  useEffect(() => {
    closeButtonRef.current?.focus();
    const root = document.getElementById('root');
    root?.setAttribute('aria-hidden', 'true');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      root?.removeAttribute('aria-hidden');
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      setCommentTextError('Please enter a comment before submitting.');
      return;
    }
    setCommentTextError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await addComment({ body: trimmed, postId: product.id, userId: user?.id ?? 0 });
      const reviewerName =
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || 'You';
      const newReview: ProductReview = {
        rating: selectedRating ?? 0,
        comment: trimmed,
        date: new Date().toISOString(),
        reviewerName,
      };
      onCommentAdded(product.id, newReview);
      setCommentText('');
      setSelectedRating(null);
    } catch (error) {
      // Keep existing reviews and show an error; nothing is removed.
      setSubmitError(
        error instanceof CommentError ? error.message : 'Failed to add your comment. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              Reviews ({reviewCount})
            </h2>
            {reviewCount > 0 ? (
              <p className={styles.summary}>
                <StarIcon className={styles.starFilled} />
                <span>
                  {averageRating.toFixed(1)} average · Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
                </span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close reviews"
            ref={closeButtonRef}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.body}>
          <form className={styles.addCommentForm} onSubmit={handleSubmit} noValidate>
            <h3 className={styles.addCommentTitle}>Add a comment</h3>

            <fieldset className={styles.ratingFieldset}>
              <legend className={styles.ratingLegend}>Your rating (optional)</legend>
              <div className={styles.starPicker}>
                {RATING_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.starButton}
                    aria-pressed={selectedRating === value}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    onClick={() => setSelectedRating((previous) => (previous === value ? null : value))}
                    disabled={isSubmitting}
                  >
                    <StarIcon className={selectedRating !== null && value <= selectedRating ? styles.starFilled : styles.starEmpty} />
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor={commentFieldId} className={styles.commentLabel}>
              Your comment
            </label>
            <textarea
              id={commentFieldId}
              className={styles.commentInput}
              placeholder="Write your comment"
              rows={3}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              aria-invalid={commentTextError ? true : undefined}
              aria-describedby={commentTextError ? commentErrorId : undefined}
              disabled={isSubmitting}
            />
            {commentTextError ? (
              <p className={styles.fieldError} id={commentErrorId}>
                {commentTextError}
              </p>
            ) : null}

            {submitError ? (
              <p className={styles.submitError} role="alert">
                {submitError}
              </p>
            ) : null}

            <button type="submit" className={styles.submitButton} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit comment'}
            </button>
          </form>

          <ul className={styles.reviewList}>
            {reviewCount === 0 ? (
              <li className={styles.emptyState}>No reviews yet. Be the first to add one.</li>
            ) : (
              product.reviews.map((review, index) => (
                <li key={`${review.reviewerName}-${review.date}-${index}`} className={styles.reviewRow}>
                  <div className={styles.avatar} aria-hidden="true">
                    {review.reviewerName.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className={styles.reviewBody}>
                    <div className={styles.reviewMeta}>
                      <span className={styles.reviewerName}>{review.reviewerName}</span>
                      <span className={styles.reviewDate}>{formatDate(review.date)}</span>
                    </div>
                    <div className={styles.reviewStars} aria-label={`${review.rating} out of 5 stars`}>
                      {RATING_VALUES.map((value) => (
                        <StarIcon key={value} className={value <= review.rating ? styles.starFilled : styles.starEmpty} />
                      ))}
                    </div>
                    <p className={styles.reviewComment}>{review.comment}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
