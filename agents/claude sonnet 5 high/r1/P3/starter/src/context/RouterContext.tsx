import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Route = '/login' | '/products' | '/cart'

const VALID_ROUTES: Route[] = ['/login', '/products', '/cart']

function isRoute(path: string): path is Route {
  return (VALID_ROUTES as string[]).includes(path)
}

function getInitialRoute(): Route {
  const path = window.location.pathname
  return isRoute(path) ? path : '/login'
}

interface RouterContextValue {
  route: Route
  navigate: (route: Route) => void
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => getInitialRoute())

  const navigate = useCallback((next: Route) => {
    setRoute(next)
    if (window.location.pathname !== next) {
      window.history.pushState({}, '', next)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setRoute(getInitialRoute())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const value = useMemo<RouterContextValue>(() => ({ route, navigate }), [route, navigate])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext)
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return ctx
}
