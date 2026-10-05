const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function formatMoney(value: number): string {
  return currency.format(value)
}

export function originalPrice(price: number, discountPercentage: number): number {
  if (discountPercentage <= 0 || discountPercentage >= 100) return price
  return price / (1 - discountPercentage / 100)
}

export function formatReviewDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value || 'Unknown date'
  return dateFormatter.format(parsed)
}

export function displayName(firstName?: string, username?: string): string {
  return firstName?.trim() || username?.trim() || 'You'
}
