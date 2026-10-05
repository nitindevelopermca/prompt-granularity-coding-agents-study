import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { addComment } from '../api/comments'
import { toErrorMessage } from '../api/errors'
import type { Product, Review } from '../types'
import { StarRating, StarRatingInput } from './StarRating'
import { CloseIcon } from './icons'
import './ReviewModal.css'

interface ReviewModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  userId: number
  onReviewAdded: (review: Review) => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function ReviewModal({ product, isOpen, onClose, userId, onReviewAdded }: ReviewModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const titleId = useId()
  const commentId = useId()

  const [commentText, setCommentText] = useState('')
  const [starValue, setStarValue] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Move focus into the dialog when it opens, and restore it to the
  // previously-focused element (the trigger) when it closes.
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })
    return () => {
      cancelAnimationFrame(frame)
      previouslyFocused?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setCommentText('')
      setStarValue(0)
      setSubmitError(null)
      setValidationError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key === 'Tab') {
      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled'),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)
    setSubmitError(null)

    const trimmed = commentText.trim()
    if (!trimmed) {
      setValidationError('Please write a comment before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      await addComment(trimmed, product.id, userId)
      const newReview: Review = {
        rating: starValue,
        comment: trimmed,
        date: new Date().toISOString(),
        reviewerName: 'You',
      }
      onReviewAdded(newReview)
      setCommentText('')
      setStarValue(0)
    } catch (error) {
      setSubmitError(toErrorMessage(error, 'Failed to post your comment. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="review-modal__header">
          <h2 id={titleId} className="review-modal__title">
            Reviews ({product.reviews.length})
          </h2>
          <button type="button" className="review-modal__close" aria-label="Close reviews dialog" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="review-modal__body">
          <section className="review-modal__add" aria-label="Add a comment">
            <h3 className="review-modal__add-title">Add a comment</h3>
            <form onSubmit={handleSubmit} noValidate>
              <div className="review-modal__rating-row">
                <span id={`${commentId}-rating-label`} className="review-modal__rating-label">
                  Your rating (optional)
                </span>
                <StarRatingInput value={starValue} onChange={setStarValue} label="Your rating" />
              </div>

              <label htmlFor={commentId} className="review-modal__label">
                Your comment
              </label>
              <textarea
                id={commentId}
                className="review-modal__textarea"
                placeholder="Write your comment"
                rows={3}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                aria-invalid={validationError ? true : undefined}
                aria-describedby={validationError ? `${commentId}-error` : undefined}
              />

              {validationError && (
                <p id={`${commentId}-error`} className="review-modal__error" role="alert">
                  {validationError}
                </p>
              )}
              {submitError && (
                <p className="review-modal__error" role="alert">
                  {submitError}
                </p>
              )}

              <button type="submit" className="review-modal__submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit comment'}
              </button>
            </form>
          </section>

          <section className="review-modal__list" aria-label="Existing reviews">
            {product.reviews.length === 0 ? (
              <p className="review-modal__empty">No reviews yet. Be the first to share your thoughts.</p>
            ) : (
              <ul className="review-modal__items">
                {product.reviews.map((review, index) => (
                  <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-modal__item">
                    <div className="review-modal__item-header">
                      <span className="review-modal__reviewer">{review.reviewerName}</span>
                      <span className="review-modal__date">{formatDate(review.date)}</span>
                    </div>
                    {review.rating > 0 && (
                      <StarRating rating={review.rating} />
                    )}
                    <p className="review-modal__comment">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
