import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { addCommentRequest, errorMessage } from './api'
import { useAuth } from './auth'
import { displayName, formatReviewDate } from './format'
import { CloseIcon, StarIcon } from './icons'
import { Stars } from './Stars'
import type { Product } from './types'

type ReviewModalProps = {
  product: Product | null
  onClose: () => void
  onCommentAdded: (
    productId: number,
    review: Product['reviews'][number],
  ) => void
}

export function ReviewModal({ product, onClose, onCommentAdded }: ReviewModalProps) {
  const { user } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [commentError, setCommentError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const open = product !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    }
    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setComment('')
      setRating(0)
      setCommentError('')
      setSubmitError('')
      setSubmitting(false)
    }
  }, [open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !user) return

    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      return
    }

    setCommentError('')
    setSubmitError('')
    setSubmitting(true)
    try {
      await addCommentRequest(body, product.id, user.id)
      onCommentAdded(product.id, {
        rating,
        comment: body,
        date: new Date().toISOString(),
        reviewerName: displayName(user.firstName, user.username),
      })
      setComment('')
      setRating(0)
    } catch (error) {
      setSubmitError(errorMessage(error, 'Unable to add your comment. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const reviews = product?.reviews ?? []

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      {product ? (
        <div className="review-dialog-inner">
          <header className="review-dialog-header">
            <h2 id={titleId}>Reviews ({reviews.length})</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close reviews">
              <CloseIcon className="icon-sm" />
            </button>
          </header>
          <div className="review-layout">
            <section className="review-summary" aria-label="Review summary">
              <p className="review-average">{product.rating.toFixed(1)}</p>
              <Stars value={product.rating} />
              <p className="muted">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </section>
            <form className="comment-form" onSubmit={handleSubmit} noValidate>
              <h3>Add a comment</h3>
              <fieldset className="rating-fieldset">
                <legend>Your rating (optional)</legend>
                <div className="rating-choices">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={value <= rating ? 'star-choice selected' : 'star-choice'}
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                      aria-pressed={value === rating}
                      onClick={() => setRating((current) => (current === value ? 0 : value))}
                    >
                      <StarIcon className="star-icon" filled={value <= rating} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="new-comment">Your comment</label>
              <textarea
                id="new-comment"
                name="comment"
                rows={4}
                placeholder="Write your comment"
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value)
                  if (commentError) setCommentError('')
                }}
                aria-invalid={commentError ? true : undefined}
                aria-describedby={commentError ? 'comment-error' : undefined}
                disabled={submitting}
              />
              {commentError ? (
                <p id="comment-error" className="field-error" role="alert">
                  {commentError}
                </p>
              ) : null}
              {submitError ? (
                <p className="field-error" role="alert">
                  {submitError}
                </p>
              ) : null}
              <button className="button-primary button-full" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit comment'}
              </button>
              <p className="muted comment-hint">Please be respectful and follow our community guidelines.</p>
            </form>
          </div>
          {reviews.length === 0 ? (
            <p className="empty-state" role="status">
              No reviews yet. Be the first to comment.
            </p>
          ) : (
            <ul className="review-list">
              {reviews.map((review, index) => (
                <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                  <div className="review-avatar" aria-hidden="true">
                    {(review.reviewerName.trim()[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="review-name">{review.reviewerName}</p>
                    {review.rating > 0 ? <Stars value={review.rating} /> : null}
                    <p className="review-comment">{review.comment}</p>
                  </div>
                  <time className="review-date" dateTime={review.date}>
                    {formatReviewDate(review.date)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </dialog>
  )
}
