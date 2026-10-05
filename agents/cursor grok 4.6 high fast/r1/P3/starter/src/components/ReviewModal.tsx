import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { addComment, CommentRequestError } from '../api/comments'
import type { Product, ProductReview } from '../types/product'
import { CloseIcon, StarIcon } from './Icons'
import { StarRating, formatReviewDate } from './productDisplay'
import './ReviewModal.css'

type ReviewModalProps = {
  product: Product | null
  userId: number
  onClose: () => void
  onReviewsChange: (productId: number, reviews: ProductReview[]) => void
}

export function ReviewModal({ product, userId, onClose, onReviewsChange }: ReviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = product !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
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
      setRating(null)
      setCommentError(null)
      setFormError(null)
      setIsSubmitting(false)
    }
  }, [open, product?.id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || isSubmitting) {
      return
    }

    const body = comment.trim()
    if (!body) {
      setCommentError('Enter a comment.')
      commentRef.current?.focus()
      return
    }

    setCommentError(null)
    setFormError(null)
    setIsSubmitting(true)
    try {
      await addComment(body, product.id, userId)
      const nextReview: ProductReview = {
        reviewerName: 'You',
        comment: body,
        date: new Date().toISOString(),
      }
      if (rating !== null) {
        nextReview.rating = rating
      }
      onReviewsChange(product.id, [...product.reviews, nextReview])
      setComment('')
      setRating(null)
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

  return (
    <dialog
      ref={dialogRef}
      className="review-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          dialogRef.current.close()
        }
      }}
    >
      <div className="review-dialog-panel">
        <div className="review-dialog-header">
          <h2 id={titleId}>Reviews</h2>
          <button
            type="button"
            className="review-dialog-close"
            aria-label="Close reviews"
            onClick={() => dialogRef.current?.close()}
          >
            <CloseIcon />
          </button>
        </div>

        {product ? (
          <>
            <p className="review-dialog-product">{product.title}</p>

            {product.reviews.length === 0 ? (
              <p className="review-empty">No reviews yet.</p>
            ) : (
              <ul className="review-list">
                {product.reviews.map((review, index) => (
                  <li key={`${review.reviewerName}-${review.date}-${index}`} className="review-item">
                    <div className="review-item-head">
                      <strong>{review.reviewerName}</strong>
                      {typeof review.rating === 'number' ? <StarRating value={review.rating} /> : null}
                    </div>
                    <p>{review.comment}</p>
                    {review.date ? <p className="review-date">{formatReviewDate(review.date)}</p> : null}
                  </li>
                ))}
              </ul>
            )}

            <form className="review-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
              <h3>Add a comment</h3>

              {formError ? (
                <p id={formErrorId} className="review-form-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <fieldset className="review-stars-fieldset">
                <legend>Rating (optional)</legend>
                <div className="review-star-picker">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = rating === value
                    return (
                      <button
                        key={value}
                        type="button"
                        className={selected ? 'is-selected' : undefined}
                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                        aria-pressed={selected}
                        disabled={isSubmitting}
                        onClick={() => setRating((current) => (current === value ? null : value))}
                      >
                        <StarIcon filled={rating !== null && value <= rating} />
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label htmlFor={commentId}>Comment</label>
              <textarea
                ref={commentRef}
                id={commentId}
                name="comment"
                rows={3}
                value={comment}
                disabled={isSubmitting}
                aria-invalid={Boolean(commentError)}
                aria-describedby={commentError ? commentErrorId : formError ? formErrorId : undefined}
                onChange={(event) => {
                  setComment(event.target.value)
                  if (commentError || formError) {
                    setCommentError(null)
                    setFormError(null)
                  }
                }}
              />
              {commentError ? (
                <p id={commentErrorId} className="review-form-error" role="alert">
                  {commentError}
                </p>
              ) : null}

              <button type="submit" className="review-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting…' : 'Add comment'}
              </button>
            </form>
          </>
        ) : null}
      </div>
    </dialog>
  )
}
