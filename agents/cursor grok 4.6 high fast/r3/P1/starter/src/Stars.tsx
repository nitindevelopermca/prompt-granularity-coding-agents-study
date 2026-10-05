import { StarIcon } from './icons'

type StarsProps = {
  value: number
  max?: number
}

export function Stars({ value, max = 5 }: StarsProps) {
  const rounded = Math.max(0, Math.min(max, Math.round(value)))
  return (
    <span className="stars" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => (
        <StarIcon key={index} className="star-icon" filled={index < rounded} />
      ))}
    </span>
  )
}
