import { StarIcon } from './icons'

interface DisplayProps {
  rating: number
  outOf?: number
}

/** Read-only star display (rounded to the nearest whole star). */
export function StarRatingDisplay({ rating, outOf = 5 }: DisplayProps) {
  const rounded = Math.round(rating)
  return (
    <span className="star-rating" aria-hidden="true">
      {Array.from({ length: outOf }, (_, index) => (
        <StarIcon key={index} filled={index < rounded} />
      ))}
    </span>
  )
}

interface InputProps {
  value: number
  onChange: (value: number) => void
  label: string
}

/** Interactive 1-5 star picker used for the optional "Your rating" control. */
export function StarRatingInput({ value, onChange, label }: InputProps) {
  return (
    <div role="radiogroup" aria-label={label} className="star-rating-input">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          role="radio"
          aria-checked={value === starValue}
          aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
          className="star-rating-input__button"
          onClick={() => onChange(starValue)}
        >
          <StarIcon filled={starValue <= value} />
        </button>
      ))}
    </div>
  )
}
