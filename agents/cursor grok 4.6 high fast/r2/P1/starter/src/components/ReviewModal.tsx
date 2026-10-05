import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { addCommentRequest } from '../api'
import { useAuth } from '../auth'
import { CloseIcon, StarIcon } from '../icons'
import type { Product, Review } from '../types'
import { formatDate } from '../utils'

type ReviewModalProps = {
  product: Product
  onClose: () => void
  onReviewsChange: (productId: number, reviews: Review[]) => void
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function ReviewModal({ product, onClose, onReviewsChange }: ReviewModalProps) {
  const { session } = useAuth()
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const ratingLabelId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const [body, setBody] = useState('')
  const [rating, setRating] = useState(0)
  const [commentError, setCommentError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true',
      )
      if (nodes.length === 0) {
        event.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const shell = document.querySelector('.app-shell')
    shell?.setAttribute('inert', '')

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      shell?.removeAttribute('inert')
      restoreFocusRef.current?.focus()
    }
  }, [onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }
    const text = body.trim()
    if (!text) {
      setCommentError('Comment is required')
      setFormError('')
      return
    }
    setCommentError('')
    setFormError('')
    setSubmitting(true)
    try {
      await addCommentRequest(text, product.id, session.id)
      const nextReview: Review = {
        reviewerName: session.firstName || session.username || 'You',
        rating,
        comment: text,
        date: new Date().toISOString(),
      }
      onReviewsChange(product.id, [...product.reviews, nextReview])
      setBody('')
      setRating(0)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  function onStarKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, value: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      setRating(Math.min(5, value + 1))
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      setRating(Math.max(0, value - 1))
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id={titleId}>Reviews</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-button close-button"
            onClick={onClose}
            aria-label="Close reviews"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="dialog-subtitle">{product.title}</p>

        {product.reviews.length === 0 ? (
          <p className="empty-state" role="status">
            No reviews yet. Be the first to comment.
          </p>
        ) : (
          <ul className="review-list">
            {product.reviews.map((review, index) => (
              <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                <div className="review-meta">
                  <strong>{review.reviewerName}</strong>
                  {review.rating > 0 ? (
                    <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, star) => (
                        <StarIcon key={star} className="star-icon" filled={star < review.rating} />
                      ))}
                    </span>
                  ) : null}
                  {review.date ? <time dateTime={review.date}>{formatDate(review.date)}</time> : null}
                </div>
                <p>{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="comment-form" onSubmit={handleSubmit} noValidate>
          <h3>Add a comment</h3>
          {formError ? (
            <p className="form-error" id={formErrorId} role="alert">
              {formError}
            </p>
          ) : null}

          <div className="field">
            <span className="field-label" id={ratingLabelId}>
              Rating (optional)
            </span>
            <div className="star-picker" role="group" aria-labelledby={ratingLabelId}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= rating ? 'star-button selected' : 'star-button'}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={value <= rating}
                  onClick={() => setRating((current) => (current === value ? 0 : value))}
                  onKeyDown={(event) => onStarKeyDown(event, value)}
                >
                  <StarIcon filled={value <= rating} />
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor={commentId}>Comment</label>
            <textarea
              id={commentId}
              name="comment"
              rows={3}
              value={body}
              placeholder="Share your thoughts about this product"
              onChange={(event) => setBody(event.target.value)}
              aria-invalid={commentError ? true : undefined}
              aria-describedby={commentError ? commentErrorId : undefined}
              disabled={submitting}
            />
            {commentError ? (
              <p className="field-error" id={commentErrorId} role="alert">
                {commentError}
              </p>
            ) : null}
          </div>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
