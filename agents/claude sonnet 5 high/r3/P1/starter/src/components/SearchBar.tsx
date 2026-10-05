import { useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { SearchIcon } from './icons.tsx'

const DEBOUNCE_MS = 400

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  onClear: () => void
}

/**
 * Search field for the product listing. Submits immediately on Enter/click,
 * and also debounces while typing. An empty query returns to the paginated
 * catalog rather than issuing a search request.
 */
export function SearchBar({ value, onChange, onSearch, onClear }: SearchBarProps) {
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current)
    }

    const trimmed = value.trim()
    if (!trimmed) {
      onClear()
      return
    }

    debounceRef.current = window.setTimeout(() => {
      onSearch(trimmed)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current)
      }
    }
    // Intentionally only re-run when the input value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current)
    }
    const trimmed = value.trim()
    if (!trimmed) {
      onClear()
      return
    }
    onSearch(trimmed)
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <label htmlFor="product-search" className="visually-hidden">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        placeholder="Search products"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" aria-label="Search products">
        <SearchIcon />
      </button>
    </form>
  )
}
