import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { addComment, CommentNetworkError, CommentRequestError } from '../comments/api'
import type { Product, ProductReview } from './types'
import './ReviewModal.css'

const FOCUSABLE =
  'button:not([disabled]), [href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatReviewDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg className={`review-star${filled ? ' is-filled' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.8 12.4 7l5.6.8-4 3.9.9 5.6L10 14.8 4.9 17.3l.9-5.6-4-3.9L7.6 7 10 1.8Z" />
    </svg>
  )
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <span className="review-stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} filled={index < filled} />
      ))}
    </span>
  )
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
  )
}

function reviewerInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

type ReviewModalProps = {
  product: Product
  userId: number
  reviewerName: string
  onClose: () => void
  onReviewAdded: (productId: number, review: ProductReview) => void
}

export function ReviewModal({
  product,
  userId,
  reviewerName,
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
  const [rating, setRating] = useState(0)
  const [commentError, setCommentError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reviews = product.reviews
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  useEffect(() => {
    const previouslyFocused = document.activeElement
    closeRef.current?.focus()

    const shell = document.querySelector('.app-shell')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    if (shell instanceof HTMLElement) {
      shell.setAttribute('inert', '')
    }

    return () => {
      document.body.style.overflow = previousOverflow
      if (shell instanceof HTMLElement) {
        shell.removeAttribute('inert')
      }
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [])

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) {
      return
    }

    const focusable = getFocusable(dialogRef.current)
    if (focusable.length === 0) {
      event.preventDefault()
      dialogRef.current.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      commentRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      await addComment({
        body,
        postId: product.id,
        userId,
      })

      onReviewAdded(product.id, {
        comment: body,
        rating,
        date: new Date().toISOString(),
        reviewerName,
      })
      setComment('')
      setRating(0)
      setCommentError('')
    } catch (error) {
      if (error instanceof CommentNetworkError || error instanceof CommentRequestError) {
        setFormError(error.message)
      } else {
        setFormError('Unable to add your comment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="review-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <header className="review-dialog-header">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button
            ref={closeRef}
            type="button"
            className="review-close"
            aria-label="Close reviews"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="review-dialog-body">
          <section className="review-composer" aria-labelledby={`${titleId}-add`}>
            <h3 id={`${titleId}-add`}>Add a comment</h3>
            <form className="review-form" onSubmit={handleSubmit} noValidate>
              <fieldset className="review-rating-fieldset" disabled={isSubmitting}>
                <legend>Your rating (optional)</legend>
                <div className="review-rating-options" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                      className={`review-rating-button${rating >= value ? ' is-selected' : ''}`}
                      onClick={() => setRating((current) => (current === value ? 0 : value))}
                    >
                      <Star filled={rating >= value} />
                    </button>
                  ))}
                </div>
              </fieldset>

              <label htmlFor={commentId}>Your comment</label>
              <textarea
                ref={commentRef}
                id={commentId}
                name="comment"
                rows={4}
                placeholder="Write your comment"
                value={comment}
                disabled={isSubmitting}
                aria-invalid={commentError ? true : undefined}
                aria-describedby={commentError ? commentErrorId : undefined}
                onChange={(event) => {
                  setComment(event.target.value)
                  if (commentError) setCommentError('')
                }}
              />
              {commentError ? (
                <p id={commentErrorId} className="review-field-error" role="alert">
                  {commentError}
                </p>
              ) : null}

              {formError ? (
                <p id={formErrorId} className="review-form-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <button className="review-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit comment'}
              </button>
            </form>
          </section>

          <section className="review-list-section" aria-labelledby={`${titleId}-list`}>
            <h3 id={`${titleId}-list`} className="visually-hidden">
              Customer reviews
            </h3>
            {reviews.length === 0 ? (
              <p className="review-empty" role="status">
                No reviews yet. Be the first to comment.
              </p>
            ) : (
              <>
                {average > 0 ? (
                  <p className="review-average">
                    Average rating {average.toFixed(1)} from {reviews.length}{' '}
                    {reviews.length === 1 ? 'review' : 'reviews'}
                  </p>
                ) : null}
                <ul className="review-list">
                  {reviews.map((review, index) => (
                    <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                      <div className="review-avatar" aria-hidden="true">
                        {reviewerInitial(review.reviewerName)}
                      </div>
                      <div className="review-item-body">
                        <div className="review-item-top">
                          <p className="review-author">{review.reviewerName}</p>
                          <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                        </div>
                        {review.rating > 0 ? <StarRow rating={review.rating} /> : null}
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
