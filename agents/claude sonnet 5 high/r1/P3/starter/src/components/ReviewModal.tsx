import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { addComment, CommentApiError } from '../lib/commentsApi'
import type { Product, ProductReview } from '../types/product'

interface ReviewModalProps {
  product: Product
  userId: number | null
  onClose: () => void
  onCommentAdded: (productId: number, review: ProductReview) => void
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'

export default function ReviewModal({ product, userId, onClose, onCommentAdded }: ReviewModalProps) {
  const titleId = useId()
  const commentFieldId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  const [commentText, setCommentText] = useState('')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Focus management: move focus into the dialog on open, trap Tab within it,
  // close on Escape, and restore focus to the trigger element on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) {
      setValidationError('Please enter a comment.')
      return
    }
    setValidationError(null)
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await addComment(trimmed, product.id, userId ?? 0)
      const newReview: ProductReview = {
        rating: rating > 0 ? rating : product.rating ?? 0,
        comment: trimmed,
        date: new Date().toISOString(),
        reviewerName: 'You',
      }
      onCommentAdded(product.id, newReview)
      setCommentText('')
      setRating(0)
    } catch (err) {
      setSubmitError(err instanceof CommentApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reviews = product.reviews ?? []

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close reviews dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form className="add-comment-form" onSubmit={handleSubmit}>
          <h3>Add a comment</h3>

          <div className="rating-input" role="radiogroup" aria-label="Your rating (optional)">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                className={`star-button${value <= rating ? ' is-active' : ''}`}
                onClick={() => setRating(value === rating ? 0 : value)}
                disabled={isSubmitting}
              >
                ★
              </button>
            ))}
          </div>

          <label htmlFor={commentFieldId}>Your comment</label>
          <textarea
            id={commentFieldId}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment"
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? `${commentFieldId}-error` : undefined}
            disabled={isSubmitting}
          />
          {validationError && (
            <p id={`${commentFieldId}-error`} className="field-error" role="alert">
              {validationError}
            </p>
          )}
          {submitError && (
            <p className="form-alert" role="alert">
              {submitError}
            </p>
          )}

          <button type="submit" className="submit-comment-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit comment'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="review-empty">No reviews yet. Be the first to add a comment.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((review, index) => (
              <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                <div className="review-item-header">
                  <span className="reviewer-name">{review.reviewerName}</span>
                  <span className="review-date">{formatDate(review.date)}</span>
                </div>
                <div className="review-rating" aria-label={`Rated ${review.rating} out of 5 stars`}>
                  <span aria-hidden="true">
                    {'★'.repeat(Math.round(review.rating))}
                    {'☆'.repeat(Math.max(0, 5 - Math.round(review.rating)))}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}
