type BrandMarkProps = {
  size?: 'login' | 'header'
}

export function BrandMark({ size = 'header' }: BrandMarkProps) {
  return (
    <span className={`brand brand--${size}`}>
      <span className="brand-badge" aria-hidden="true">
        <svg className="brand-bag" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 8h10l-.85 11.05A1.5 1.5 0 0 1 14.66 20.5H9.34a1.5 1.5 0 0 1-1.49-1.45L7 8Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M9 8V6.4A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.4V8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span className="brand-name">MyShop</span>
    </span>
  )
}
