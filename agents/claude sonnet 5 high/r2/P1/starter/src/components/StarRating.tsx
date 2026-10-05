import { StarIcon } from './Icons'
import './StarRating.css'

interface StarRatingDisplayProps {
  rating: number
  outOf?: number
  size?: number
}

/** Read-only star display. Renders a filled star for each whole point, rounded to the nearest star. */
export function StarRatingDisplay({ rating, outOf = 5, size = 16 }: StarRatingDisplayProps) {
  const rounded = Math.max(0, Math.min(outOf, Math.round(rating)))
  return (
    <span className="star-rating" role="img" aria-label={`Rated ${rating.toFixed(1)} out of ${outOf} stars`}>
      {Array.from({ length: outOf }, (_, index) => (
        <StarIcon
          key={index}
          width={size}
          height={size}
          filled={index < rounded}
          className={index < rounded ? 'star-rating__icon star-rating__icon--filled' : 'star-rating__icon'}
        />
      ))}
    </span>
  )
}

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  outOf?: number
}

/** Interactive 1-N star picker used by the "Add a comment" form. */
export function StarRatingInput({ value, onChange, outOf = 5 }: StarRatingInputProps) {
  return (
    <div className="star-rating-input" role="group" aria-label="Your rating">
      {Array.from({ length: outOf }, (_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= value
        return (
          <button
            key={starValue}
            type="button"
            className="star-rating-input__button"
            aria-pressed={isFilled}
            aria-label={`Rate ${starValue} out of ${outOf} star${starValue === 1 ? '' : 's'}`}
            onClick={() => onChange(starValue === value ? 0 : starValue)}
          >
            <StarIcon
              width={22}
              height={22}
              filled={isFilled}
              className={isFilled ? 'star-rating-input__icon star-rating-input__icon--filled' : 'star-rating-input__icon'}
            />
          </button>
        )
      })}
    </div>
  )
}
