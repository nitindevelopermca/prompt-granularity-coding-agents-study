import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { addComment, CommentRequestError } from '../api/comments'
import { useAuth } from '../auth/AuthContext'
import type { Product, ProductReview } from '../types/product'
import { CloseIcon, StarIcon } from './Icons'
import { formatReviewDate } from './productDisplay'
import './ReviewModal.css'

type ReviewModalProps = {
  product: Product
  onClose: () => void
  onReviewAdded: (productId: number, review: ProductReview) => void
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function StarDisplay({ value }: { value: number }) {
  const filled = Math.round(value)
  return (
    <span className="star-rating" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} className="star-rating-icon" filled={index < filled} />
      ))}
    </span>
  )
}

export function ReviewModal({ product, onClose, onReviewAdded }: ReviewModalProps) {
  const { session } = useAuth()
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const ratingGroupId = useId()

  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      root?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  function focusables(): HTMLElement[] {
    const root = dialogRef.current
    if (!root) {
      return []
    }
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
    )
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
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
      return
    }

    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const text = comment.trim()
    if (!text) {
      setFieldError('Enter a comment.')
      setFormError(null)
      commentRef.current?.focus()
      return
    }

    if (!session) {
      setFormError('You must be signed in to add a comment.')
      return
    }

    setIsSubmitting(true)
    setFieldError(null)
    setFormError(null)

    try {
      await addComment(text, product.id, session.id)
      const nextReview: ProductReview = {
        comment: text,
        date: new Date().toISOString(),
        reviewerName: 'You',
        rating,
      }
      onReviewAdded(product.id, nextReview)
      setComment('')
      setRating(0)
    } catch (error) {
      if (error instanceof CommentRequestError) {
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
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <header className="review-dialog-header">
          <h2 id={titleId}>Reviews</h2>
          <button ref={closeRef} type="button" className="review-close" aria-label="Close reviews" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <p className="review-product-title">{product.title}</p>

        {product.reviews.length === 0 ? (
          <p className="review-empty">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {product.reviews.map((review, index) => (
              <li key={`${product.id}-review-${index}`} className="review-item">
                <div className="review-item-top">
                  <strong>{review.reviewerName}</strong>
                  {review.rating > 0 ? <StarDisplay value={review.rating} /> : null}
                </div>
                {review.comment ? <p>{review.comment}</p> : null}
                <p className="review-date">{formatReviewDate(review.date)}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="review-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <h3 className="review-form-heading">Add a comment</h3>

          {formError ? (
            <p id={formErrorId} className="review-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <fieldset className="review-rating-fieldset">
            <legend id={ratingGroupId}>Rating (optional)</legend>
            <div className="review-rating-options" role="radiogroup" aria-labelledby={ratingGroupId}>
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className={rating === value ? 'review-star-option is-selected' : 'review-star-option'}>
                  <input
                    type="radio"
                    name="review-rating"
                    value={value}
                    checked={rating === value}
                    disabled={isSubmitting}
                    onChange={() => setRating(value)}
                  />
                  <StarIcon className="star-rating-icon" filled={rating >= value} />
                  <span className="visually-hidden">{value} star{value === 1 ? '' : 's'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="review-comment-field">
            <label htmlFor={commentId}>Comment</label>
            <textarea
              ref={commentRef}
              id={commentId}
              name="comment"
              rows={3}
              value={comment}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? commentErrorId : formError ? formErrorId : undefined}
              onChange={(event) => {
                setComment(event.target.value)
                if (fieldError || formError) {
                  setFieldError(null)
                  setFormError(null)
                }
              }}
            />
            {fieldError ? (
              <p id={commentErrorId} className="review-field-error" role="alert">
                {fieldError}
              </p>
            ) : null}
          </div>

          <button className="review-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
