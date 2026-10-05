import { StarIcon } from './Icons'
import './StarRating.css'

export function StarRating({ value }: { value: number }) {
  return (
    <span className="star-rating" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.min(1, Math.max(0, value - index))
        return (
          <span className="star-rating-star" key={index}>
            <StarIcon className="star-rating-empty" />
            <span className="star-rating-fill" style={{ width: `${fill * 100}%` }}>
              <StarIcon />
            </span>
          </span>
        )
      })}
    </span>
  )
}
