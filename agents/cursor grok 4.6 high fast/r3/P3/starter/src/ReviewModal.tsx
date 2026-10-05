import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { addProductComment } from './api/comments'
import type { Product, ProductReview } from './types'

type ReviewModalProps = {
  product: Product
  userId: number
  onClose: () => void
  onReviewAdded: (productId: number, review: ProductReview) => void
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

export function ReviewModal({ product, userId, onClose, onReviewAdded }: ReviewModalProps) {
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const ratingLabelId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const formErrorRef = useRef<HTMLParagraphElement>(null)

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [commentError, setCommentError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function focusableElements(): HTMLElement[] {
      const root = dialogRef.current
      if (!root) {
        return []
      }
      return Array.from(
        root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
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

      const elements = focusableElements()
      if (elements.length === 0) {
        event.preventDefault()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (active instanceof HTMLElement && !dialogRef.current?.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      setFormError('')
      commentRef.current?.focus()
      return
    }

    setCommentError('')
    setFormError('')
    setSubmitting(true)
    const result = await addProductComment(body, product.id, userId)
    setSubmitting(false)

    if (!result.ok) {
      setFormError(result.message)
      queueMicrotask(() => formErrorRef.current?.focus())
      return
    }

    const review: ProductReview = {
      reviewerName: 'You',
      rating,
      comment: body,
      date: new Date().toISOString(),
    }
    onReviewAdded(product.id, review)
    setComment('')
    setRating(0)
  }

  return (
    <div className="review-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="review-dialog-header">
          <h2 id={titleId}>Reviews</h2>
          <button ref={closeRef} type="button" className="review-close" aria-label="Close reviews" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="review-dialog-product">{product.title}</p>

        {product.reviews.length === 0 ? (
          <p className="review-empty">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {product.reviews.map((review, index) => (
              <li key={`${product.id}-review-${index}-${review.date}`} className="review-item">
                <div className="review-item-meta">
                  <strong>{review.reviewerName}</strong>
                  {review.rating > 0 ? (
                    <span aria-label={`${review.rating} out of 5 stars`}>★ {review.rating}</span>
                  ) : null}
                  <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                </div>
                <p>{review.comment || 'No comment provided.'}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="review-form" onSubmit={onSubmit} noValidate aria-busy={submitting}>
          <h3>Add a comment</h3>
          <p ref={formErrorRef} id={formErrorId} className="form-alert" role="alert" tabIndex={-1} hidden={!formError}>
            {formError}
          </p>
          <div className="field">
            <span className="field-label" id={ratingLabelId}>
              Rating (optional)
            </span>
            <div className="review-stars" role="group" aria-labelledby={ratingLabelId}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={rating >= value ? 'review-star is-active' : 'review-star'}
                  aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                  aria-pressed={rating === value}
                  disabled={submitting}
                  onClick={() => setRating((current) => (current === value ? 0 : value))}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor={commentId}>Comment</label>
            <textarea
              ref={commentRef}
              id={commentId}
              name="comment"
              rows={3}
              value={comment}
              disabled={submitting}
              aria-invalid={commentError ? true : undefined}
              aria-describedby={commentError ? commentErrorId : undefined}
              onChange={(event) => {
                setComment(event.target.value)
                if (commentError) setCommentError('')
                if (formError) setFormError('')
              }}
            />
            {commentError ? (
              <p id={commentErrorId} className="field-error">
                {commentError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="review-submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
