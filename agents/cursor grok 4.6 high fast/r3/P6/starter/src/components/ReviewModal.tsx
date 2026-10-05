import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { addComment, CommentRequestError } from '../api/comments'
import type { CatalogProduct, ProductReview } from '../api/products'
import './ReviewModal.css'

type ReviewModalProps = {
  product: CatalogProduct
  userId: number
  onClose: () => void
  onReviewAdded: (productId: number, review: ProductReview) => void
}

function formatReviewDate(value: string): string {
  if (value === '') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function starText(rating: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(rating)))
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`
}

export function ReviewModal({ product, userId, onClose, onReviewAdded }: ReviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [commentError, setCommentError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) {
      dialog.showModal()
    }
    titleRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onCancel(event: Event) {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', onCancel)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      document.body.style.overflow = previousOverflow
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [onClose])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextComment = comment.trim()
    if (nextComment === '') {
      setCommentError('Comment is required.')
      setFormError('')
      return
    }

    if (!userId) {
      setFormError('You must be signed in to add a comment.')
      return
    }

    setCommentError('')
    setFormError('')
    setLoading(true)

    try {
      await addComment(nextComment, product.id, userId)
      const review: ProductReview = {
        reviewerName: 'You',
        rating: rating ?? 0,
        comment: nextComment,
        date: new Date().toISOString(),
      }
      onReviewAdded(product.id, review)
      setComment('')
      setRating(undefined)
    } catch (caught) {
      setFormError(
        caught instanceof CommentRequestError
          ? caught.message
          : 'Unable to add your comment. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby="reviews-title"
      onClick={handleBackdropClick}
    >
      <div className="review-modal">
        <div className="review-modal-header">
          <div>
            <h2 id="reviews-title" ref={titleRef} tabIndex={-1}>
              Reviews
            </h2>
            <p className="review-modal-product">{product.title}</p>
          </div>
          <button
            type="button"
            className="review-modal-close"
            aria-label="Close reviews"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {product.reviews.length === 0 ? (
          <p className="review-empty">No reviews yet.</p>
        ) : (
          <ul className="review-list">
            {product.reviews.map((review, index) => {
              const dateLabel = formatReviewDate(review.date)
              return (
                <li
                  key={`${product.id}-${review.reviewerName}-${review.date}-${index}`}
                  className="review-item"
                >
                  <div className="review-item-top">
                    <p className="review-item-name">{review.reviewerName}</p>
                    {dateLabel ? <p className="review-item-date">{dateLabel}</p> : null}
                  </div>
                  {review.rating > 0 ? (
                    <p className="review-item-rating" aria-label={`Rated ${review.rating} out of 5`}>
                      {starText(review.rating)}
                    </p>
                  ) : null}
                  <p className="review-item-comment">{review.comment}</p>
                </li>
              )
            })}
          </ul>
        )}

        <form className="review-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <h3>Add a comment</h3>

          <div>
            <label htmlFor="new-comment">Comment</label>
            <textarea
              id="new-comment"
              name="comment"
              value={comment}
              disabled={loading}
              aria-invalid={commentError !== ''}
              aria-describedby={commentError ? 'new-comment-error' : undefined}
              onChange={(event) => {
                setComment(event.target.value)
                setCommentError('')
                setFormError('')
              }}
            />
            {commentError ? (
              <p id="new-comment-error" className="review-error" role="alert">
                {commentError}
              </p>
            ) : null}
          </div>

          <fieldset className="review-rating-options">
            <legend>Rating (optional)</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="comment-rating"
                  value={value}
                  checked={rating === value}
                  disabled={loading}
                  onChange={() => {
                    setRating(value)
                    setFormError('')
                  }}
                />
                {value} star{value === 1 ? '' : 's'}
              </label>
            ))}
          </fieldset>

          {formError ? (
            <p className="review-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="review-form-actions">
            <button className="review-submit" type="submit" disabled={loading}>
              {loading ? 'Posting…' : 'Submit comment'}
            </button>
            {rating !== undefined ? (
              <button
                className="review-clear-rating"
                type="button"
                disabled={loading}
                onClick={() => setRating(undefined)}
              >
                Clear rating
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </dialog>
  )
}
