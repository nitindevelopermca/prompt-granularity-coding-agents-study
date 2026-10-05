import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { addProductComment, CommentRequestError } from './commentsApi'
import type { ProductReview } from './types'
import './ReviewModal.css'

type ReviewModalProps = {
  productId: number
  productTitle: string
  userId: number
  reviews: ProductReview[]
  onClose: () => void
  onReviewAdded: (review: ProductReview) => void
}

function formatReviewDate(value: string): string {
  if (!value) {
    return 'Date unavailable'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function ReviewStars({ rating }: { rating: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)))
  return (
    <span className="review-modal-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < filled ? 'is-filled' : undefined} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

export default function ReviewModal({
  productId,
  productTitle,
  userId,
  reviews,
  onClose,
  onReviewAdded,
}: ReviewModalProps) {
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    const previousOverflow = document.body.style.overflow

    root?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function focusables(): HTMLElement[] {
      if (!dialog) {
        return []
      }

      return Array.from(
        dialog.querySelectorAll<HTMLElement>('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        dialog?.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      root?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  function handleBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      setFormError(null)
      commentRef.current?.focus()
      return
    }

    setCommentError(null)
    setFormError(null)
    setIsSubmitting(true)

    try {
      await addProductComment(body, productId, userId)
      onReviewAdded({
        reviewerName: 'You',
        rating: rating ?? 0,
        comment: body,
        date: new Date().toISOString(),
      })
      setComment('')
      setRating(null)
    } catch (cause) {
      const message =
        cause instanceof CommentRequestError
          ? cause.message
          : 'Unable to add your comment. Please try again.'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="review-modal-backdrop" onClick={handleBackdrop}>
      <div
        ref={dialogRef}
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="review-modal-header">
          <h2 id={titleId}>Reviews</h2>
          <button ref={closeRef} type="button" className="review-modal-close" aria-label="Close reviews" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="review-modal-product">{productTitle}</p>

        {reviews.length === 0 ? (
          <p className="review-modal-empty">No reviews yet.</p>
        ) : (
          <ul className="review-modal-list">
            {reviews.map((review, index) => (
              <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-modal-item">
                <div className="review-modal-item-top">
                  <p className="review-modal-name">{review.reviewerName}</p>
                  {review.rating > 0 ? <ReviewStars rating={review.rating} /> : null}
                </div>
                <p className="review-modal-comment">{review.comment || 'No comment provided.'}</p>
                <p className="review-modal-date">{formatReviewDate(review.date)}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="review-modal-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <label htmlFor={commentId}>Add a comment</label>
          <textarea
            ref={commentRef}
            id={commentId}
            name="comment"
            rows={3}
            placeholder="Write a comment"
            value={comment}
            disabled={isSubmitting}
            aria-invalid={commentError ? true : undefined}
            aria-describedby={commentError ? commentErrorId : undefined}
            onChange={(event) => {
              setComment(event.target.value)
              if (commentError) {
                setCommentError(null)
              }
            }}
          />
          {commentError ? (
            <p id={commentErrorId} className="review-modal-field-error">
              {commentError}
            </p>
          ) : null}

          <fieldset className="review-modal-rating" disabled={isSubmitting}>
            <legend>Rating (optional)</legend>
            <div className="review-modal-rating-options">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>

          {formError ? (
            <p id={formErrorId} className="review-modal-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit comment'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
