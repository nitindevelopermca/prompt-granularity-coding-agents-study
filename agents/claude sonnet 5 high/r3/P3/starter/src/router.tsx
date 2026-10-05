import { createContext, useContext } from 'react'

export type AppRoute = '/login' | '/products' | '/cart'

export function routeFromPath(pathname: string): AppRoute {
  if (pathname.startsWith('/cart')) return '/cart'
  if (pathname.startsWith('/products')) return '/products'
  return '/login'
}

interface RouterContextValue {
  route: AppRoute
  navigate: (to: AppRoute, options?: { replace?: boolean }) => void
}

export const RouterContext = createContext<RouterContextValue | null>(null)

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext)
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterContext provider')
  }
  return ctx
}
