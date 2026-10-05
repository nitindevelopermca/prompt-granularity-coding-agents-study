import { useCallback, useEffect, useState } from 'react'

export const LOGIN_PATH = '/'
export const PRODUCTS_PATH = '/products'
export const CART_PATH = '/cart'

export function usePathname(): {
  pathname: string
  navigate: (to: string) => void
} {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) {
      setPathname(to)
      return
    }

    window.history.pushState({}, '', to)
    setPathname(to)
  }, [])

  return { pathname, navigate }
}
