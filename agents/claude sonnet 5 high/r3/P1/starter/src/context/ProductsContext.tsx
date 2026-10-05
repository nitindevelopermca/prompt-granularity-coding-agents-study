import { createContext, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, fetchProducts, searchProductsRequest } from '../api.ts'
import type { Product, Review } from '../types.ts'

const PAGE_LIMIT = 10

interface ProductsContextValue {
  // Lazy-loaded catalog
  products: Product[]
  total: number
  isInitialLoading: boolean
  isLoadingMore: boolean
  loadError: string | null
  loadMoreError: string | null
  hasMore: boolean
  loadInitialProducts: () => void
  loadMoreProducts: () => void

  // Search
  searchQuery: string
  searchResults: Product[]
  isSearching: boolean
  searchError: string | null
  hasSearched: boolean
  setSearchQuery: (query: string) => void
  runSearch: (query: string) => void
  clearSearch: () => void

  // Shared review/comment update
  addCommentToProduct: (productId: number, review: Review) => void
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const hasLoadedInitial = useRef(false)
  const productsLengthRef = useRef(0)
  productsLengthRef.current = products.length

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function loadInitialProducts() {
    if (hasLoadedInitial.current) return
    hasLoadedInitial.current = true
    setIsInitialLoading(true)
    setLoadError(null)
    try {
      const response = await fetchProducts(PAGE_LIMIT, 0)
      setProducts(response.products)
      setTotal(response.total)
    } catch (error) {
      hasLoadedInitial.current = false
      const message = error instanceof ApiError ? error.message : 'Failed to load products.'
      setLoadError(message)
    } finally {
      setIsInitialLoading(false)
    }
  }

  async function loadMoreProducts() {
    if (isLoadingMore) return
    setIsLoadingMore(true)
    setLoadMoreError(null)
    const skip = productsLengthRef.current
    try {
      const response = await fetchProducts(PAGE_LIMIT, skip)
      setProducts((prev) => [...prev, ...response.products])
      setTotal(response.total)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load more products.'
      setLoadMoreError(message)
    } finally {
      setIsLoadingMore(false)
    }
  }

  async function runSearch(query: string) {
    const trimmed = query.trim()
    if (!trimmed) {
      setHasSearched(false)
      setSearchResults([])
      setSearchError(null)
      return
    }
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    try {
      const response = await searchProductsRequest(trimmed)
      setSearchResults(response.products)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Search failed. Please try again.'
      setSearchError(message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setSearchError(null)
  }

  function addCommentToProduct(productId: number, review: Review) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, reviews: [review, ...product.reviews] } : product,
      ),
    )
    setSearchResults((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, reviews: [review, ...product.reviews] } : product,
      ),
    )
  }

  const hasMore = products.length < total

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      total,
      isInitialLoading,
      isLoadingMore,
      loadError,
      loadMoreError,
      hasMore,
      loadInitialProducts,
      loadMoreProducts,
      searchQuery,
      searchResults,
      isSearching,
      searchError,
      hasSearched,
      setSearchQuery,
      runSearch,
      clearSearch,
      addCommentToProduct,
    }),
    [
      products,
      total,
      isInitialLoading,
      isLoadingMore,
      loadError,
      loadMoreError,
      hasMore,
      searchQuery,
      searchResults,
      isSearching,
      searchError,
      hasSearched,
    ],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts(): ProductsContextValue {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }
  return context
}
