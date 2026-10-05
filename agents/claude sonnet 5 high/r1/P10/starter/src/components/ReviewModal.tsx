// Review modal opened from a product card's rating/review control.
// Existing reviews come only from `product.reviews[]` (the already-loaded
// product) — never from GET /comments, and nothing is invented.
//
// "Add a comment" posts to POST /comments/add. DummyJSON does not persist
// it, so on success we append the comment to this product's review list in
// frontend state ourselves.

import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Product, ProductReview } from '../types/product';
import { addComment, CommentError } from '../api/commentsApi';
import { useAuth } from '../context/useAuth';
import Dialog from './Dialog';
import './ReviewModal.css';

interface ReviewModalProps {
  product: Product;
  onClose: () => void;
  onReviewAdded: (productId: number, review: ProductReview) => void;
}

const GENERIC_COMMENT_ERROR = 'Unable to post your comment right now. Please try again.';

function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function ratingBreakdown(reviews: ProductReview[]) {
  const counts = [0, 0, 0, 0, 0]; // counts[0] = 1-star ... counts[4] = 5-star
  let ratedCount = 0;
  for (const review of reviews) {
    if (typeof review.rating !== 'number') continue;
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) - 1;
    counts[bucket] += 1;
    ratedCount += 1;
  }
  return { counts, ratedCount };
}

function ReviewItem({ review }: { review: ProductReview }) {
  const hasRating = typeof review.rating === 'number';
  const filledStars = hasRating ? Math.max(0, Math.min(5, Math.round(review.rating as number))) : 0;

  return (
    <li className="review-item">
      <div className="review-item-avatar" aria-hidden="true">
        {review.reviewerName.trim().charAt(0).toUpperCase() || '?'}
      </div>
      <div className="review-item-body">
        <div className="review-item-header">
          <span className="review-item-name">{review.reviewerName}</span>
          <span className="review-item-date">{formatReviewDate(review.date)}</span>
        </div>
        {hasRating && (
          <p className="review-item-stars" aria-label={`Rated ${review.rating} out of 5`}>
            <span aria-hidden="true">
              {'★'.repeat(filledStars)}
              {'☆'.repeat(5 - filledStars)}
            </span>
          </p>
        )}
        <p className="review-item-comment">{review.comment}</p>
      </div>
    </li>
  );
}

export default function ReviewModal({ product, onClose, onReviewAdded }: ReviewModalProps) {
  const { session } = useAuth();

  const titleId = useId();
  const commentFieldId = useId();
  const commentErrorId = useId();
  const ratingLabelId = useId();

  const reviews = product.reviews ?? [];
  const reviewCount = reviews.length;
  const { counts, ratedCount } = ratingBreakdown(reviews);

  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(0);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitErrorRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = commentText.trim();
    if (!trimmed) {
      setFieldError('Please enter a comment before submitting.');
      textareaRef.current?.focus();
      return;
    }
    setFieldError(null);
    setSubmitError(null);

    if (!session) {
      // The review modal is only reachable while authenticated, but guard
      // defensively since userId is required by the contract.
      setSubmitError('You must be logged in to add a comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment({ body: trimmed, postId: product.id, userId: session.id });

      const reviewerName = `${session.firstName} ${session.lastName}`.trim() || session.username;
      const newReview: ProductReview = {
        comment: trimmed,
        date: new Date().toISOString(),
        reviewerName,
        ...(commentRating > 0 ? { rating: commentRating } : {}),
      };
      onReviewAdded(product.id, newReview);

      // Reset the form for the next comment; existing reviews are untouched.
      setCommentText('');
      setCommentRating(0);
    } catch (error) {
      setSubmitError(error instanceof CommentError ? error.message : GENERIC_COMMENT_ERROR);
      requestAnimationFrame(() => submitErrorRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog labelledBy={titleId} onClose={onClose}>
      <div className="review-modal-header">
        <h2 id={titleId} className="review-modal-title">
          Reviews ({reviewCount})
        </h2>
        <button type="button" className="review-modal-close" aria-label="Close reviews" onClick={onClose}>
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div className="review-modal-top">
        <div className="review-modal-summary">
          {reviewCount === 0 ? (
            <p className="review-modal-summary-empty">No reviews yet.</p>
          ) : (
            <>
              <p className="review-modal-average">{product.rating.toFixed(1)}</p>
              <p className="review-modal-average-stars" aria-hidden="true">
                {'★'.repeat(Math.round(product.rating))}
                {'☆'.repeat(5 - Math.round(product.rating))}
              </p>
              <p className="review-modal-based-on">
                Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
              </p>
              {ratedCount > 0 && (
                <ul className="review-modal-breakdown">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = counts[star - 1];
                    const pct = ratedCount > 0 ? Math.round((count / ratedCount) * 100) : 0;
                    return (
                      <li key={star} className="review-modal-breakdown-row">
                        <span className="review-modal-breakdown-star">{star}★</span>
                        <span className="review-modal-breakdown-bar">
                          <span className="review-modal-breakdown-bar-fill" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="review-modal-breakdown-count">
                          {count} ({pct}%)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        <form className="review-modal-add-comment" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <h3 className="review-modal-add-comment-title">Add a comment</h3>

          <div className="review-modal-your-rating">
            <span id={ratingLabelId} className="review-modal-your-rating-label">
              Your rating (optional)
            </span>
            <div role="radiogroup" aria-labelledby={ratingLabelId} className="review-modal-star-buttons">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={commentRating === star}
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                  className={`review-modal-star-button${star <= commentRating ? ' is-selected' : ''}`}
                  disabled={isSubmitting}
                  onClick={() => setCommentRating((current) => (current === star ? 0 : star))}
                >
                  <span aria-hidden="true">★</span>
                </button>
              ))}
            </div>
          </div>

          <label htmlFor={commentFieldId} className="visually-hidden">
            Your comment
          </label>
          <textarea
            id={commentFieldId}
            ref={textareaRef}
            className="review-modal-textarea"
            placeholder="Write your comment"
            value={commentText}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? commentErrorId : undefined}
            onChange={(event) => {
              setCommentText(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            rows={3}
          />
          {fieldError && (
            <p id={commentErrorId} className="review-modal-field-error" role="alert">
              {fieldError}
            </p>
          )}

          {submitError && (
            <div className="review-modal-submit-error" role="alert" tabIndex={-1} ref={submitErrorRef}>
              {submitError}
            </div>
          )}

          <button type="submit" className="review-modal-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Posting…' : 'Submit comment'}
          </button>
          <p className="review-modal-guidelines">Please be respectful and follow our community guidelines.</p>
        </form>
      </div>

      <div className="review-modal-list-wrap">
        {reviewCount === 0 ? (
          <p className="review-modal-empty">No reviews yet. Be the first to share your thoughts.</p>
        ) : (
          <ul className="review-modal-list">
            {reviews.map((review, index) => (
              <ReviewItem key={`${review.reviewerName}-${review.date}-${index}`} review={review} />
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
