import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react'
import type { Product, Review } from '../types'
import { addComment } from '../api/comments'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatRating } from '../utils/format'
import { StarRatingDisplay, StarRatingInput } from './StarRating'
import { CloseIcon, AlertIcon } from './Icons'
import './ReviewModal.css'

interface ReviewModalProps {
  product: Product
  onClose: () => void
  onAddReview: (productId: number, review: Review) => void
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export default function ReviewModal({ product, onClose, onAddReview }: ReviewModalProps) {
  const { user } = useAuth()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const [commentText, setCommentText] = useState('')
  const [ratingInput, setRatingInput] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const titleId = useId()
  const commentFieldId = useId()
  const commentErrorId = useId()

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = getFocusable(dialog)
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
  }, [onClose])

  const handleOverlayMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = commentText.trim()
    if (trimmed === '') {
      setValidationError('Please enter a comment before submitting.')
      return
    }
    setValidationError(null)

    if (!user) {
      setSubmitError('You must be logged in to add a comment.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await addComment({ body: trimmed, postId: product.id, userId: user.id })
      const reviewerName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username
      const newReview: Review = {
        reviewerName,
        rating: ratingInput,
        comment: trimmed,
        date: new Date().toISOString(),
      }
      onAddReview(product.id, newReview)
      setCommentText('')
      setRatingInput(0)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not post your comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reviews = product.reviews

  return (
    <div className="review-modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <div className="review-modal__header">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button type="button" className="review-modal__close" onClick={onClose} ref={closeButtonRef} aria-label="Close reviews">
            <CloseIcon />
          </button>
        </div>

        <div className="review-modal__summary">
          <div className="review-modal__average">
            <span className="review-modal__average-number">{formatRating(product.rating)}</span>
            <StarRatingDisplay rating={product.rating} size={18} />
            <span className="review-modal__average-caption">Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
          </div>

          <form className="review-modal__form" onSubmit={handleSubmit}>
            <h3 className="review-modal__form-title">Add a comment</h3>
            <label htmlFor={`${commentFieldId}-rating`} className="review-modal__label">
              Your rating (optional)
            </label>
            <div id={`${commentFieldId}-rating`}>
              <StarRatingInput value={ratingInput} onChange={setRatingInput} />
            </div>

            <label htmlFor={commentFieldId} className="review-modal__label">
              Your comment
            </label>
            <textarea
              id={commentFieldId}
              value={commentText}
              placeholder="Write your comment"
              rows={3}
              disabled={submitting}
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? commentErrorId : undefined}
              onChange={(event) => {
                setCommentText(event.target.value)
                if (validationError) setValidationError(null)
              }}
            />
            {validationError && (
              <p id={commentErrorId} role="alert" className="review-modal__error">
                {validationError}
              </p>
            )}
            {submitError && (
              <p role="alert" className="inline-alert review-modal__submit-error">
                <AlertIcon width={16} height={16} />
                <span>{submitError}</span>
              </p>
            )}
            <button type="submit" className="primary-button review-modal__submit" disabled={submitting} aria-busy={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? 'Submitting…' : 'Submit comment'}
            </button>
          </form>
        </div>

        <ul className="review-modal__list">
          {reviews.length === 0 && (
            <li className="review-modal__empty">No reviews yet. Be the first to write one!</li>
          )}
          {reviews.map((review, index) => (
            <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-modal__item">
              <div className="review-modal__item-avatar" aria-hidden="true">
                {review.reviewerName.charAt(0).toUpperCase()}
              </div>
              <div className="review-modal__item-body">
                <div className="review-modal__item-header">
                  <span className="review-modal__item-name">{review.reviewerName}</span>
                  <span className="review-modal__item-date">{formatDate(review.date)}</span>
                </div>
                {review.rating > 0 ? (
                  <StarRatingDisplay rating={review.rating} size={14} />
                ) : (
                  <span className="review-modal__item-unrated">Not rated</span>
                )}
                <p className="review-modal__item-comment">{review.comment}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
