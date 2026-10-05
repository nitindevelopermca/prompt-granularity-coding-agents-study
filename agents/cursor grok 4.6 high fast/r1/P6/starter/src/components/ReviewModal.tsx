import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { addComment, CommentRequestError } from '../api/comments'
import type { Product, ProductReview } from '../types/product'
import { CloseIcon, StarIcon } from './Icons'
import { StarRating } from './StarRating'
import './ReviewModal.css'

interface ReviewModalProps {
  product: Product
  userId: number
  userName: string
  onClose: () => void
  onProductChange: (product: Product) => void
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatReviewDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReviewModal({
  product,
  userId,
  userName,
  onClose,
  onProductChange,
}: ReviewModalProps) {
  const titleId = useId()
  const commentId = useId()
  const commentErrorId = useId()
  const formErrorId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reviews = product.reviews ?? []

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    closeRef.current?.focus()

    function focusables(): HTMLElement[] {
      const dialog = dialogRef.current
      if (!dialog) {
        return []
      }
      return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute('disabled'),
      )
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

      const nodes = focusables()
      if (nodes.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      root?.removeAttribute('inert')
      restoreFocusRef.current?.focus()
    }
  }, [onClose])

  function handleBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const body = comment.trim()
    if (!body) {
      setFieldError('Enter a comment.')
      setFormError(null)
      return
    }

    setIsSubmitting(true)
    setFieldError(null)
    setFormError(null)

    try {
      await addComment({
        body,
        postId: product.id,
        userId,
      })

      const nextReview: ProductReview = {
        reviewerName: userName,
        rating,
        comment: body,
        date: new Date().toISOString(),
      }

      onProductChange({
        ...product,
        reviews: [...reviews, nextReview],
      })
      setComment('')
      setRating(0)
    } catch (error) {
      setFormError(
        error instanceof CommentRequestError
          ? error.message
          : 'Unable to add your comment. Existing reviews are unchanged.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="review-backdrop" onMouseDown={handleBackdrop}>
      <div
        ref={dialogRef}
        className="review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
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
            <CloseIcon />
          </button>
        </header>

        <div className="review-dialog-body">
          <form className="review-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <h3>Add a comment</h3>

            <fieldset className="review-stars-fieldset">
              <legend>Your rating (optional)</legend>
              <div className="review-star-picker" role="group" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={rating >= value ? 'is-on' : undefined}
                    aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                    aria-pressed={rating === value}
                    disabled={isSubmitting}
                    onClick={() => setRating((current) => (current === value ? 0 : value))}
                  >
                    <StarIcon />
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor={commentId}>Comment</label>
            <textarea
              id={commentId}
              name="comment"
              rows={4}
              placeholder="Write your comment"
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
              <p id={commentErrorId} className="review-error" role="alert">
                {fieldError}
              </p>
            ) : null}
            {formError ? (
              <p id={formErrorId} className="review-error" role="alert">
                {formError}
              </p>
            ) : null}

            <button className="review-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit comment'}
            </button>
            <p className="review-hint">Please be respectful and follow our community guidelines.</p>
          </form>

          <section className="review-list-wrap" aria-labelledby={titleId}>
            {reviews.length === 0 ? (
              <p className="review-empty">No reviews yet.</p>
            ) : (
              <ul className="review-list">
                {reviews.map((review, index) => (
                  <li key={`${review.reviewerName}-${review.date}-${index}`}>
                    <article>
                      <header>
                        <h3>{review.reviewerName}</h3>
                        <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                      </header>
                      {review.rating > 0 ? (
                        <p className="review-row-rating">
                          <StarRating value={review.rating} />
                          <span className="visually-hidden">{review.rating} out of 5</span>
                        </p>
                      ) : null}
                      <p>{review.comment}</p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
