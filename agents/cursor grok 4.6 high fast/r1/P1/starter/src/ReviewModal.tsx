import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { addCommentRequest, isNetworkError } from './api'
import { useShellInert } from './shell'
import { useAuth } from './auth'
import { formatReviewDate } from './format'
import { CloseIcon } from './icons'
import { Stars } from './Stars'
import type { Product, Review } from './types'

type ReviewModalProps = {
  product: Product
  onClose: () => void
  onReviewAdded: (productId: number, review: Review) => void
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
}

export function ReviewModal({ product, onClose, onReviewAdded }: ReviewModalProps) {
  const { session } = useAuth()
  const titleId = useId()
  const commentId = useId()
  const ratingLabelId = useId()
  const commentErrorId = useId()
  const setShellInert = useShellInert()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const reviews = product.reviews ?? []
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [commentError, setCommentError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previouslyFocused = restoreFocusRef.current
    const dialog = dialogRef.current
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) {
        return
      }
      const focusable = getFocusable(dialog)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (!dialog.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setShellInert(true)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      setShellInert(false)
      previouslyFocused?.focus()
    }
  }, [onClose, setShellInert])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = comment.trim()
    if (!text) {
      setCommentError('Comment is required')
      setSubmitError('')
      return
    }
    if (!session) {
      setSubmitError('You must be signed in to comment.')
      return
    }

    setCommentError('')
    setSubmitError('')
    setSubmitting(true)
    try {
      await addCommentRequest(text, product.id, session.id)
      const nextReview: Review = {
        reviewerName: session.username || 'You',
        rating,
        comment: text,
        date: new Date().toISOString(),
      }
      onReviewAdded(product.id, nextReview)
      setComment('')
      setRating(0)
    } catch (error) {
      setSubmitError(
        isNetworkError(error)
          ? 'Network error. Your comment was not added.'
          : error instanceof Error
            ? error.message
            : 'Unable to add comment',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-button modal-close"
            onClick={onClose}
            aria-label="Close reviews"
          >
            <CloseIcon className="input-icon" />
          </button>
        </div>

        <form className="comment-form" onSubmit={handleSubmit} noValidate>
          <h3>Add a comment</h3>
          <div className="field">
            <p id={ratingLabelId} className="field-label">
              Your rating (optional)
            </p>
            <Stars
              value={rating}
              interactive
              onChange={setRating}
              labelledBy={ratingLabelId}
              name={`rating-${product.id}`}
            />
          </div>
          <div className="field">
            <label htmlFor={commentId}>Comment</label>
            <textarea
              id={commentId}
              rows={3}
              placeholder="Write your comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
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
          {submitError ? (
            <p className="field-error" role="alert">
              {submitError}
            </p>
          ) : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit comment'}
          </button>
        </form>

        <div className="review-list">
          {reviews.length === 0 ? (
            <p className="empty-copy">No reviews yet. Be the first to comment.</p>
          ) : (
            <ul>
              {reviews.map((review, index) => (
                <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                  <div className="review-meta">
                    <span className="review-avatar" aria-hidden="true">
                      {(review.reviewerName || '?').charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="review-name">{review.reviewerName || 'Anonymous'}</p>
                      {review.rating > 0 ? (
                        <Stars value={review.rating} />
                      ) : (
                        <p className="muted">No rating</p>
                      )}
                    </div>
                    <time className="review-date" dateTime={review.date}>
                      {formatReviewDate(review.date)}
                    </time>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
