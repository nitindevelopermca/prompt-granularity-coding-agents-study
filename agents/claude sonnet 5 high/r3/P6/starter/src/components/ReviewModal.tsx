// Review dialog opened from a product's rating/review control. Reviews come
// only from the already-loaded product's reviews[] (never GET /comments).
// Includes the add-comment form using POST /comments/add.

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import type { Product, Review } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { addComment, ApiError } from '../api/client';
import { CloseIcon, StarIcon } from './Icons';

type ReviewModalProps = {
  product: Product;
  onClose: () => void;
  onCommentAdded: (review: Review) => void;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function ReviewModal({ product, onClose, onCommentAdded }: ReviewModalProps) {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const titleId = useId();
  const commentId = useId();
  const ratingLabelId = useId();

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.classList.add('has-modal-open');
    return () => {
      document.body.classList.remove('has-modal-open');
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null);
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
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = commentText.trim();

    if (!trimmed) {
      setValidationError('Please enter a comment before submitting.');
      return;
    }
    if (!user) {
      setSubmitError('You must be logged in to comment.');
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await addComment(trimmed, product.id, user.id);
      const newReview: Review = {
        reviewerName: user.username,
        rating: rating > 0 ? rating : 5,
        comment: trimmed,
        date: new Date().toISOString(),
      };
      onCommentAdded(newReview);
      setCommentText('');
      setRating(0);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Could not post your comment. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviews = product.reviews ?? [];

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="modal-header">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button
            type="button"
            ref={closeButtonRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close reviews dialog"
          >
            <CloseIcon aria-hidden="true" />
          </button>
        </div>

        <form className="add-comment-form" onSubmit={handleSubmit}>
          <h3>Add a comment</h3>

          <div className="form-field">
            <span id={ratingLabelId}>Your rating (optional)</span>
            <div role="radiogroup" aria-labelledby={ratingLabelId} className="star-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  className={`star-picker__star${value <= rating ? ' is-filled' : ''}`}
                  onClick={() => setRating(value)}
                >
                  <StarIcon filled={value <= rating} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor={commentId}>Comment</label>
            <textarea
              id={commentId}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write your comment"
              rows={3}
              aria-invalid={validationError ? true : undefined}
              aria-describedby={validationError ? `${commentId}-error` : undefined}
              disabled={isSubmitting}
            />
          </div>

          {validationError && (
            <p role="alert" id={`${commentId}-error`} className="field-error">
              {validationError}
            </p>
          )}
          {submitError && (
            <p role="alert" className="field-error">
              {submitError}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit comment'}
          </button>
        </form>

        <ul className="review-list">
          {reviews.length === 0 && <li className="review-list__empty">No reviews yet. Be the first to add one.</li>}
          {reviews.map((review, index) => (
            <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
              <div className="review-item__header">
                <span className="review-item__name">{review.reviewerName}</span>
                <span className="review-item__rating" aria-label={`Rating: ${review.rating} out of 5`}>
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(Math.max(0, 5 - review.rating))}
                </span>
                <span className="review-item__date">
                  {Number.isNaN(new Date(review.date).getTime())
                    ? review.date
                    : new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              <p className="review-item__comment">{review.comment}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
