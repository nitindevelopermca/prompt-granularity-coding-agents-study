import type { Product } from '../types/product'

export function brandLabel(brand: string | undefined): string {
  return brand?.trim() ? brand : 'Brand unavailable'
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export function formatDiscount(value: number): string {
  return `${value.toFixed(2)}% off`
}

export function formatReviewDate(iso: string): string {
  if (!iso) {
    return 'Unknown date'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function mainImageSrc(product: Product): string {
  return product.thumbnail || product.images[0] || ''
}

export function reviewCountLabel(count: number): string {
  return count === 1 ? '1 review' : `${count} reviews`
}
