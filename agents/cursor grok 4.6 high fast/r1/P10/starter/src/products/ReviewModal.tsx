import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { addProductComment, CommentRequestError } from './commentsApi'
import type { CatalogProduct, ProductReview } from './types'
import './ReviewModal.css'

type ReviewModalProps = {
  product: CatalogProduct
  open: boolean
  onClose: () => void
  onReviewAdded: (review: ProductReview) => void
}

function formatReviewDate(value: string): string {
  if (!value) {
    return 'Unknown date'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < filled ? 'is-filled' : undefined} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

function ReviewItem({ review }: { review: ProductReview }) {
  return (
    <article className="review-item">
      <header className="review-item-header">
        <h3>{review.reviewerName || 'Anonymous'}</h3>
        <time dateTime={review.date || undefined}>{formatReviewDate(review.date)}</time>
      </header>
      {review.rating > 0 ? <StarRow rating={review.rating} /> : null}
      {review.comment ? <p>{review.comment}</p> : null}
    </article>
  )
}

export default function ReviewModal({ product, open, onClose, onReviewAdded }: ReviewModalProps) {
  const { session } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const reviews = product.reviews

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      setFormError(null)
      commentRef.current?.focus()
      return
    }

    if (!session) {
      setFormError('You must be signed in to add a comment.')
      return
    }

    setCommentError(null)
    setFormError(null)
    setIsSubmitting(true)

    try {
      await addProductComment(body, product.id, session.id)
      const nextReview: ProductReview = {
        reviewerName: 'You',
        rating,
        comment: body,
        date: new Date().toISOString(),
      }
      onReviewAdded(nextReview)
      setComment('')
      setRating(0)
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

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose()
        }
      }}
    >
      <div className="review-dialog-panel">
        <header className="review-dialog-header">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button type="button" className="review-dialog-close" aria-label="Close reviews" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {reviews.length === 0 ? (
          <p className="review-empty">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((review, index) => (
              <li key={`${review.reviewerName}-${review.date}-${index}`}>
                <ReviewItem review={review} />
              </li>
            ))}
          </ul>
        )}

        <section className="review-comment-form" aria-label="Add a comment">
          <h3>Add a comment</h3>
          <form onSubmit={handleSubmit} noValidate aria-describedby={formError ? formErrorId : undefined}>
            <fieldset className="review-rating-picker" disabled={isSubmitting}>
              <legend>Rating (optional)</legend>
              <div role="radiogroup" aria-label="Rating, optional, 1 to 5 stars">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      className={value <= rating ? 'is-filled' : undefined}
                      onClick={() => setRating((current) => (current === value ? 0 : value))}
                    >
                      <span aria-hidden="true">★</span>
                      <span className="visually-hidden">{value} star{value === 1 ? '' : 's'}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <label className="review-comment-label" htmlFor={commentId}>
              Your comment
            </label>
            <textarea
              ref={commentRef}
              id={commentId}
              name="comment"
              placeholder="Write your comment"
              rows={3}
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
              <p id={commentErrorId} className="review-field-error">
                {commentError}
              </p>
            ) : null}

            {formError ? (
              <p id={formErrorId} className="review-form-error" role="alert">
                {formError}
              </p>
            ) : null}

            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit comment'}
            </button>
          </form>
        </section>
      </div>
    </dialog>
  )
}
