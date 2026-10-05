import { useEffect, useRef, useState } from 'react'
import type { Product, Review } from '../types'
import { addComment, ApiError } from '../api'
import { useAuth } from '../context/AuthContext'

interface ReviewModalProps {
  product: Product
  onClose: () => void
  onReviewAdded: (productId: number, review: Review) => void
}

export default function ReviewModal({ product, onClose, onReviewAdded }: ReviewModalProps) {
  const { user } = useAuth()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [commentText, setCommentText] = useState('')
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
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
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const trimmed = commentText.trim()
    if (!trimmed) {
      setValidationError('Please enter a comment before submitting.')
      return
    }
    setValidationError(null)

    if (!user) {
      setError('You must be logged in to add a comment.')
      return
    }

    setSubmitting(true)
    try {
      await addComment(trimmed, product.id, user.id)
      const newReview: Review = {
        rating: rating > 0 ? rating : product.rating ?? 0,
        comment: trimmed,
        date: new Date().toISOString(),
        reviewerName: user.username,
      }
      onReviewAdded(product.id, newReview)
      setCommentText('')
      setRating(0)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to post comment. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        ref={dialogRef}
      >
        <div className="modal__header">
          <h2 id="review-modal-title">Reviews for {product.title}</h2>
          <button type="button" className="modal__close" onClick={onClose} ref={closeButtonRef} aria-label="Close reviews dialog">
            ✕
          </button>
        </div>

        <div className="modal__body">
          {product.reviews && product.reviews.length > 0 ? (
            <ul className="review-list">
              {product.reviews.map((review, index) => (
                <li key={`${product.id}-review-${index}`} className="review-list__item">
                  <div className="review-list__meta">
                    <span className="review-list__name">{review.reviewerName}</span>
                    <span className="review-list__rating" aria-label={`Rating ${review.rating} out of 5`}>
                      {'★'.repeat(Math.round(review.rating))}
                      {'☆'.repeat(5 - Math.round(review.rating))}
                    </span>
                  </div>
                  <p className="review-list__comment">{review.comment}</p>
                  <time className="review-list__date">{new Date(review.date).toLocaleDateString()}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="review-list__empty">No reviews yet. Be the first to add one.</p>
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <h3 className="comment-form__heading">Add a comment</h3>
          <label htmlFor="comment-text" className="comment-form__label">
            Your comment
          </label>
          <textarea
            id="comment-text"
            className="comment-form__textarea"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            aria-invalid={validationError ? 'true' : undefined}
            aria-describedby={validationError ? 'comment-text-error' : undefined}
            rows={3}
          />
          {validationError && (
            <p id="comment-text-error" role="alert" className="comment-form__error">
              {validationError}
            </p>
          )}

          <label htmlFor="comment-rating" className="comment-form__label">
            Rating (optional)
          </label>
          <select
            id="comment-rating"
            className="comment-form__rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={0}>No rating</option>
            <option value={1}>1 star</option>
            <option value={2}>2 stars</option>
            <option value={3}>3 stars</option>
            <option value={4}>4 stars</option>
            <option value={5}>5 stars</option>
          </select>

          {error && (
            <p role="alert" className="comment-form__error">
              {error}
            </p>
          )}

          <button type="submit" className="comment-form__submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
