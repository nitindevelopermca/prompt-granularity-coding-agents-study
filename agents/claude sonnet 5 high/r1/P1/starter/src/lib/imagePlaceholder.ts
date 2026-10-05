// Inline SVG data URI used whenever a product image is missing or fails to
// load, so cards never show a broken-image icon.
export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#F1F5F9"/>
      <g fill="none" stroke="#94A3B8" stroke-width="2">
        <rect x="40" y="50" width="120" height="100" rx="6"/>
        <circle cx="70" cy="80" r="10"/>
        <path d="M40 140l35-35 25 25 20-20 40 40"/>
      </g>
    </svg>`,
  )
