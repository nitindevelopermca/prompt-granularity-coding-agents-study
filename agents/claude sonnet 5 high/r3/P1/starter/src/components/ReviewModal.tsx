import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { ApiError, addCommentRequest } from '../api.ts'
import { useAuth } from '../context/AuthContext.tsx'
import { useProducts } from '../context/ProductsContext.tsx'
import type { Product, Review } from '../types.ts'
import { StarRating, StarRatingInput } from './StarRating.tsx'
import { CloseIcon } from './icons.tsx'

interface ReviewModalProps {
  product: Product | null
  onClose: () => void
}

/**
 * Native <dialog>-based modal. Using the built-in dialog element gives us
 * Escape-to-close, focus trapping, and a backdrop for free.
 */
export function ReviewModal({ product, onClose }: ReviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { user } = useAuth()
  const { addCommentToProduct } = useProducts()

  const [commentText, setCommentText] = useState('')
  const [commentRating, setCommentRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (product) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [product])

  useEffect(() => {
    setCommentText('')
    setCommentRating(0)
    setSubmitError(null)
    setValidationError(null)
  }, [product?.id])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !user) return

    const trimmed = commentText.trim()
    if (!trimmed) {
      setValidationError('Please enter a comment before submitting.')
      return
    }

    setValidationError(null)
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await addCommentRequest(trimmed, product.id, user.id)
      const reviewerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
      const review: Review = {
        rating: commentRating > 0 ? commentRating : Math.round(product.rating),
        comment: trimmed,
        date: new Date().toISOString(),
        reviewerName,
      }
      addCommentToProduct(product.id, review)
      setCommentText('')
      setCommentRating(0)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to post comment. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="review-modal"
      aria-labelledby="review-modal-title"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {product && (
        <div className="review-modal__content">
          <div className="review-modal__header">
            <h2 id="review-modal-title">Reviews ({product.reviews.length})</h2>
            <button
              type="button"
              className="review-modal__close"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close reviews"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="review-modal__summary">
            <span className="review-modal__average">{product.rating.toFixed(1)}</span>
            <StarRating rating={product.rating} />
            <span>
              Based on {product.reviews.length} review{product.reviews.length === 1 ? '' : 's'}
            </span>
          </div>

          <form className="review-modal__form" onSubmit={handleSubmit}>
            <h3>Add a comment</h3>
            <label htmlFor="review-comment-text">Your comment</label>
            <textarea
              id="review-comment-text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write your comment"
              rows={3}
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? 'review-comment-error' : undefined}
            />

            <div className="review-modal__rating-field">
              <span id="review-rating-label">Your rating (optional)</span>
              <StarRatingInput value={commentRating} onChange={setCommentRating} />
            </div>

            {validationError && (
              <p id="review-comment-error" role="alert" className="form-error">
                {validationError}
              </p>
            )}
            {submitError && (
              <p role="alert" className="form-error">
                {submitError}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit comment'}
            </button>
          </form>

          <ul className="review-modal__list">
            {product.reviews.length === 0 && (
              <li className="review-modal__empty">No reviews yet. Be the first to add one.</li>
            )}
            {product.reviews.map((review, index) => (
              <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-modal__item">
                <div className="review-modal__item-header">
                  <span className="review-modal__reviewer">{review.reviewerName}</span>
                  <span className="review-modal__date">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <StarRating rating={review.rating} />
                <p>{review.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </dialog>
  )
}
