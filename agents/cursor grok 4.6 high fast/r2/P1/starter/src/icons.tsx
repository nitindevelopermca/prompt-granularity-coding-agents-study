type IconProps = {
  className?: string
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7 7V6a5 5 0 0 1 10 0v1h2.2c.9 0 1.6.8 1.5 1.7l-1.1 10A2 2 0 0 1 17.6 21H6.4a2 2 0 0 1-2-1.3l-1.1-10A1.5 1.5 0 0 1 4.8 7H7Zm2 0h6V6a3 3 0 0 0-6 0v1Z"
      />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.2 0-8 2.1-8 5.2V21h16v-1.8c0-3.1-3.8-5.2-8-5.2Z"
      />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Zm3 8.8V18h-2v-2.2a2 2 0 1 1 2 0Z"
      />
    </svg>
  )
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 5c5.5 0 9.7 4.3 10.8 6.2a1.5 1.5 0 0 1 0 1.6C21.7 14.7 17.5 19 12 19S2.3 14.7 1.2 12.8a1.5 1.5 0 0 1 0-1.6C2.3 9.3 6.5 5 12 5Zm0 3.5A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5Z"
      />
    </svg>
  )
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3.3 2.3 2 3.6l3.1 3.1C3.2 8.1 1.8 9.8 1.2 11.2a1.5 1.5 0 0 0 0 1.6C2.3 14.7 6.5 19 12 19c2 0 3.8-.5 5.3-1.3l3.1 3.1 1.3-1.3ZM12 17c-4.4 0-7.8-3.3-8.9-5.2.6-.9 1.8-2.4 3.6-3.5l2 2A3.5 3.5 0 0 0 12 15.5c.4 0 .8 0 1.1-.1l1.6 1.6A8.6 8.6 0 0 1 12 17Zm10.8-5.2c-.5.8-1.5 2.2-3 3.4l-1.5-1.5c1.1-.8 2-1.8 2.6-2.5C19.8 9.3 16.4 6 12 6c-.6 0-1.1 0-1.7.1L8.7 4.5C9.7 4.2 10.8 4 12 4c5.5 0 9.7 4.3 10.8 6.2a1.5 1.5 0 0 1 0 1.6Z"
      />
    </svg>
  )
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4.3 5H3V3h2.2l.4 2h13.9a1 1 0 0 1 1 1.2l-1.5 7A2 2 0 0 1 17 15H8.2l.4 2H18v2H7.3a2 2 0 0 1-2-1.6L3.2 5.4A1 1 0 0 1 4.3 5Z"
      />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.2 4.3-1.4 1.4-4.3-4.2A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
      />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z"
      />
    </svg>
  )
}

export function StarIcon({ className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        d="m12 3.6 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.5l.9-5.4-3.9-3.8 5.4-.8L12 3.6Z"
      />
    </svg>
  )
}
