import { StarIcon } from './Icons'

type StarRatingProps = {
  value: number
  max?: number
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  const rounded = Math.round(Math.min(max, Math.max(0, value)))
  return (
    <span className="star-rating" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => (
        <StarIcon key={index} filled={index < rounded} className="star-rating-icon" />
      ))}
    </span>
  )
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function originalPrice(price: number, discountPercentage: number): number | null {
  if (discountPercentage <= 0 || discountPercentage >= 100) {
    return null
  }
  return price / (1 - discountPercentage / 100)
}

export function formatReviewDate(value: string): string {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
