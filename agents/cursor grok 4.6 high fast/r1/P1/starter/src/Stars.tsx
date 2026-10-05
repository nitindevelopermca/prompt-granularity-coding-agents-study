type StarsProps = {
  value: number
  interactive?: boolean
  onChange?: (value: number) => void
  labelledBy?: string
  name?: string
}

export function Stars({ value, interactive = false, onChange, labelledBy, name }: StarsProps) {
  const rounded = Math.max(0, Math.min(5, value))

  if (!interactive) {
    return (
      <span className="stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < Math.round(rounded) ? 'star is-on' : 'star'}>
            ★
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className="star-picker" role="radiogroup" aria-labelledby={labelledBy}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <label key={rating} className={rating <= rounded ? 'star-option is-on' : 'star-option'}>
          <input
            type="radio"
            name={name}
            value={rating}
            checked={rounded === rating}
            onChange={() => onChange?.(rating)}
          />
          <span aria-hidden="true">★</span>
          <span className="sr-only">{`${rating} star${rating === 1 ? '' : 's'}`}</span>
        </label>
      ))}
    </div>
  )
}
