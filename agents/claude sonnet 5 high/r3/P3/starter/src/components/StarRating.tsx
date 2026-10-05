import { StarIcon } from './icons'
import './StarRating.css'

interface StarRatingProps {
  rating: number
  max?: number
}

/** Read-only star rating display. Presentational only; caller supplies the accessible name. */
export function StarRating({ rating, max = 5 }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, index) => index < Math.round(rating))
  return (
    <span className="star-rating" aria-hidden="true">
      {stars.map((filled, index) => (
        <StarIcon key={index} filled={filled} className={filled ? 'star-rating__star star-rating__star--filled' : 'star-rating__star'} />
      ))}
    </span>
  )
}

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  label: string
}

/** Interactive star picker (1–max) used for the optional "your rating" control. */
export function StarRatingInput({ value, onChange, max = 5, label }: StarRatingInputProps) {
  return (
    <div className="star-rating-input" role="radiogroup" aria-label={label}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1
        const isSelected = value === starValue
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            className={starValue <= value ? 'star-rating-input__star star-rating-input__star--filled' : 'star-rating-input__star'}
            onClick={() => onChange(starValue === value ? 0 : starValue)}
          >
            <StarIcon filled={starValue <= value} />
          </button>
        )
      })}
    </div>
  )
}
