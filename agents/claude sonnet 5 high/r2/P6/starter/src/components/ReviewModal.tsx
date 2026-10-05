import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { ProductReview } from '../types'
import { CloseIcon, StarIcon } from './icons'
import styles from './ReviewModal.module.css'

interface ReviewModalProps {
  productTitle: string
  reviews: ProductReview[]
  onClose: () => void
  onSubmit: (body: string, rating: number | null) => Promise<void>
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function ReviewModal({ productTitle, reviews, onClose, onSubmit }: ReviewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<Element | null>(null)

  const [commentText, setCommentText] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const titleId = useId()
  const textareaId = useId()
  const errorId = useId()

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement
    closeButtonRef.current?.focus()
    return () => {
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled'),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) {
      setValidationError('Please enter a comment before submitting.')
      return
    }
    setValidationError(null)
    setSubmitError(null)
    setSubmitting(true)
    try {
      await onSubmit(trimmed, rating)
      setCommentText('')
      setRating(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not add your comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Reviews &mdash; {productTitle}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close reviews dialog"
          >
            <CloseIcon />
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className={styles.emptyState}>No reviews yet. Be the first to share your thoughts.</p>
        ) : (
          <ul className={styles.reviewList} aria-label={`Reviews for ${productTitle}`}>
            {reviews.map((review, index) => (
              <li key={`${review.reviewerName}-${review.date}-${index}`} className={styles.reviewItem}>
                <div className={styles.reviewTop}>
                  <span className={styles.reviewerName}>{review.reviewerName}</span>
                  <span className={styles.reviewDate}>{formatDate(review.date)}</span>
                </div>
                <div
                  className={styles.reviewStars}
                  role="img"
                  aria-label={`Rated ${review.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= review.rating} width={14} height={14} />
                  ))}
                </div>
                <p className={styles.reviewComment}>{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.formTitle}>Add a comment</p>

          {submitError && (
            <div className={`alert alert-error ${styles.formError}`} role="alert">
              {submitError}
            </div>
          )}

          <label htmlFor={textareaId} className={styles.label}>
            Your comment
          </label>
          <textarea
            id={textareaId}
            className={styles.textarea}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts about this product"
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? errorId : undefined}
            disabled={submitting}
          />
          {validationError && (
            <p className={styles.formError} id={errorId} role="alert" style={{ color: 'var(--color-danger)', margin: 0, fontSize: '0.8rem' }}>
              {validationError}
            </p>
          )}

          <span className={styles.label} id={`${textareaId}-rating-label`}>
            Rating (optional)
          </span>
          <div className={styles.starPicker} role="group" aria-labelledby={`${textareaId}-rating-label`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-pressed={rating !== null && star <= rating}
                className={`${styles.starPickButton} ${rating !== null && star <= rating ? styles.starPickButtonActive : ''}`}
                aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                onClick={() => setRating((prev) => (prev === star ? null : star))}
                disabled={submitting}
              >
                <StarIcon filled={rating !== null && star <= rating} width={18} height={18} />
              </button>
            ))}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              <span>{submitting ? 'Submitting\u2026' : 'Submit comment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
