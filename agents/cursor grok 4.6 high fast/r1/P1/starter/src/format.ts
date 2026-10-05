import type { Product } from './types'

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`
}

export function originalPrice(price: number, discountPercentage: number): number | null {
  if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage >= 100) {
    return null
  }
  return price / (1 - discountPercentage / 100)
}

export function brandLabel(product: Product): string {
  const brand = product.brand?.trim()
  return brand ? `Brand: ${brand}` : 'Brand: Unknown'
}

export function formatReviewDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function galleryImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images.filter(Boolean)
  }
  return product.thumbnail ? [product.thumbnail] : []
}
