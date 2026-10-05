import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Product } from '../types'
import { Modal } from './Modal'
import { StarRatingDisplay, StarRatingInput } from './StarRating'

interface ReviewModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onAddComment: (body: string, rating: number | null) => Promise<void>
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ReviewModal({ isOpen, product, onClose, onAddComment }: ReviewModalProps) {
  const [commentText, setCommentText] = useState('')
  const [rating, setRating] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!product) return null

  const reviews = product.reviews ?? []

  function handleClose() {
    setCommentText('')
    setRating(0)
    setValidationError(null)
    setSubmitError(null)
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) {
      setValidationError('Please write a comment before submitting.')
      return
    }
    setValidationError(null)
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await onAddComment(trimmed, rating > 0 ? rating : null)
      setCommentText('')
      setRating(0)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Could not post your comment. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      titleId="reviews-modal-title"
      title={`Reviews (${reviews.length})`}
    >
      <div className="reviews-summary">
        <div className="reviews-summary__score">
          <span className="reviews-summary__number">{product.rating.toFixed(1)}</span>
          <StarRatingDisplay rating={product.rating} />
          <span className="reviews-summary__count">Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
        </div>

        <form className="add-comment-form" onSubmit={handleSubmit}>
          <h3 className="add-comment-form__title">Add a comment</h3>
          <div className="add-comment-form__rating">
            <span id="your-rating-label">Your rating</span>
            <StarRatingInput value={rating} onChange={setRating} label="Your rating" />
          </div>
          <label htmlFor="comment-text" className="visually-hidden">
            Your comment
          </label>
          <textarea
            id="comment-text"
            className="add-comment-form__textarea"
            placeholder="Write your comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? 'comment-error' : undefined}
            rows={3}
            disabled={isSubmitting}
          />
          {validationError && (
            <p id="comment-error" className="field-error" role="alert">
              {validationError}
            </p>
          )}
          {submitError && (
            <p className="field-error" role="alert">
              {submitError}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit comment'}
          </button>
          <p className="add-comment-form__hint">Please be respectful and follow community guidelines.</p>
        </form>
      </div>

      <ul className="review-list">
        {reviews.length === 0 && <p className="review-list__empty">No reviews yet. Be the first to comment.</p>}
        {reviews.map((review, index) => (
          <li key={`${review.reviewerName}-${index}`} className="review-item">
            <div className="review-item__avatar" aria-hidden="true">
              {review.reviewerName.charAt(0).toUpperCase()}
            </div>
            <div className="review-item__body">
              <div className="review-item__header">
                <span className="review-item__name">{review.reviewerName}</span>
                <span className="review-item__date">{formatDate(review.date)}</span>
              </div>
              <StarRatingDisplay rating={review.rating} />
              <p className="review-item__comment">{review.comment}</p>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
