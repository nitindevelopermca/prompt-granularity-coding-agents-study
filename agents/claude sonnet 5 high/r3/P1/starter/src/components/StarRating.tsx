// Read-only star display and an interactive star picker used by the review
// modal's "Add a comment" form.

const STAR_VALUES = [1, 2, 3, 4, 5]

interface StarRatingProps {
  rating: number
  max?: number
}

/** Purely decorative star display; pair with visible text for meaning. */
export function StarRating({ rating, max = 5 }: StarRatingProps) {
  const stars = max === 5 ? STAR_VALUES : Array.from({ length: max }, (_, i) => i + 1)
  return (
    <span className="star-rating" aria-hidden="true">
      {stars.map((star) => (
        <span key={star} className={star <= Math.round(rating) ? 'star is-filled' : 'star'}>
          ★
        </span>
      ))}
    </span>
  )
}

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
}

/** Accessible 1-5 star picker exposed as a radio group. */
export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="star-rating-input" role="radiogroup" aria-label="Your rating">
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={star <= value ? 'star-input is-filled' : 'star-input'}
          onClick={() => onChange(star === value ? 0 : star)}
        >
          ★
        </button>
      ))}
    </div>
  )
}
