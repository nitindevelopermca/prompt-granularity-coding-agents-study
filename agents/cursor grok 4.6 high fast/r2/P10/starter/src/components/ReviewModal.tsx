import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CommentError, addProductComment } from '../api/comments'
import type { ProductReview } from '../api/products'

type ReviewModalProps = {
  open: boolean
  productId: number
  productTitle: string
  userId: number | null
  reviews: ProductReview[]
  onClose: () => void
  onReviewsChange: (reviews: ProductReview[]) => void
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="product-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'is-filled' : undefined}>
          ★
        </span>
      ))}
    </span>
  )
}

function formatReviewDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function reviewerInitial(name: string): string {
  const initial = name.trim().charAt(0)
  return initial ? initial.toUpperCase() : '?'
}

export default function ReviewModal({
  open,
  productId,
  productTitle,
  userId,
  reviews,
  onClose,
  onReviewsChange,
}: ReviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const formHeadingId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [commentError, setCommentError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      setFormError('')
      commentRef.current?.focus()
      return
    }

    if (userId === null) {
      setFormError('You must be signed in to add a comment.')
      return
    }

    setCommentError('')
    setFormError('')
    setIsSubmitting(true)

    try {
      const result = await addProductComment({ body, postId: productId, userId })
      const nextReview: ProductReview = {
        reviewerName: result.reviewerName,
        rating: rating ?? 0,
        comment: result.body,
        date: new Date().toISOString(),
      }
      onReviewsChange([...reviews, nextReview])
      setComment('')
      setRating(null)
    } catch (error) {
      setFormError(error instanceof CommentError ? error.message : 'Unable to add your comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const countLabel = `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="review-dialog-inner">
        <header className="review-dialog-head">
          <h2 id={titleId}>Reviews ({reviews.length})</h2>
          <button type="button" className="review-close" onClick={onClose} aria-label="Close reviews">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <p className="review-dialog-product">Reviews for {productTitle}</p>

        <div className="review-dialog-body">
          <div className="review-dialog-main">
            {reviews.length === 0 ? (
              <p className="review-empty" role="status">
                No reviews yet.
              </p>
            ) : (
              <ul className="review-list">
                {reviews.map((review, index) => (
                  <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                    <div className="review-avatar" aria-hidden="true">
                      {reviewerInitial(review.reviewerName)}
                    </div>
                    <div className="review-item-body">
                      <div className="review-item-meta">
                        <h3 className="review-author">{review.reviewerName}</h3>
                        <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                      </div>
                      {review.rating > 0 ? (
                        <p className="review-rating">
                          <StarRow rating={review.rating} />
                          <span className="sr-only">{`${review.rating} out of 5 stars`}</span>
                        </p>
                      ) : null}
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="sr-only">{countLabel}</p>
          </div>

          <form
            className="review-form"
            aria-labelledby={formHeadingId}
            aria-busy={isSubmitting}
            onSubmit={(event) => void handleSubmit(event)}
          >
            <h3 id={formHeadingId}>Add a comment</h3>

            <div className="review-rating-picker" role="group" aria-label="Your rating (optional)">
              <p className="review-rating-label">Your rating</p>
              <div className="review-rating-stars">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={rating !== null && value <= rating ? 'is-selected' : undefined}
                    aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                    aria-pressed={rating === value}
                    disabled={isSubmitting}
                    onClick={() => setRating((current) => (current === value ? null : value))}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <label htmlFor={commentId}>Your comment</label>
            <textarea
              ref={commentRef}
              id={commentId}
              name="comment"
              rows={4}
              placeholder="Write your comment"
              value={comment}
              disabled={isSubmitting}
              aria-invalid={Boolean(commentError)}
              aria-describedby={commentError ? commentErrorId : undefined}
              onChange={(event) => {
                setComment(event.target.value)
                if (commentError) {
                  setCommentError('')
                }
                if (formError) {
                  setFormError('')
                }
              }}
            />
            {commentError ? (
              <p id={commentErrorId} className="review-field-error" role="alert">
                {commentError}
              </p>
            ) : null}

            {formError ? (
              <p id={formErrorId} className="review-field-error" role="alert">
                {formError}
              </p>
            ) : null}

            <button className="review-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit comment'}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
